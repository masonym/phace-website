// THIS FILE IS NOT BEING USED AT ALL I THINK
// MAYBE WE SHOULD USE IT FOR A CHECKOUT POPUP.
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/components/providers/CartProvider';
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk';

interface ShippingAddress {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export default function Checkout() {
    const { cart, getCartTotal, clearCart } = useCartContext();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'CA', // Default to Canada, adjust as needed
    });
    
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
            const response = await fetch('/api/square-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceId: token.token,
                    amount: getCartTotal() * 100, // Convert to cents for Square
                    currency: 'CAD',
                    items: cart.map(item => ({
                        productId: item.product.id,
                        variationId: item.selectedVariation?.id || null,
                        quantity: item.quantity,
                        name: item.product.itemData!.name,
                        variationName: item.selectedVariation?.itemVariationData?.name || 'Default',
                        price: Number(item.selectedVariation?.itemVariationData?.priceMoney?.amount || 0) / 100,
                    })),
                    shippingAddress,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to process payment');
            }

            const { payment } = await response.json();

            const orderResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        productId: item.product.id,
                        variationId: item.selectedVariation?.id || null,
                        quantity: item.quantity,
                        name: item.product.itemData!.name!,
                        variationName: item.selectedVariation?.itemVariationData?.name || 'Default',
                        price: Number(item.selectedVariation?.itemVariationData?.priceMoney?.amount || 0) / 100,
                    })),
                    total: getCartTotal(),
                    shippingAddress,
                    paymentId: payment.id,
                }),
            });

            if (!orderResponse.ok) {
                throw new Error('Failed to create order');
            }

            clearCart();
            router.push('/checkout/success');
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
                    <button
                        onClick={() => router.push('/store')}
                        className="text-black hover:text-gray-700"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
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
                            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
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
                                        placeholder="Province"
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
                                        placeholder="Postal Code"
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
                            <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
                            
                            <PaymentForm
                                applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!}
                                locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
                                cardTokenizeResponseReceived={handleCardTokenizeResponseReceived}
                                createVerificationDetails={() => ({
                                    amount: String(getCartTotal() * 100), // Convert to cents
                                    currencyCode: 'CAD',
                                    intent: 'CHARGE',
                                    billingContact: {
                                        familyName: shippingAddress.name.split(' ').slice(1).join(' ') || '',
                                        givenName: shippingAddress.name.split(' ')[0] || '',
                                        email: '',
                                        country: shippingAddress.country,
                                        city: shippingAddress.city,
                                        addressLines: [shippingAddress.street],
                                        postalCode: shippingAddress.zipCode,
                                    },
                                })}
                            >
                                <CreditCard
                                    render={(Button: any) => (
                                        <div className="flex justify-end mt-4">
                                            <Button
                                                css={{
                                                    backgroundColor: '#B09182',
                                                    color: 'white',
                                                    padding: '12px 32px',
                                                    borderRadius: '9999px',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    '&:after': {
                                                        backgroundColor: '#B09182',
                                                    },
                                                    '&:hover': {
                                                        backgroundColor: '#B09182/90',
                                                    },
                                                    '&:active': {
                                                        backgroundColor: '#B09182',
                                                    },
                                                    marginLeft: 'auto',
                                                    width: '40%',
                                                }}
                                            >
                                                Continue to Consent Forms
                                            </Button>
                                        </div>
                                    )}
                                />
                            </PaymentForm>
                        </div>
                    </div>
                </div>

                <div className="lg:w-1/3">
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                        <div className="space-y-4">
                            {cart.map((item, index) => (
                                <div
                                    key={`${item.product.id}-${item.selectedVariation?.id}-${index}`}
                                    className="flex justify-between items-center"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{item.quantity}x</span>
                                        <span>{item.product.itemData!.name}</span>
                                        {item.selectedVariation && (
                                            <span className="text-gray-600">
                                                ({item.selectedVariation.itemVariationData?.name || 'Default'})
                                            </span>
                                        )}
                                    </div>
                                    <span>
                                        C${(Number(item.selectedVariation?.itemVariationData?.priceMoney?.amount || 0) / 100 * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            <div className="border-t pt-4 mt-4">
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
