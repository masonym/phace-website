"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/components/providers/CartProvider';
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk';
import Image from 'next/image';

interface ShippingAddress {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export default function CheckoutPage() {
    const { cart, getCartTotal, clearCart } = useCartContext();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [applicationId, setApplicationId] = useState('');
    const [locationId, setLocationId] = useState('');
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
    });

    useEffect(() => {
        if (cart.length === 0) {
            router.push('/store');
        }
        
        // Get Square configuration
        const fetchSquareConfig = async () => {
            setApplicationId(process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '');
            setLocationId(process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '');
        };
        
        fetchSquareConfig();
    }, [cart, router]);

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShippingAddress({
            ...shippingAddress,
            [e.target.name]: e.target.value,
        });
    };

    const handleCardTokenizeResponseReceived = async (token: any) => {
        setLoading(true);
        setError('');

        try {
            // Process payment with Square
            const response = await fetch('/api/square-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceId: token.token,
                    amount: getCartTotal(),
                    items: cart,
                    shippingAddress,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to process payment');
            }

            const { payment } = await response.json();
            
            // Create order in your system
            const orderResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    items: cart,
                    total: getCartTotal(),
                    shippingAddress,
                    paymentId: payment.id,
                }),
            });

            if (!orderResponse.ok) {
                throw new Error('Failed to create order');
            }

            // Clear cart and redirect to success page
            clearCart();
            router.push('/checkout/success');
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return null; // Will redirect in useEffect
    }

    if (!applicationId || !locationId) {
        return (
            <div className="container mx-auto px-4 py-8 pt-32">
                <p>Loading payment system...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pt-32">
            <h1 className="text-2xl font-bold mb-8">Checkout</h1>
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-2/3">
                    <div className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded">
                                {error}
                            </div>
                        )}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-4">
                                Shipping Address
                            </h2>
                            <div className="grid grid-cols-1 gap-4">
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
                                    required
                                    className="w-full px-3 py-2 border rounded"
                                    value={shippingAddress.name}
                                    onChange={handleAddressChange}
                                />
                                <input
                                    type="text"
                                    name="street"
                                    placeholder="Street Address"
                                    required
                                    className="w-full px-3 py-2 border rounded"
                                    value={shippingAddress.street}
                                    onChange={handleAddressChange}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        required
                                        className="w-full px-3 py-2 border rounded"
                                        value={shippingAddress.city}
                                        onChange={handleAddressChange}
                                    />
                                    <input
                                        type="text"
                                        name="state"
                                        placeholder="State/Province"
                                        required
                                        className="w-full px-3 py-2 border rounded"
                                        value={shippingAddress.state}
                                        onChange={handleAddressChange}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        name="zipCode"
                                        placeholder="ZIP / Postal Code"
                                        required
                                        className="w-full px-3 py-2 border rounded"
                                        value={shippingAddress.zipCode}
                                        onChange={handleAddressChange}
                                    />
                                    <input
                                        type="text"
                                        name="country"
                                        placeholder="Country"
                                        required
                                        className="w-full px-3 py-2 border rounded"
                                        value={shippingAddress.country}
                                        onChange={handleAddressChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-4">
                                Payment Information
                            </h2>
                            <PaymentForm
                                applicationId={applicationId}
                                locationId={locationId}
                                cardTokenizeResponseReceived={handleCardTokenizeResponseReceived}
                                createVerificationDetails={() => ({
                                    amount: String(getCartTotal()),
                                    currencyCode: 'CAD',
                                    intent: 'CHARGE',
                                    billingContact: {
                                        familyName: shippingAddress.name.split(' ').slice(1).join(' '),
                                        givenName: shippingAddress.name.split(' ')[0],
                                        email: '',
                                        country: shippingAddress.country,
                                        city: shippingAddress.city,
                                        addressLines: [shippingAddress.street],
                                        postalCode: shippingAddress.zipCode,
                                    }
                                })}
                            >
                                <CreditCard 
                                    buttonProps={{
                                        isLoading: loading,
                                        css: {
                                            backgroundColor: '#000',
                                            color: '#fff',
                                            '&:hover': {
                                                backgroundColor: '#333',
                                            },
                                            '&:disabled': {
                                                opacity: 0.5,
                                                cursor: 'not-allowed',
                                            },
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.375rem',
                                            marginTop: '1rem',
                                        }
                                    }}
                                />
                            </PaymentForm>
                        </div>
                    </div>
                </div>

                <div className="lg:w-1/3">
                    <div className="bg-gray-50 p-6 rounded-lg sticky top-32">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                        <div className="space-y-4">
                            {cart.map((item, index) => (
                                <div
                                    key={`${item.product.id}-${item.selectedColor?.name}-${index}`}
                                    className="flex justify-between items-center"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{item.quantity}x</span>
                                        <span>{item.product.name}</span>
                                        {item.selectedColor && (
                                            <div
                                                className="w-4 h-4 rounded-full border"
                                                style={{ backgroundColor: item.selectedColor.hex }}
                                                title={item.selectedColor.name}
                                            />
                                        )}
                                    </div>
                                    <span>C${(item.product.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t pt-4">
                                <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span>C${getCartTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
