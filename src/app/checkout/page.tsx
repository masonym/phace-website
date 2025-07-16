'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/components/providers/CartProvider';
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk';
import Image from 'next/image';

interface ShippingAddress {
    name: string;
    email: string;
    phone: string;
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
    const [calculating, setCalculating] = useState(false);
    const [calculatedOrder, setCalculatedOrder] = useState<any>(null);
    const [fulfillmentMethod, setFulfillmentMethod] = useState('shipping'); // 'shipping' or 'pickup'
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
        name: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Canada',
    });

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShippingAddress({
            ...shippingAddress,
            [e.target.name]: e.target.value,
        });
    };

    useEffect(() => {
        if (cart.length === 0) {
            router.push('/store');
        }
    }, [cart, router]);

    useEffect(() => {
        const calculateOrder = async () => {
            const canadianPostalCodeRegex = /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/;
            if (cart.length > 0 && canadianPostalCodeRegex.test(shippingAddress.zipCode)) {
                try {
                    setCalculating(true);
                    const response = await fetch('/api/calculate-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            currency: 'CAD',
                            items: cart.map(item => ({
                                name: item.product.itemData!.name,
                                variationName: item.selectedVariation?.itemVariationData?.name || 'Default',
                                quantity: item.quantity,
                                price: Number(item.selectedVariation?.itemVariationData?.priceMoney?.amount || 0) / 100,
                            })),
                            shippingAddress,
                            locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
                            fulfillmentMethod,
                        }),
                    });
                    if (response.ok) {
                        const { order } = await response.json();
                        setCalculatedOrder(order);
                        setError('');
                    } else {
                        const { error } = await response.json();
                        setError(error || 'Failed to calculate shipping and taxes.');
                        setCalculatedOrder(null);
                    }
                } catch (err: any) {
                    setError(err.message || 'Failed to calculate totals.');
                    setCalculatedOrder(null);
                } finally {
                    setCalculating(false);
                }
            }
        };

        const debounceTimer = setTimeout(() => {
            calculateOrder();
        }, 800);

        return () => clearTimeout(debounceTimer);
    }, [cart, shippingAddress, fulfillmentMethod]);

    const validateShippingAddress = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10}$/;
        const canadianPostalCodeRegex = /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/;

        if (!shippingAddress.name.trim()) return 'Name is required';
        if (!emailRegex.test(shippingAddress.email)) return 'Invalid email address';
        if (!phoneRegex.test(shippingAddress.phone)) return 'Invalid phone number (format: 123-456-7890)';
        if (!shippingAddress.street.trim()) return 'Street is required';
        if (!shippingAddress.city.trim()) return 'City is required';
        if (!shippingAddress.state.trim()) return 'Province is required';
        if (!canadianPostalCodeRegex.test(shippingAddress.zipCode)) return 'Invalid postal code (format: A1A 1A1)';
        if (!shippingAddress.country.trim()) return 'Country is required';

        return null;
    };

    function formatPhoneNumber(value: string): string {
        const digits = value.replace(/\D/g, '').slice(0, 10); // only numbers, max 10
        const parts = [];

        if (digits.length > 0) parts.push('(' + digits.slice(0, 3));
        if (digits.length >= 4) parts.push(') ' + digits.slice(3, 6));
        if (digits.length >= 7) parts.push('-' + digits.slice(6, 10));

        return parts.join('');
    }

    const handleCardTokenizeResponseReceived = async (token: any) => {
        const validationError = validateShippingAddress();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/square-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceId: token.token,
                    amount: getCartTotal() * 100,
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
                    locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
                    fulfillmentMethod,
                }),
            });

            if (!response.ok) throw new Error('Failed to process payment');
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

            if (!orderResponse.ok) throw new Error('Failed to create order');
            router.push('/checkout/success');
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 pt-24">
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
                            <h2 className="text-xl font-semibold mb-4">Fulfillment Method</h2>
                            <div className="flex gap-4 mb-4">
                                <label className="flex items-center gap-2 p-3 border rounded-lg w-1/2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="fulfillment"
                                        value="shipping"
                                        checked={fulfillmentMethod === 'shipping'}
                                        onChange={() => setFulfillmentMethod('shipping')}
                                    />
                                    <div>
                                        <div>Shipping</div>
                                        <div className="text-sm text-gray-500">$25.00 Flat Rate</div>
                                    </div>
                                </label>
                                <label className="flex items-center gap-2 p-3 border rounded-lg w-1/2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="fulfillment"
                                        value="pickup"
                                        checked={fulfillmentMethod === 'pickup'}
                                        onChange={() => setFulfillmentMethod('pickup')}
                                    />
                                    <div>
                                        <div>Local Pickup</div>
                                        <div className="text-sm text-gray-500">Free</div>
                                    </div>
                                </label>
                            </div>
                        </div>

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
                                    name="email"
                                    placeholder="Email Address"
                                    required
                                    className="w-full px-3 py-2 border rounded"
                                    value={shippingAddress.email}
                                    onChange={handleAddressChange}
                                />
                                <div className="flex items-center gap-2">
                                    <span className="border rounded px-3 py-2 flex items-center gap-1">
                                        <img src="/images/canada-flag-icon.svg" alt="CA" className="w-5 h-5" />
                                        +1
                                    </span>
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Phone Number"
                                        required
                                        className="w-full px-3 py-2 border rounded"
                                        value={formatPhoneNumber(shippingAddress.phone)}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, ''); // strip non-digits
                                            setShippingAddress(prev => ({ ...prev, phone: raw }));
                                        }}
                                    />
                                </div>
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
                                    amount: String(calculatedOrder ? calculatedOrder.totalMoney.amount : getCartTotal() * 100),
                                    currencyCode: 'CAD',
                                    intent: 'CHARGE',
                                    billingContact: {
                                        familyName: shippingAddress.name.split(' ').slice(1).join(' ') || '',
                                        givenName: shippingAddress.name.split(' ')[0] || '',
                                        email: shippingAddress.email,
                                        phone: shippingAddress.phone,
                                        countryCode: 'CA',
                                        city: shippingAddress.city,
                                        addressLines: [shippingAddress.street],
                                        postalCode: shippingAddress.zipCode.replace(/\s/g, ''),
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
                                                Process Payment
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
                                        <div className="relative w-8 h-8 flex-shrink-0">
                                            <Image
                                                src={(item.product.itemData as any).ecom_image_uris?.[0] || '/images/placeholder.png'}
                                                alt={item.product.itemData!.name || 'Product Image'}
                                                fill
                                                className="object-cover rounded"
                                            />
                                        </div>
                                        <div>
                                            <span>{item.product.itemData!.name}</span>
                                            {item.selectedVariation && (
                                                <span className="text-gray-600 block text-sm">
                                                    ({item.selectedVariation.itemVariationData?.name || 'Default'})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span>
                                        C${(Number(item.selectedVariation?.itemVariationData?.priceMoney?.amount || 0) / 100 * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            <div className="border-t pt-4 mt-4 space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>C${getCartTotal().toFixed(2)}</span>
                                </div>
                                {fulfillmentMethod === 'shipping' && (
                                    <div className="flex justify-between">
                                        <span>Shipping</span>
                                        <span>C$25.00</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span>
                                        {calculating
                                            ? 'Calculating...'
                                            : calculatedOrder
                                                ? `C$${(Number(calculatedOrder.totalTaxMoney.amount) / 100).toFixed(2)}`
                                                : 'Enter address to calculate'}
                                    </span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span>
                                        {calculatedOrder
                                            ? `C$${(Number(calculatedOrder.totalMoney.amount) / 100).toFixed(2)}`
                                            : `C$${(getCartTotal() + (fulfillmentMethod === 'shipping' ? 25 : 0)).toFixed(2)}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
