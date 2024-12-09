'use client';

import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Cart() {
    const { cart, removeFromCart, updateQuantity } = useCart();
    const router = useRouter();

    const handleQuantityChange = (productId: string, colorName: string | null, newQuantity: number) => {
        if (newQuantity < 1) return;
        updateQuantity(productId, colorName, newQuantity);
    };

    const handleCheckout = () => {
        router.push('/checkout');
    };

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
                    {cart.map((item) => (
                        <div
                            key={`${item.product.id}-${item.selectedColor?.name ?? 'no-color'}`}
                            className="flex items-center border-b py-4 space-x-4"
                        >
                            <div className="relative h-24 w-24">
                                <Image
                                    src={item.product.images[0] || '/images/placeholder.jpg'}
                                    alt={item.product.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-semibold">{item.product.name}</h3>
                                {item.selectedColor && (
                                    <p className="text-gray-600">Color: {item.selectedColor.name}</p>
                                )}
                                <div className="flex items-center mt-2">
                                    <button
                                        onClick={() => handleQuantityChange(
                                            item.product.id,
                                            item.selectedColor?.name ?? null,
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
                                            item.selectedColor?.name ?? null,
                                            item.quantity + 1
                                        )}
                                        className="px-2 py-1 border rounded-r"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                                <button
                                    onClick={() => removeFromCart(item.product.id, item.selectedColor?.name ?? null)}
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
                        <div className="flex justify-between mb-4">
                            <span>Total</span>
                            <span className="font-semibold">
                                ${cart.reduce((total, item) => total + (item.product.price * item.quantity), 0).toFixed(2)}
                            </span>
                        </div>
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
