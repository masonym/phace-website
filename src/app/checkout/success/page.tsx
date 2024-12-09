"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useCartContext } from '@/components/providers/CartProvider';

export default function CheckoutSuccessPage() {
    const { clearCart } = useCartContext();

    useEffect(() => {
        clearCart();
    }, [clearCart]);

    return (
        <div className="container mx-auto px-4 py-8 pt-32">
            <div className="max-w-lg mx-auto text-center">
                <div className="mb-8">
                    <svg
                        className="w-16 h-16 text-green-500 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 48 48"
                    >
                        <circle
                            className="opacity-25"
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M14 24l8 8 16-16"
                        />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold mb-4">Thank You for Your Order!</h1>
                <p className="text-gray-600 mb-8">
                    Your order has been successfully placed. We'll send you an email
                    confirmation with tracking details once your order ships.
                </p>
                <div className="space-y-4">
                    <Link
                        href="/store"
                        className="block w-full bg-black text-white py-3 rounded-md hover:bg-gray-800"
                    >
                        Continue Shopping
                    </Link>
                    <Link
                        href="/profile"
                        className="block w-full bg-white text-black border border-black py-3 rounded-md hover:bg-gray-50"
                    >
                        View Order History
                    </Link>
                </div>
            </div>
        </div>
    );
}
