'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/components/providers/CartProvider';
import { Square } from 'square';
import Image from 'next/image';

// Helper function to format money
const formatMoney = (amount: number | bigint, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(Number(amount) / 100); // Convert from cents to dollars
};

interface ProductPageProps {
    params: {
        id: string;
    };
}

export default function ProductPage({ params }: ProductPageProps) {
    const { addToCart } = useCartContext();
    const router = useRouter();
    const [product, setProduct] = useState<Square.CatalogObjectItem | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<Square.CatalogObjectItemVariation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`/api/products/${params.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Product not found');
                    }
                    throw new Error('Failed to fetch product');
                }

                const data = await response.json();
                console.log(typeof data);
                setProduct(data);

                console.log("Data:", data.itemData!);
                // Set default variation if available
                if (data.variations?.length > 0) {
                    console.log('Variations:', data.variations);
                    setSelectedVariation(data.variations.find((v: Square.CatalogObject) => v.type === 'ITEM_VARIATION') || null);
                }
            } catch (err: any) {
                console.error('Error fetching product:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [params.id, router]);

    const handleAddToCart = () => {
        if (product && selectedVariation) {
            addToCart(product, 1, selectedVariation);
            // Optionally redirect to cart or show a confirmation
            // router.push('/cart');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 pt-24 text-center">
                <p>Loading product...</p>
            </div>
        );
    }

    if (error || !product) {
        return null; // Redirect happens in useEffect
    }

    return (
        <div className="container mx-auto px-4 py-8 pt-24">
            <div className="max-w-2xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Product Image */}
                    {/* TODO: There's an ecom_image_uris being sent with the data but idk how to access it*/}
                    {/* We can use that instead of ID */}
                    {/* Need to update the rest of the imageIds references too */}
                    {product.itemData!.imageIds?.[0] && (
                        <div className="relative w-full md:w-1/2 h-64 md:h-96">
                            <Image
                                src={product.itemData!.imageIds[0] || ''}
                                alt={product.itemData!.name || 'Product Image'}
                                fill
                                className="object-cover rounded-lg"
                            />
                        </div>
                    )}

                    {/* Product Details */}
                    <div className="w-full md:w-1/2">
                        <h1 className="text-3xl font-bold mb-4">{product.itemData!.name}</h1>

                        {product.itemData!.description && (
                            <p className="text-gray-600 mb-6">{product.itemData!.description}</p>
                        )}

                        {product.itemData!.variations && product.itemData!.variations.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-2">Options</h2>
                                <div className="space-y-2">
                                    {product.itemData!.variations
                                        .filter((variation: Square.CatalogObject) => variation.type === 'ITEM_VARIATION')
                                        .map((variation: Square.CatalogObjectItemVariation) => (
                                            <div
                                                key={variation.id}
                                                className={`flex justify-between items-center border-b pb-2 cursor-pointer ${selectedVariation?.id === variation.id ? 'bg-gray-100' : ''
                                                    }`}
                                                onClick={() => setSelectedVariation(variation)}
                                            >
                                                <span>{variation.itemVariationData?.name || 'Default'}</span>
                                                {variation.itemVariationData?.priceMoney && (
                                                    <span className="font-medium">
                                                        {formatMoney(
                                                            variation.itemVariationData.priceMoney.amount!,
                                                            variation.itemVariationData.priceMoney.currency!
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleAddToCart}
                            disabled={!selectedVariation}
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
