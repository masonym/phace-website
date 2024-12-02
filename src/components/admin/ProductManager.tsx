'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { S3Service } from '@/lib/services/s3Service';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

export default function ProductManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const token = Cookies.get('adminToken');
            const response = await fetch('/api/products', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            setProducts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (file: File, productId: string) => {
        try {
            setUploadingImage(true);
            const fileName = `${productId}/${Date.now()}-${file.name}`;
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
                throw new Error('Failed to get upload URL');
            }

            const { uploadUrl } = await response.json();

            // Upload to S3
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': contentType },
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload image');
            }

            // Get the public URL
            const imageUrl = S3Service.getImageUrl(fileName);

            // Update product with new image
            if (editingProduct) {
                const updatedImages = [...(editingProduct.images || []), imageUrl];
                await updateProduct({ ...editingProduct, images: updatedImages });
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const updateProduct = async (product: Product) => {
        try {
            const token = Cookies.get('adminToken');
            const response = await fetch(`/api/admin/products/${product.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(product),
            });

            if (!response.ok) throw new Error('Failed to update product');

            // Refresh products list
            await fetchProducts();
            setEditingProduct(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const deleteProduct = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const token = Cookies.get('adminToken');
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete product');

            // Refresh products list
            await fetchProducts();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Product Management</h1>
            
            <button
                onClick={() => setEditingProduct({
                    id: uuidv4(),
                    name: '',
                    description: '',
                    price: 0,
                    images: [],
                    category: '',
                    sku: '',
                    inStock: true,
                    quantity: 0,
                })}
                className="bg-primary text-white px-4 py-2 rounded mb-4"
            >
                Add New Product
            </button>

            {editingProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                        <h2 className="text-xl font-bold mb-4">
                            {editingProduct.id ? 'Edit Product' : 'New Product'}
                        </h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                updateProduct(editingProduct);
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingProduct.name}
                                    onChange={(e) =>
                                        setEditingProduct({
                                            ...editingProduct,
                                            name: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Description</label>
                                <textarea
                                    value={editingProduct.description}
                                    onChange={(e) =>
                                        setEditingProduct({
                                            ...editingProduct,
                                            description: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1">Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editingProduct.price}
                                        onChange={(e) =>
                                            setEditingProduct({
                                                ...editingProduct,
                                                price: parseFloat(e.target.value),
                                            })
                                        }
                                        className="w-full px-3 py-2 border rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={editingProduct.category}
                                        onChange={(e) =>
                                            setEditingProduct({
                                                ...editingProduct,
                                                category: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border rounded"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1">Images</label>
                                <div className="flex flex-wrap gap-2">
                                    {editingProduct.images?.map((image, index) => (
                                        <div
                                            key={index}
                                            className="relative w-24 h-24"
                                        >
                                            <Image
                                                src={image}
                                                alt={`Product image ${index + 1}`}
                                                fill
                                                className="object-cover rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = [
                                                        ...editingProduct.images,
                                                    ];
                                                    newImages.splice(index, 1);
                                                    setEditingProduct({
                                                        ...editingProduct,
                                                        images: newImages,
                                                    });
                                                }}
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <label className="w-24 h-24 border-2 border-dashed rounded flex items-center justify-center cursor-pointer">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleImageUpload(
                                                        file,
                                                        editingProduct.id
                                                    );
                                                }
                                            }}
                                        />
                                        {uploadingImage ? (
                                            <span>Uploading...</span>
                                        ) : (
                                            <span>+ Add Image</span>
                                        )}
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingProduct(null)}
                                    className="px-4 py-2 border rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="border rounded-lg p-4 space-y-2"
                    >
                        {product.images?.[0] && (
                            <div className="relative h-48">
                                <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover rounded"
                                />
                            </div>
                        )}
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-gray-600">${product.price.toFixed(2)}</p>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setEditingProduct(product)}
                                className="px-3 py-1 bg-blue-500 text-white rounded"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => deleteProduct(product.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
