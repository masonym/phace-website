"use client";

import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface AddToCartDialogProps {
    onClose: () => void;
    onKeepShopping: () => void;
    onCheckout: () => void;
}

export function AddToCartDialog({ onClose, onKeepShopping, onCheckout }: AddToCartDialogProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const dialogContent = (
        <div className="fixed inset-0 z-[100]">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-full max-w-md mx-4">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <svg
                            className="h-6 w-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Item Added to Cart!</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Would you like to checkout now or continue shopping?
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onCheckout}
                            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800"
                        >
                            Proceed to Checkout
                        </button>
                        <button
                            onClick={onKeepShopping}
                            className="w-full bg-white text-black border border-black py-2 px-4 rounded-md hover:bg-gray-50"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!mounted) return null;

    return createPortal(dialogContent, document.body);
}
