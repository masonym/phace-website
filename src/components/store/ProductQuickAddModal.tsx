'use client';

import { useEffect, useState } from 'react';
import { useCartContext } from '@/components/providers/CartProvider';
import { Square } from 'square';
import Image from 'next/image';

interface ProductQuickAddModalProps {
    productId: string;
    onClose: () => void;
}

export default function ProductQuickAddModal({ productId, onClose }: ProductQuickAddModalProps) {
    const { addToCart, openCart } = useCartContext();
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<Square.CatalogObjectItem | null>(null);
    const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/products/${productId}`);
                if (!res.ok) throw new Error('product not found');
                const data = await res.json();
                setProduct(data);
            } catch (err) {
                console.error('failed to load product:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const variations = product?.itemData?.variations || [];
    const hasMultipleVariations = variations.filter(v => v.type === 'ITEM_VARIATION').length > 1;

    useEffect(() => {
        if (!loading && product && !hasMultipleVariations && variations[0]?.id) {
            setSelectedVariationId(variations[0].id);
        }
    }, [loading, product, hasMultipleVariations, variations]);

    const selectedVariation = product?.itemData?.variations?.find(v => v.id === selectedVariationId) ?? null;
    if (selectedVariation && selectedVariation.type !== 'ITEM_VARIATION') {
        return null;
    }
    const currentPrice = selectedVariation?.itemVariationData?.priceMoney?.amount ?? 0;

    const handleAdd = () => {
        if (!product || !selectedVariation) return;
        addToCart(product, quantity, selectedVariation as Square.CatalogObjectItemVariation);
        openCart();
        onClose();
    };

    if (loading || !product) {
        return (
            <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
                <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md text-center text-gray-500">
                    Loading product info...
                </div>
            </div>
        );
    }

    let buttonLabel = 'Add to Cart';
    if (!selectedVariation) {
        buttonLabel = 'Select an option';
    } else if (selectedVariation.itemVariationData?.locationOverrides?.some((loc) => loc.soldOut)) {
        buttonLabel = 'Out of Stock';
    } else if (!selectedVariation.itemVariationData?.priceMoney?.amount) {
        buttonLabel = 'Unavailable';
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl">
                <div className="flex flex-col sm:flex-row gap-6 w-full">
                    {/* Image Section */}
                    <div className="w-full sm:w-1/2 flex justify-center">
                        <Image
                            src={(product.itemData as any).ecom_image_uris?.[0] || '/images/placeholder.png'}
                            alt={product.itemData?.name || 'Product image'}
                            width={200}
                            height={300}
                            className="object-contain h-64"
                        />
                    </div>

                    {/* Details Section */}
                    <div className="w-full sm:w-1/2 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-semibold uppercase">{product.itemData?.name}</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
                        </div>

                        {/* Price Display */}
                        <div className="mb-4">
                            <p className="text-lg font-medium">
                                C${(Number(currentPrice) / 100).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                                Excluding Sales Tax | Shipping
                            </p>
                        </div>

                        {/* Variation Buttons */}
                        {/* TODO: Figure out how we can make these coloured buttons */}
                        {/* Obviously doing it in code is trivial; the quuestion is how we want to manage it on Square's end*/}
                        {hasMultipleVariations && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Variation</label>
                                <div className="flex gap-2">
                                    {variations
                                        .filter(variation => variation.type === 'ITEM_VARIATION')
                                        .map(variation => {
                                            const name = variation.itemVariationData?.name || 'Unnamed';
                                            const isSelected = variation.id === selectedVariationId;
                                            return (
                                                <button
                                                    key={variation.id}
                                                    onClick={() => setSelectedVariationId(variation.id)}
                                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${isSelected ? 'border-black bg-gray-200' : 'border-gray-300 bg-white'
                                                        }`}
                                                >
                                                    {name.charAt(0)}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Quantity Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Quantity</label>
                            <input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="w-16 border px-2 py-1 rounded-md"
                            />
                        </div>

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAdd}
                            disabled={buttonLabel !== 'Add to Cart'}
                            className={`w-full py-3 rounded-md text-white mb-2 ${selectedVariation
                                ? 'bg-[#B09182] hover:bg-[#B09182]/90'
                                : 'bg-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {buttonLabel}
                        </button>

                        {/* View Details Link */}
                        <a
                            href={`/store/product/${product.id}`}
                            className="text-sm text-blue-600 underline hover:text-blue-800 text-center block"
                        >
                            View More Details
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
