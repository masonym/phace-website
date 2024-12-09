'use client';

import { useCartContext } from '@/components/providers/CartProvider';
import { Product } from '@/types/product';
import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCartContext();

    return (
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full">
            <Link href={`/store/product/${product.id}`} className="flex-grow">
                <div className="relative h-64 w-full">
                    <Image
                        src={product.images[0] || '/images/placeholder.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-2">C${product.price.toFixed(2)}</p>
                    {product.colors && product.colors.length > 0 && (
                        <div className="flex gap-1 mt-2">
                            {product.colors.map((color) => (
                                <div
                                    key={color.name}
                                    className="w-4 h-4 rounded-full border border-gray-200"
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </Link>
            <div className="p-4 pt-0">
                <Link
                    href={`/store/product/${product.id}`}
                    className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition-colors block text-center"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
}
