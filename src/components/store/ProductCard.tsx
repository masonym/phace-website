'use client';

import { useCartContext } from '@/components/providers/CartProvider';
import Image from 'next/image';
import Link from 'next/link';
import { Square } from 'square';
import { useState } from 'react';
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
    };
}

export default function ProductCard({ product }: ProductCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { addToCart } = useCartContext();
    
    const isAlumierProduct = product.name.includes('AlumierMD');

    const handleAlumierRedirect = () => {
        window.open('https://ca.alumiermd.com/account/register?code=E2BVZCUK', '_blank');
    };

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
                    <p className="text-gray-600 mb-2">
                        {typeof product.price === "number" && !isNaN(product.price)
                            ? `C$${(product.price / 100).toFixed(2)}`
                            : "Variable"}
                    </p>
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
