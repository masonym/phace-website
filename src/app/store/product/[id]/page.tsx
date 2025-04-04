'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/components/providers/CartProvider';
import { showToast } from '@/components/ui/Toast';
import { Square } from 'square';
import Image from 'next/image';
import { motion } from 'framer-motion';

const formatMoney = (amount: number | bigint, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(Number(amount) / 100);
};

interface ProductPageProps {
    params: {
        id: string;
    };
}

export default function ProductPage({ params }: ProductPageProps) {
    const { addToCart } = useCartContext();
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState<Square.CatalogObjectItem | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<Square.CatalogObjectItemVariation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`/api/products/${params.id}`);
                if (!response.ok) throw new Error('Product not found');
                const data = await response.json();
                setProduct(data);
                if (data.itemData.variations) {
                    setSelectedVariation(
                        data.itemData.variations.find((v: Square.CatalogObject) => v.type === 'ITEM_VARIATION') || null
                    );
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [params.id, router]);

    const handleAddToCart = () => {
        if (!product || !selectedVariation) return;
        if (quantity < 1) {
            showToast({ title: 'Invalid Quantity', description: 'Enter a quantity of 1 or more', status: 'error' });
            return;
        }
        addToCart(product, quantity, selectedVariation);
        showToast({ title: 'Added to Cart', description: `${quantity} item(s) added.`, status: 'success' });
    };

    if (loading) {
        return <div className="container mx-auto px-4 py-32 text-center text-gray-500">Loading product...</div>;
    }

    if (error || !product) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-24">
            <div className="w-full h-[500px] relative mb-10">
                {product.itemData!.imageIds?.[0] && (
                    <Image
                        src={product.itemData!.imageIds[0] || ''}
                        alt={product.itemData!.name || 'Product Image'}
                        fill
                        className="object-cover rounded-2xl shadow-lg"
                    />
                )}
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-5xl font-semibold tracking-tight text-gray-900">{product.itemData!.name}</h1>

                {product.itemData!.description && (
                    <p className="text-lg text-gray-600 leading-relaxed">{product.itemData!.description}</p>
                )}

                {product.itemData!.variations && (
                    <div>
                        <h2 className="text-2xl font-medium text-gray-800 mb-4">Options</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {product.itemData!.variations
                                .filter((v: Square.CatalogObject) => v.type === 'ITEM_VARIATION')
                                .map((variation: Square.CatalogObjectItemVariation) => (
                                    <div
                                        key={variation.id}
                                        className={`border rounded-xl p-4 cursor-pointer transition-shadow duration-300 ${selectedVariation?.id === variation.id ? 'border-accent shadow-md bg-accent/10' : 'hover:shadow-sm'
                                            }`}
                                        onClick={() => setSelectedVariation(variation)}
                                    >
                                        <div className="font-medium">{variation.itemVariationData?.name}</div>
                                        {variation.itemVariationData?.priceMoney && (
                                            <div className="text-sm text-gray-700 mt-1">
                                                {formatMoney(
                                                    variation.itemVariationData.priceMoney.amount!,
                                                    variation.itemVariationData.priceMoney.currency!
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="quantity" className="block text-lg font-medium text-gray-800 mb-2">
                        Quantity
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            id="quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                            className="border rounded-lg px-4 py-2 w-24 focus:ring-accent focus:border-accent"
                        />
                        <button
                            onClick={handleAddToCart}
                            disabled={!selectedVariation}
                            className="bg-accent text-white px-6 py-2 rounded-full hover:bg-accent/90 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
