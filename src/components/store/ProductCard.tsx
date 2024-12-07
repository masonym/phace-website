'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';
import { useCart } from '@/hooks/useCart';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
            <Link href={`/store/product/${product.id}`}>
                <div className="relative h-64 w-full">
                    <Image
                        src={product.images[0] || '/images/placeholder.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                    />
                </div>
            </Link>
            
            <div className="p-4 flex flex-col flex-grow">
                <Link href={`/store/product/${product.id}`}>
                    <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                </Link>
                <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center mt-auto">
                    <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                    <button
                        onClick={() => addToCart(product)}
                        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                        disabled={!product.inStock}
                    >
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    );
}
