'use client';

import { useCartContext } from '@/components/providers/CartProvider';
import Image from 'next/image';
import Link from 'next/link';
import { Square } from 'square';


interface ProductCardProps {
    product: {
        id: string;
        name: string;
        description: string;
        price: number;
        currency: string;
        categories: string[];
        type: string;
    };
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCartContext();

    if (product.type !== 'ITEM') {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full">
            <Link href={`/store/product/${product.id}`} className="flex-grow">
                <div className="relative h-64 w-full">
                    {/* TODO: readd this*/}
                    {/*
                    <Image
                        src={product.images || '/images/placeholder.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                    />
                    */}
                </div>
                <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-2">C${(product.price / 100).toFixed(2)}</p>
                    {/* TODO: add options? */}
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
