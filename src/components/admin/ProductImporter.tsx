'use client';

import { useState } from 'react';
import { Product } from '@/types/product';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

interface ProductImporterProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface JsonProduct {
  handleId: string;
  fieldType: string;
  name: string;
  description: string;
  productImageUrl?: string;
  collection?: string;
  sku: string;
  ribbon?: string;
  price: number;
  visible: boolean;
  inventory: string;
  additionalInfoTitle1?: string;
  additionalInfoDescription1?: string;
  additionalInfoTitle2?: string;
  additionalInfoDescription2?: string;
  additionalInfoTitle3?: string;
  additionalInfoDescription3?: string;
  brand?: string;
}

export default function ProductImporter({ onClose, onImportComplete }: ProductImporterProps) {
  const [jsonData, setJsonData] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importedCount, setImportedCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        setJsonData(event.target.result as string);
      }
    };
    
    reader.readAsText(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    setJsonData(pastedText);
  };

  const mapJsonToProduct = (jsonProduct: JsonProduct): Product => {
    // Extract whyWeLoveIt from additionalInfoDescription1
    const whyWeLoveIt = jsonProduct.additionalInfoDescription1 
      ? [jsonProduct.additionalInfoDescription1]
      : [''];
    
    // Extract howToUse from additionalInfoDescription2
    const howToUse = jsonProduct.additionalInfoDescription2
      ? [jsonProduct.additionalInfoDescription2]
      : [''];
    
    // Extract ingredients from additionalInfoDescription3
    const ingredients = jsonProduct.additionalInfoDescription3
      ? [jsonProduct.additionalInfoDescription3]
      : [''];
    
    // Map category from collection
    const category = jsonProduct.collection || '';
    
    // Map inStock from inventory
    const inStock = jsonProduct.inventory === 'InStock';
    
    // Create a new product with a unique ID
    return {
      id: uuidv4(),
      name: jsonProduct.name,
      description: jsonProduct.description,
      price: jsonProduct.price,
      images: jsonProduct.productImageUrl ? [jsonProduct.productImageUrl] : [],
      category,
      sku: jsonProduct.sku,
      inStock,
      whyWeLoveIt,
      howToUse,
      ingredients,
      colors: []
    };
  };

  const importProducts = async () => {
    try {
      setImporting(true);
      setError('');
      setImportedCount(0);
      
      let products: JsonProduct[];
      try {
        products = JSON.parse(jsonData);
        if (!Array.isArray(products)) {
          throw new Error('Invalid JSON format. Expected an array of products.');
        }
      } catch (err) {
        setError('Invalid JSON format. Please check your data.');
        setImporting(false);
        return;
      }
      
      // Filter only products (not variants)
      const productItems = products.filter(p => p.fieldType === 'Product');
      setProgress({ current: 0, total: productItems.length });
      
      const token = Cookies.get('adminToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setImporting(false);
        return;
      }
      
      let successCount = 0;
      
      // Process products sequentially to avoid overwhelming the server
      for (let i = 0; i < productItems.length; i++) {
        const jsonProduct = productItems[i];
        const product = mapJsonToProduct(jsonProduct);
        
        try {
          const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(product),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to import product ${jsonProduct.name}:`, errorData);
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Error importing product ${jsonProduct.name}:`, err);
        }
        
        setProgress({ current: i + 1, total: productItems.length });
      }
      
      setImportedCount(successCount);
      
      if (successCount > 0) {
        // Wait a moment before closing to show the success message
        setTimeout(() => {
          onImportComplete();
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred during import.');
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Import Products from JSON</h2>
        
        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            Upload a JSON file or paste JSON data containing products to import.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={importing}
            className="mb-2"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">Or paste JSON data:</label>
          <textarea
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            onPaste={handlePaste}
            disabled={importing}
            className="w-full p-2 border rounded h-64 font-mono text-sm"
            placeholder='[{"fieldType": "Product", "name": "Example Product", ...}]'
          />
        </div>
        
        {error && (
          <div className="mb-4 text-red-500 p-2 bg-red-50 rounded">
            {error}
          </div>
        )}
        
        {importing && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-black h-2.5 rounded-full" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Importing {progress.current} of {progress.total} products...
            </p>
          </div>
        )}
        
        {importedCount > 0 && !importing && (
          <div className="mb-4 text-green-600 p-2 bg-green-50 rounded">
            Successfully imported {importedCount} products!
          </div>
        )}
        
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={onClose}
            disabled={importing}
            className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={importProducts}
            disabled={!jsonData.trim() || importing}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            Import Products
          </button>
        </div>
      </div>
    </div>
  );
}
