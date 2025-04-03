"use client";

import { useCartContext } from '../providers/CartProvider';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export function Cart({ onClose }: { onClose: () => void }) {
    const { cart, removeFromCart, updateQuantity, getCartTotal } = useCartContext();
    const router = useRouter();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleCheckout = () => {
        setIsCheckingOut(true);
        onClose();
        router.push('/checkout');
    };

    const cartContent = (
        <div className="fixed inset-0 z-[100]">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Your Cart</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {cart.length === 0 ? (
                    <p className="text-gray-600">Your cart is empty</p>
                ) : (
                    <>
                        <div className="space-y-4">
                            {cart.map((item, index) => (
                                <div key={`${item.product.id}-${item.selectedVariation?.id}-${index}`}
                                    className="flex items-center gap-4 p-4 border rounded-lg">
                                    <div className="relative w-20 h-20 flex-shrink-0">
                                        {/* TODO: FIX THIS */}
                                        <Image
                                            src={item.product.itemData?.imageIds?.[0] || '/placeholder.jpg'}
                                            alt={item.product.itemData?.name || 'Product Image'}
                                            fill
                                            className="object-cover rounded"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-medium">{item.product.itemData?.name}</h3>
                                        {item.selectedVariation && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {item.selectedVariation.itemVariationData?.name || 'Default'}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center border rounded">
                                                <button
                                                    onClick={() => updateQuantity(
                                                        item.product.id,
                                                        item.selectedVariation?.id || null,
                                                        item.quantity - 1
                                                    )}
                                                    className="px-3 py-1 hover:bg-gray-100"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="px-3 py-1 border-x">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(
                                                        item.product.id,
                                                        item.selectedVariation?.id || null,
                                                        item.quantity + 1
                                                    )}
                                                    className="px-3 py-1 hover:bg-gray-100"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.product.id, item.selectedVariation?.id || null)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">
                                            C${(Number(item.selectedVariation?.itemVariationData?.priceMoney?.amount || 0) / 100 * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-medium">Total</span>
                                <span className="text-lg font-bold">C${getCartTotal().toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut}
                                className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCheckingOut ? 'Redirecting...' : 'Checkout'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    if (!mounted) return null;

    return createPortal(cartContent, document.body);
}
