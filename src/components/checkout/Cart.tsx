'use client';

import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Cart() {
    const { state: cart, removeFromCart, updateQuantity } = useCart();
    const router = useRouter();

    const handleQuantityChange = (productId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        updateQuantity(productId, newQuantity);
    };

    const handleCheckout = () => {
        router.push('/checkout');
    };

    if (cart.items.length === 0) {
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
                    {cart.items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center border-b py-4 space-x-4"
                        >
                            <div className="relative h-24 w-24">
                                <Image
                                    src={item.images[0] || '/images/placeholder.jpg'}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-semibold">{item.name}</h3>
                                <p className="text-gray-600">${item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() =>
                                        handleQuantityChange(item.id, item.quantity - 1)
                                    }
                                    className="px-2 py-1 border rounded"
                                >
                                    -
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                    onClick={() =>
                                        handleQuantityChange(item.id, item.quantity + 1)
                                    }
                                    className="px-2 py-1 border rounded"
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-700"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
                <div className="lg:w-1/3">
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${cart.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>Calculated at checkout</span>
                            </div>
                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span>${cart.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="w-full mt-6 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition-colors"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
