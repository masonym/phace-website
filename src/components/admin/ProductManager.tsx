'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import MDEditor from '@uiw/react-md-editor';
import ProductImporter from './ProductImporter';

const DEFAULT_PRODUCT: Product = {
    id: '',
    name: '',
    description: '',
    price: 0,
    images: [],
    category: '',
    sku: '',
    inStock: true,
    whyWeLoveIt: [''],
    howToUse: [''],
    ingredients: [''],
    colors: []
};

export default function ProductManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [newColorName, setNewColorName] = useState('');
    const [newColorHex, setNewColorHex] = useState('#000000');
    const [showImporter, setShowImporter] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        setUploadingImage(true);
        const file = e.target.files[0];
        try {
            const fileName = `${editingProduct?.id}/${Date.now()}-${file.name}`;
            const contentType = file.type;
            const token = Cookies.get('adminToken');

            // Get signed URL
            const response = await fetch('/api/upload-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fileName, contentType }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get upload URL');
            }

            const { uploadUrl } = await response.json();

            // Upload to S3
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': contentType
                },
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload to S3');
            }

            // Get the public URL
            const imageUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'us-west-2'}.amazonaws.com/${fileName}`;

            if (editingProduct) {
                setEditingProduct({
                    ...editingProduct,
                    images: [...editingProduct.images, imageUrl]
                });
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        if (!editingProduct) return;

        setEditingProduct({
            ...editingProduct,
            images: editingProduct.images.filter((_, index) => index !== indexToRemove)
        });
    };

    const handleAddColor = () => {
        if (!editingProduct || !newColorName || !newColorHex) return;

        setEditingProduct({
            ...editingProduct,
            colors: [...(editingProduct.colors || []), { name: newColorName, hex: newColorHex }]
        });
        setNewColorName('');
        setNewColorHex('#000000');
    };

    const handleRemoveColor = (indexToRemove: number) => {
        if (!editingProduct) return;

        setEditingProduct({
            ...editingProduct,
            colors: editingProduct.colors?.filter((_, index) => index !== indexToRemove) || []
        });
    };

    const handleAddArrayItem = (field: 'whyWeLoveIt' | 'howToUse' | 'ingredients') => {
        if (!editingProduct) return;
        setEditingProduct({
            ...editingProduct,
            [field]: [...editingProduct[field], '']
        });
    };

    const handleRemoveArrayItem = (field: 'whyWeLoveIt' | 'howToUse' | 'ingredients', index: number) => {
        if (!editingProduct) return;
        const newArray = [...editingProduct[field]];
        if (newArray.length > 1) {
            newArray.splice(index, 1);
            setEditingProduct({
                ...editingProduct,
                [field]: newArray
            });
        }
    };

    const handleArrayChange = (
        field: 'whyWeLoveIt' | 'howToUse' | 'ingredients',
        index: number,
        value: string
    ) => {
        if (!editingProduct) return;
        const newArray = [...editingProduct[field]];
        newArray[index] = value;
        setEditingProduct({
            ...editingProduct,
            [field]: newArray
        });
    };

    const handleSave = async () => {
        if (!editingProduct) return;

        try {
            const token = Cookies.get('adminToken');
            const isNewProduct = !products.some(p => p.id === editingProduct.id);
            const method = isNewProduct ? 'POST' : 'PUT';
            const url = isNewProduct
                ? '/api/products'
                : `/api/products/${editingProduct.id}`;

            console.log('Saving product:', {
                isNewProduct,
                method,
                url,
                product: editingProduct
            });

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editingProduct),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save product');
            }

            await fetchProducts();
            setEditingProduct(null);
        } catch (err) {
            console.error('Save error:', err);
            setError(err instanceof Error ? err.message : 'Failed to save product');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const token = Cookies.get('adminToken');
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete product');
            }

            await fetchProducts();
        } catch (err) {
            console.error('Delete error:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete product');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Product Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowImporter(true)}
                        className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                    >
                        Import from JSON
                    </button>
                    <button
                        onClick={() => {
                            const newProduct = {
                                ...DEFAULT_PRODUCT,
                                id: uuidv4()
                            };
                            setEditingProduct(newProduct);
                        }}
                        className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
                    >
                        Add New Product
                    </button>
                </div>
            </div>

            {editingProduct ? (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingProduct.id ? 'Edit Product' : 'New Product'}
                    </h2>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block mb-2">Name</label>
                            <input
                                type="text"
                                value={editingProduct.name}
                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-2">SKU</label>
                            <input
                                type="text"
                                value={editingProduct.sku}
                                onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-2">Price</label>
                            <input
                                type="number"
                                value={editingProduct.price}
                                onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-2">Category</label>
                            <input
                                type="text"
                                value={editingProduct.category}
                                onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block mb-2">Description</label>
                        <textarea
                            value={editingProduct.description}
                            onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                            className="w-full p-2 border rounded h-32"
                        />
                    </div>

                    {/* Images */}
                    <div className="mb-6">
                        <label className="block mb-2">Images</label>
                        <div className="flex gap-4 mb-4">
                            {editingProduct.images.map((image, index) => (
                                <div key={index} className="relative">
                                    <Image
                                        //src={image}
                                        src={"/favicon.svg"}
                                        alt={`Product ${index + 1}`}
                                        width={100}
                                        height={100}
                                        className="object-cover rounded"
                                    />
                                    <button
                                        onClick={() => handleRemoveImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="mb-2"
                        />
                        {uploadingImage && <p>Uploading...</p>}
                    </div>

                    {/* Colors */}
                    <div className="mb-6">
                        <label className="block mb-2">Colors</label>
                        <div className="flex flex-wrap gap-4 mb-4">
                            {editingProduct.colors?.map((color, index) => (
                                <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                                    <div
                                        className="w-6 h-6 rounded border"
                                        style={{ backgroundColor: color.hex }}
                                    />
                                    <span className="text-sm">{color.name}</span>
                                    <button
                                        onClick={() => handleRemoveColor(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newColorName}
                                onChange={(e) => setNewColorName(e.target.value)}
                                placeholder="Color name (e.g., Tan)"
                                className="flex-grow p-2 border rounded"
                            />
                            <div className="relative">
                                <input
                                    type="color"
                                    value={newColorHex}
                                    onChange={(e) => setNewColorHex(e.target.value)}
                                    className="w-12 h-10 p-1 border rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={newColorHex}
                                    onChange={(e) => {
                                        const hex = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                                        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                                            setNewColorHex(hex);
                                        }
                                    }}
                                    placeholder="#000000"
                                    className="absolute left-14 top-0 w-24 p-2 border rounded"
                                />
                            </div>
                            <button
                                onClick={handleAddColor}
                                disabled={!newColorName || !newColorHex}
                                className="bg-black text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Color
                            </button>
                        </div>
                    </div>

                    {/* Why We Love It */}
                    <div className="mb-6">
                        <label className="block mb-2">Why We Love It</label>
                        {editingProduct.whyWeLoveIt.map((item, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleArrayChange('whyWeLoveIt', index, e.target.value)}
                                    className="flex-grow p-2 border rounded"
                                />
                                <button
                                    onClick={() => handleRemoveArrayItem('whyWeLoveIt', index)}
                                    className="text-red-500 px-2"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => handleAddArrayItem('whyWeLoveIt')}
                            className="text-blue-500"
                        >
                            + Add Item
                        </button>
                    </div>

                    {/* How to Use */}
                    <div className="mb-6">
                        <label className="block mb-2">How to Use</label>
                        {editingProduct.howToUse.map((item, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleArrayChange('howToUse', index, e.target.value)}
                                    className="flex-grow p-2 border rounded"
                                />
                                <button
                                    onClick={() => handleRemoveArrayItem('howToUse', index)}
                                    className="text-red-500 px-2"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => handleAddArrayItem('howToUse')}
                            className="text-blue-500"
                        >
                            + Add Item
                        </button>
                    </div>

                    {/* Ingredients */}
                    <div className="mb-6">
                        <label className="block mb-2">Ingredients</label>
                        {editingProduct.ingredients.map((item, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleArrayChange('ingredients', index, e.target.value)}
                                    className="flex-grow p-2 border rounded"
                                />
                                <button
                                    onClick={() => handleRemoveArrayItem('ingredients', index)}
                                    className="text-red-500 px-2"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => handleAddArrayItem('ingredients')}
                            className="text-blue-500"
                        >
                            + Add Item
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setEditingProduct(null)}
                            className="border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white p-4 rounded-lg shadow-sm">
                            {product.images[0] && (
                                <Image
                                    //src={product.images[0]}
                                    src={"/favicon.svg"}
                                    alt={product.name}
                                    width={200}
                                    height={200}
                                    className="object-cover rounded mb-4"
                                />
                            )}
                            <h3 className="font-semibold mb-2">{product.name}</h3>
                            <p className="text-gray-600 mb-2">C${product.price.toFixed(2)}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingProduct(product)}
                                    className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="border border-red-500 text-red-500 px-4 py-2 rounded-md hover:bg-red-50"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {showImporter && (
                <ProductImporter
                    onClose={() => setShowImporter(false)}
                    onImportComplete={() => {
                        setShowImporter(false);
                        fetchProducts();
                    }}
                />
            )}
        </div>
    );
}
