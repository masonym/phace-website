"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCartContext } from '@/components/providers/CartProvider';
import { CLINIC, CLINIC_ADDRESS_ONE_LINE } from '@/lib/config/clinicInfo';

interface LastOrder {
    orderId: string | null;
    receiptUrl: string | null;
    receiptNumber: string | null;
    total: number;
    fulfillmentMethod: 'shipping' | 'pickup';
    email: string;
    items: { name: string; variationName: string | null; quantity: number }[];
}

export default function CheckoutSuccessPage() {
    const { clearCart } = useCartContext();
    const [order, setOrder] = useState<LastOrder | null>(null);

    useEffect(() => {
        clearCart();
    }, [clearCart]);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('phace-last-order');
            if (raw) setOrder(JSON.parse(raw));
        } catch {
            // Show the generic thank-you without details
        }
    }, []);

    const isPickup = order?.fulfillmentMethod === 'pickup';
    const reference = order?.receiptNumber || order?.orderId;

    return (
        <div className="container mx-auto px-4 py-8 pt-32">
            <div className="max-w-lg mx-auto text-center">
                <div className="mb-8">
                    <svg
                        className="w-16 h-16 text-green-500 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
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
                {reference && (
                    <p className="text-gray-700 mb-2">
                        Order number: <span className="font-semibold">{reference}</span>
                    </p>
                )}
                <p className="text-gray-600 mb-8">
                    {order?.email
                        ? <>A confirmation has been sent to <span className="font-medium">{order.email}</span>. </>
                        : <>We&apos;ll email you a confirmation shortly. </>}
                    {isPickup
                        ? <>We&apos;ll let you know when your order is ready to pick up at {CLINIC_ADDRESS_ONE_LINE}.</>
                        : <>We&apos;ll send tracking details once your order ships.</>}
                </p>

                {order && order.items.length > 0 && (
                    <div className="text-left bg-white rounded-lg shadow-sm p-6 mb-8">
                        <h2 className="font-semibold mb-3">Order Summary</h2>
                        <ul className="space-y-1 text-gray-700">
                            {order.items.map((item, index) => (
                                <li key={index} className="flex justify-between gap-4">
                                    <span>
                                        {item.name}
                                        {item.variationName && item.variationName !== 'Regular' && (
                                            <span className="text-gray-500"> ({item.variationName})</span>
                                        )}
                                    </span>
                                    <span className="text-gray-500">x{item.quantity}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex justify-between font-semibold border-t mt-3 pt-3">
                            <span>Total paid</span>
                            <span>C${order.total.toFixed(2)}</span>
                        </div>
                        {order.receiptUrl && (
                            <a
                                href={order.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-3 text-accent underline"
                            >
                                View your receipt
                            </a>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    <Link
                        href="/store"
                        className="block w-full bg-black text-white py-3 rounded-md hover:bg-gray-800"
                    >
                        Continue Shopping
                    </Link>
                    <p className="text-sm text-gray-500">
                        Questions about your order? Call{' '}
                        <a href={CLINIC.phoneHref} className="text-accent underline">{CLINIC.phoneDisplay}</a>{' '}
                        or email <a href={`mailto:${CLINIC.email}`} className="text-accent underline">{CLINIC.email}</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
