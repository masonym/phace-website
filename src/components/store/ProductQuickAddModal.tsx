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
    const { addToCart } = useCartContext();
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<Square.CatalogObjectItem | null>(null);
    const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Fetch product effect
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

    // Variation selection logic
    const variations = product?.itemData?.variations || [];
    const hasMultipleVariations = variations.filter(v => v.type === 'ITEM_VARIATION').length > 1;

    // Set default variation effect
    useEffect(() => {
        if (!loading && product && !hasMultipleVariations && variations[0]?.id) {
            setSelectedVariationId(variations[0].id);
        }
    }, [loading, product, hasMultipleVariations, variations]);

    const selectedVariation = product?.itemData?.variations?.find(v => v.id === selectedVariationId) ?? null;

    const handleAdd = () => {
        if (!product || !selectedVariation) return;
        addToCart(product, quantity, selectedVariation as Square.CatalogObjectItemVariation);
        onClose();
    };

    // Loading state
    if (loading || !product) {
        return (
            <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
                <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md text-center text-gray-500">
                    Loading product info...
                </div>
            </div>
        );
    }

    // Main render
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold">{product.itemData?.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
                </div>

                <div className="mb-4">
                    <Image
                        src={(product.itemData as any).ecom_image_uris?.[0] || '/images/placeholder.png'}
                        alt={product.itemData?.name || 'Product image'}
                        width={400}
                        height={300}
                        className="object-cover rounded-md w-full h-64"
                    />
                </div>

                {hasMultipleVariations ? (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Select Variation</label>
                        <select
                            value={selectedVariationId || ''}
                            onChange={(e) => setSelectedVariationId(e.target.value)}
                            className="w-full border px-3 py-2 rounded-md"
                        >
                            <option value="" disabled>Select an option</option>
                            {variations
                                .filter(variation => variation.type === 'ITEM_VARIATION')
                                .map(variation => {
                                    const name = variation.itemVariationData?.name || 'Unnamed';
                                    const price = variation.itemVariationData?.priceMoney?.amount ?? 0;
                                    return (
                                        <option key={variation.id} value={variation.id}>
                                            {name} – C${(Number(price) / 100).toFixed(2)}
                                        </option>
                                    );
                                })}
                        </select>
                    </div>
                ) : null}

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full border px-3 py-2 rounded-md"
                    />
                </div>

                <div className="flex justify-between items-center">
                    <button
                        onClick={handleAdd}
                        disabled={!selectedVariation}
                        className={`px-4 py-2 rounded-md text-white ${selectedVariation ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                        Add to Cart
                    </button>
                    <a
                        href={`/store/product/${product.id}`}
                        className="text-sm text-blue-600 underline hover:text-blue-800"
                    >
                        View Details
                    </a>
                </div>
            </div>
        </div>
    );
}
