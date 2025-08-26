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
    const [calculating, setCalculating] = useState(false);
    const [calculatedOrder, setCalculatedOrder] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleCheckout = () => {
        setIsCheckingOut(true);
        onClose();
        router.push('/checkout');
    };

    // Preview pricing with Square (pickup by default in cart modal)
    useEffect(() => {
        const calc = async () => {
            if (cart.length === 0) {
                setCalculatedOrder(null);
                return;
            }
            try {
                setCalculating(true);
                setError(null);
                const res = await fetch('/api/calculate-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currency: 'CAD',
                        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
                        fulfillmentMethod: 'pickup',
                        items: cart.map(ci => ({ variationId: ci.selectedVariation?.id, quantity: ci.quantity })),
                    }),
                });
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(j.error || 'Failed to calculate order');
                }
                const data = await res.json();
                setCalculatedOrder(data.order);
            } catch (e: any) {
                setCalculatedOrder(null);
                setError(e?.message || 'Failed to calculate order');
            } finally {
                setCalculating(false);
            }
        };
        const t = setTimeout(calc, 300);
        return () => clearTimeout(t);
    }, [cart]);

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
                                        <Image
                                            src={(item.product.itemData as any).ecom_image_uris?.[0] || '/images/placeholder.png'}
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
                                        {(() => {
                                            const originalUnit = Number(item.selectedVariation?.itemVariationData?.priceMoney?.amount || 0);
                                            const li = calculatedOrder?.lineItems?.find((l: any) => l.catalogObjectId === item.selectedVariation?.id);
                                            const gross = Number(li?.grossSalesMoney?.amount ?? 0);
                                            const disc = Number(li?.totalDiscountMoney?.amount ?? 0);
                                            const discountedUnit = li ? Math.max(0, Math.round((gross - disc) / Math.max(1, item.quantity))) : null;
                                            const showDiscount = discountedUnit !== null && discountedUnit < originalUnit;
                                            return (
                                                <div>
                                                    {showDiscount ? (
                                                        <div className="flex flex-col items-end">
                                                            <div className="text-sm text-red-600 font-semibold">Sale</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-400 line-through">C${(originalUnit / 100 * item.quantity).toFixed(2)}</span>
                                                                <span className="font-semibold">C${(((discountedUnit ?? originalUnit) / 100) * item.quantity).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="font-medium">C${(originalUnit / 100 * item.quantity).toFixed(2)}</p>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 border-t pt-4">
                            {error && (
                                <div className="bg-red-50 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>
                            )}
                            {calculatedOrder ? (
                                <div className="space-y-2 text-sm mb-4">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>C${(Number(calculatedOrder.totalGrossSalesMoney?.amount ?? 0) / 100).toFixed(2)}</span>
                                    </div>
                                    {Number(calculatedOrder.totalDiscountMoney?.amount ?? 0) > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Discounts</span>
                                            <span>-C${(Number(calculatedOrder.totalDiscountMoney.amount) / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {calculatedOrder?.discounts?.length > 0 && (
                                        <div className="text-xs text-gray-600">
                                            Applied: {Array.from(new Set((calculatedOrder.discounts || [])
                                                .map((d: any) => d?.discount?.name || d?.name)
                                                .filter(Boolean))).join(', ')}
                                        </div>
                                    )}
                                    {Number(calculatedOrder.totalTaxMoney?.amount ?? 0) > 0 && (
                                        <div className="flex justify-between">
                                            <span>Estimated Tax</span>
                                            <span>C${(Number(calculatedOrder.totalTaxMoney.amount) / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                                        <span className="text-lg font-medium">Total</span>
                                        <span className="text-lg font-bold">C${(Number(calculatedOrder.totalMoney?.amount ?? 0) / 100).toFixed(2)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-lg font-medium">Total</span>
                                    <span className="text-lg font-bold">C${getCartTotal().toFixed(2)}</span>
                                </div>
                            )}
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
