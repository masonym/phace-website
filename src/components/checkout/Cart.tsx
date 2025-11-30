'use client';

import { useCartContext } from '@/components/providers/CartProvider';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Cart() {
    const { cart, removeFromCart, updateQuantity } = useCartContext();
    const router = useRouter();
    const [calculating, setCalculating] = useState(false);
    const [calculatedOrder, setCalculatedOrder] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleQuantityChange = (productId: string, variationId: string | null, newQuantity: number) => {
        if (newQuantity < 1) return;
        updateQuantity(productId, variationId, newQuantity);
    };

    const handleCheckout = () => {
        router.push('/checkout');
    };

    // Preview pricing with Square (pickup by default for cart)
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
                        items: cart.map(ci => ({ 
                            variationId: ci.selectedVariation?.id, 
                            quantity: ci.quantity,
                            basePrice: ci.basePrice,
                            price: ci.price,
                        })),
                        shippingAddress: { name: '', street: '', city: '', state: '', zipCode: '', country: 'CA' },
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

    if (cart.length === 0) {
        return (
            <div className="p-4 text-center">
                <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
                <button
                    onClick={() => router.push('/store')}
                    className="text-primary hover:text-primary-dark"
                >
                    Continue Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-2/3">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded mb-3">{error}</div>
                    )}
                    {cart.map((item) => (
                        <div
                            key={`${item.product.id}-${item.selectedVariation?.id ?? 'no-variation'}`}
                            className="flex items-center border-b py-4 space-x-4"
                        >
                            <div className="relative h-24 w-24">
                                <Image
                                    src={item.product.itemData!.imageIds?.[0] || '/images/placeholder.jpg'}
                                    alt={item.product.itemData!.name || 'Product Image'}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-semibold">{item.product.itemData!.name}</h3>
                                {item.selectedVariation && (
                                    <p className="text-gray-600">
                                        Variation: {item.selectedVariation.itemVariationData?.name || 'Default'}
                                    </p>
                                )}
                                <div className="flex items-center mt-2">
                                    <button
                                        onClick={() => handleQuantityChange(
                                            item.product.id,
                                            item.selectedVariation?.id ?? null,
                                            item.quantity - 1
                                        )}
                                        className="px-2 py-1 border rounded-l"
                                    >
                                        -
                                    </button>
                                    <span className="px-4 py-1 border-t border-b">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => handleQuantityChange(
                                            item.product.id,
                                            item.selectedVariation?.id ?? null,
                                            item.quantity + 1
                                        )}
                                        className="px-2 py-1 border rounded-r"
                                    >
                                        +
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
                                                        <span className="text-gray-400 line-through">${(originalUnit / 100 * item.quantity).toFixed(2)}</span>
                                                        <span className="font-semibold">${(((discountedUnit ?? originalUnit) / 100) * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="font-semibold">${(originalUnit / 100 * item.quantity).toFixed(2)}</p>
                                            )}
                                        </div>
                                    );
                                })()}
                                <button
                                    onClick={() => removeFromCart(item.product.id, item.selectedVariation?.id ?? null)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="lg:w-1/3">
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                        {calculatedOrder ? (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>${(calculatedOrder.lineItems?.reduce((sum: number, item: any) => 
                                        sum + Number(item.basePriceMoney?.amount || 0), 0) / 100).toFixed(2)}</span>
                                </div>
                                {Number(calculatedOrder.totalDiscountMoney?.amount ?? 0) > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Discounts</span>
                                        <span>-${(Number(calculatedOrder.totalDiscountMoney.amount) / 100).toFixed(2)}</span>
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
                                        <span>${(Number(calculatedOrder.totalTaxMoney.amount) / 100).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span>${(Number(calculatedOrder.totalMoney?.amount ?? 0) / 100).toFixed(2)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between mb-4">
                                <span>Total</span>
                                <span className="font-semibold">
                                    ${cart.reduce((total, item) =>
                                        total + (Number(item.selectedVariation?.itemVariationData?.priceMoney?.amount || 0) / 100 * item.quantity),
                                        0
                                    ).toFixed(2)}
                                </span>
                            </div>
                        )}
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
