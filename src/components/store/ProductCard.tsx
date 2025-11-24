'use client';

import { useCartContext } from '@/components/providers/CartProvider';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductQuickAddModal from './ProductQuickAddModal';


interface ProductCardProps {
    product: {
        id: string;
        name: string;
        description: string;
        price: number | string;
        currency: string;
        categories: string[];
        type: string;
        images?: string[];
        // Batch discount preview across variations
        variationIds?: string[];
        minOriginalPriceCents?: number;
    };
}

export default function ProductCard({ product }: ProductCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [minSalePriceCents, setMinSalePriceCents] = useState<number | null>(null);
    const [discountPercent, setDiscountPercent] = useState<number | null>(null);

    const { addToCart } = useCartContext();
    
    // this also needs to be changed in src\app\store\product\[id]\page.tsx
    const isAlumierProduct = product.name.includes('AlumierMD') || product.name.includes('Alumiglow');

    const handleAlumierRedirect = () => {
        window.open('https://ca.alumiermd.com/account/register?code=E2BVZCUK', '_blank');
    };

    // Fetch discounted preview price across all variations and use the minimum
    useEffect(() => {
        const fetchPreview = async () => {
            if (!Array.isArray(product.variationIds) || product.variationIds.length === 0) return;
            try {
                const res = await fetch('/api/preview-variations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        variationIds: product.variationIds,
                        // pass locationId from client env to avoid server env mismatch
                        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
                    }),
                });
                if (!res.ok) return;
                const data = await res.json();
                const minDiscounted = typeof data.minDiscountedUnitPriceCents === 'number' ? data.minDiscountedUnitPriceCents : null;
                setMinSalePriceCents(minDiscounted);

                const baselineOriginal = typeof product.minOriginalPriceCents === 'number'
                    ? product.minOriginalPriceCents
                    : (typeof product.price === 'number' ? Number(product.price) : null);
                if (baselineOriginal && minDiscounted !== null && minDiscounted < baselineOriginal) {
                    const pct = Math.round(100 - (minDiscounted / baselineOriginal) * 100);
                    setDiscountPercent(pct);
                } else setDiscountPercent(null);
            } catch (_) {
                // ignore preview errors
            }
        };
        fetchPreview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(product.variationIds), product.minOriginalPriceCents, product.price]);

    if (product.type !== 'ITEM') {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full">
            <Link href={`/store/product/${product.id}`} className="flex-grow">
                <div className="relative h-64 w-full">
                    <Image
                        src={product.images![0] || '/images/placeholder.png'}
                        alt={product.name}
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                    {typeof product.price === 'number' && !isNaN(product.price) ? (
                        <div className="mb-2">
                            {(() => {
                                const hasMultiple = Array.isArray(product.variationIds) && product.variationIds.length > 1;
                                const baselineOriginal = typeof product.minOriginalPriceCents === 'number'
                                    ? product.minOriginalPriceCents
                                    : Number(product.price);
                                const showDiscount = minSalePriceCents !== null && minSalePriceCents < baselineOriginal;
                                if (showDiscount) {
                                    return (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                                {discountPercent ? `${discountPercent}% off` : 'Sale'}
                                            </span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-gray-400 line-through">C${(baselineOriginal / 100).toFixed(2)}</span>
                                                <span className="text-gray-900 font-semibold">{hasMultiple ? `From C$${(minSalePriceCents! / 100).toFixed(2)}` : `C$${(minSalePriceCents! / 100).toFixed(2)}`}</span>
                                            </div>
                                        </div>
                                    );
                                }
                                return <p className="text-gray-600">C${(baselineOriginal / 100).toFixed(2)}</p>;
                            })()}
                        </div>
                    ) : (
                        <p className="text-gray-600 mb-2">Variable</p>
                    )}
                    {/* TODO: add options? */}
                </div>
            </Link>
            <div className="p-4 pt-0">
                {isAlumierProduct ? (
                    <button
                        onClick={handleAlumierRedirect}
                        className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition-colors block text-center"
                    >
                        Shop with AlumierMD
                    </button>
                ) : (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition-colors block text-center"
                    >
                        Add to Cart
                    </button>
                )}
            </div>
            {!isAlumierProduct && isModalOpen && (
                <ProductQuickAddModal
                    productId={product.id}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}
