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
    // Pass batched discount data to prevent individual API calls
    discountPreview?: {
        minSalePriceCents: number | null;
        discountPercent: number | null;
    };
}

export default function ProductCard({ product, discountPreview }: ProductCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { addToCart } = useCartContext();
    
    // this also needs to be changed in src\app\store\product\[id]\page.tsx
    const isAlumierProduct = product.name.includes('AlumierMD') || product.name.includes('Alumiglow');

    const handleAlumierRedirect = () => {
        window.open('https://ca.alumiermd.com/account/register?code=E2BVZCUK', '_blank');
    };

    // Use batched discount data instead of individual API calls
    const minSalePriceCents = discountPreview?.minSalePriceCents || null;
    const discountPercent = discountPreview?.discountPercent || null;
    
    // Check if discounts are still loading
    const isDiscountLoading = discountPreview === undefined && Array.isArray(product.variationIds) && product.variationIds.length > 0;

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
                                
                                // Show loading state while discounts are being fetched
                                if (isDiscountLoading) {
                                    return (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-pulse">
                                                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                            </div>
                                            <span className="text-gray-600 text-sm">Loading price...</span>
                                        </div>
                                    );
                                }
                                
                                const showDiscount = discountPreview?.minSalePriceCents !== null && discountPreview?.minSalePriceCents !== undefined && discountPreview.minSalePriceCents < baselineOriginal;
                                
                                if (showDiscount && discountPreview) {
                                    const salePrice = discountPreview.minSalePriceCents!; // Non-null assertion - we've validated above
                                    return (
                                        <div className="flex items-center gap-2 transition-all duration-300 ease-in-out">
                                            <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-fade-in">
                                                {discountPreview.discountPercent ? `${discountPreview.discountPercent}% off` : 'Sale'}
                                            </span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-gray-400 line-through">C${(baselineOriginal / 100).toFixed(2)}</span>
                                                <span className="text-gray-900 font-semibold animate-fade-in">{hasMultiple ? `From C$${(salePrice / 100).toFixed(2)}` : `C$${(salePrice / 100).toFixed(2)}`}</span>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                // Show base price when no discounts available
                                return <p className="text-gray-600 transition-all duration-300 ease-in-out">C${(baselineOriginal / 100).toFixed(2)}</p>;
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
