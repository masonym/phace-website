'use client';

import { useState } from 'react';
import Cookies from 'js-cookie';
import { Product } from '@/types/product';

interface JsonProduct {
  handleId: string;
  fieldType: string;
  name: string;
  description: string;
  productImageUrl: string;
  collection: string;
  sku: string;
  ribbon: string;
  price: number;
  surcharge: string;
  visible: boolean;
  discountMode: string;
  discountValue: number;
  inventory: string;
  weight: string;
  cost: string;
  productOptionName1: string;
  productOptionType1: string;
  productOptionDescription1: string;
  productOptionName2: string;
  productOptionType2: string;
  productOptionDescription2: string;
  productOptionName3: string;
  productOptionType3: string;
  productOptionDescription3: string;
  productOptionName4: string;
  productOptionType4: string;
  productOptionDescription4: string;
  productOptionName5: string;
  productOptionType5: string;
  productOptionDescription5: string;
  productOptionName6: string;
  productOptionType6: string;
  productOptionDescription6: string;
  additionalInfoTitle1: string;
  additionalInfoDescription1: string;
  additionalInfoTitle2: string;
  additionalInfoDescription2: string;
  additionalInfoTitle3: string;
  additionalInfoDescription3: string;
  additionalInfoTitle4: string;
  additionalInfoDescription4: string;
  additionalInfoTitle5: string;
  additionalInfoDescription5: string;
  additionalInfoTitle6: string;
  additionalInfoDescription6: string;
  customTextField1: string;
  customTextCharLimit1: string;
  customTextMandatory1: string;
  customTextField2: string;
  customTextCharLimit2: string;
  customTextMandatory2: string;
  brand: string;
}

interface ProductImportProps {
  onImportComplete: () => void;
}

export default function ProductJsonImport({ onImportComplete }: ProductImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{
    total: number;
    success: number;
    failed: number;
    skipped?: number;
    message?: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setImportStats(null);
    }
  };

  const convertToProduct = (jsonProduct: JsonProduct): Product => {
    // Skip variants, only process products
    if (jsonProduct.fieldType !== 'Product') {
      return null;
    }
    
    // Split collection into categories if it contains semicolons
    const categories = jsonProduct.collection ? jsonProduct.collection.split(';') : [];
    const category = categories.length > 0 ? categories[0] : 'Default';
    
    // Determine if product is in stock
    const inStock = jsonProduct.inventory === 'InStock';
    
    // Extract "Why we love it", "How to use", and "Ingredients" from additional info fields
    const whyWeLoveIt = jsonProduct.additionalInfoDescription1 ? 
      [jsonProduct.additionalInfoDescription1] : [''];
    
    const howToUse = jsonProduct.additionalInfoDescription2 ? 
      [jsonProduct.additionalInfoDescription2] : [''];
    
    const ingredients = jsonProduct.additionalInfoDescription3 ? 
      [jsonProduct.additionalInfoDescription3] : [''];
    
    // Parse color options if available
    const colors = [];
    if (jsonProduct.productOptionType1 === 'COLOR' && jsonProduct.productOptionDescription1) {
      const colorOptions = jsonProduct.productOptionDescription1.split(';');
      
      for (const colorOption of colorOptions) {
        const [colorCode, colorName] = colorOption.split(':');
        if (colorCode && colorName) {
          colors.push({
            name: colorName.trim(),
            code: colorCode.trim()
          });
        }
      }
    }
    
    // Use handleId as the product ID if available, otherwise generate a new UUID
    const id = jsonProduct.handleId ? 
      jsonProduct.handleId.replace('product_', '') : '';
    
    // Create the product object
    return {
      id,
      name: jsonProduct.name || '',
      description: jsonProduct.description || '',
      price: jsonProduct.price || 0,
      images: jsonProduct.productImageUrl ? [jsonProduct.productImageUrl] : [],
      category,
      sku: jsonProduct.sku || '',
      inStock,
      whyWeLoveIt,
      howToUse,
      ingredients,
      colors
    };
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    setImporting(true);
    setError(null);
    
    try {
      const text = await file.text();
      let jsonProducts: JsonProduct[] = [];
      
      try {
        jsonProducts = JSON.parse(text);
        console.log(`Parsed ${jsonProducts.length} items from JSON`);
      } catch (parseError) {
        throw new Error('Failed to parse JSON file. Please ensure it is valid JSON.');
      }
      
      // Filter out non-product items and products with empty names
      const validProducts = jsonProducts.filter(
        product => product.fieldType === 'Product' && product.name && product.name.trim() !== ''
      );
      
      console.log(`Found ${validProducts.length} valid products with names`);
      
      const token = Cookies.get('adminToken');
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const stats = {
        total: validProducts.length,
        success: 0,
        failed: 0,
        skipped: 0
      };

      // Import products in batches to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < validProducts.length; i += batchSize) {
        const batch = validProducts.slice(i, i + batchSize);
        const products = batch.map(convertToProduct).filter(p => p !== null);
        
        console.log(`Importing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(validProducts.length/batchSize)}, with ${products.length} products`);
        
        const response = await fetch('/api/products/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ products })
        });

        const result = await response.json();
        
        if (response.ok) {
          stats.success += result.success;
          stats.failed += result.failed;
          stats.skipped = (stats.skipped || 0) + (result.skipped || 0);
          stats.message = result.message;
        } else {
          throw new Error(result.error || 'Failed to import products');
        }
      }

      setImportStats(stats);
      onImportComplete();
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import products');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Import Products from JSON</h2>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Upload a JSON file with product data. The file should be an array of product objects with the following key fields:
        </p>
        <code className="block bg-gray-100 p-2 text-sm rounded overflow-x-auto whitespace-nowrap">
          handleId, fieldType, name, description, productImageUrl, collection, price, inventory, additionalInfoDescription1 (Why we love it), additionalInfoDescription2 (How to use), additionalInfoDescription3 (Ingredients)
        </code>
      </div>
      
      <div className="mb-6">
        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="mb-4"
          disabled={importing}
        />
        
        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? 'Importing...' : 'Import Products'}
        </button>
      </div>
      
      {error && (
        <div className="text-red-500 mb-4">
          Error: {error}
        </div>
      )}
      
      {importStats && (
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <h3 className="font-medium text-green-800 mb-2">Import Complete</h3>
          <ul className="text-sm text-green-700">
            <li>Total products: {importStats.total}</li>
            <li>Successfully imported: {importStats.success}</li>
            <li>Failed to import: {importStats.failed}</li>
            {importStats.skipped !== undefined && (
              <li>Skipped (already exist): {importStats.skipped}</li>
            )}
          </ul>
          {importStats.message && (
            <p className="mt-2 text-sm text-green-700">{importStats.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
