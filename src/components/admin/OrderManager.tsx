'use client';

import { useState, useEffect } from 'react';
import { EmailService } from '@/lib/services/emailService';

interface Order {
    id: string;
    userId: string;
    items: Array<{
        productId: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    total: number;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    shippingAddress: {
        name: string;
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    createdAt: string;
    updatedAt: string;
    trackingNumber?: string;
    carrier?: string;
}

export default function OrderManager() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [trackingInfo, setTrackingInfo] = useState({
        trackingNumber: '',
        carrier: '',
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/admin/orders');
            if (!response.ok) throw new Error('Failed to fetch orders');
            const data = await response.json();
            setOrders(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, status: Order['status']) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) throw new Error('Failed to update order status');

            // Send email notification
            const order = orders.find((o) => o.id === orderId);
            if (order) {
                await EmailService.sendOrderStatusUpdate(order, 'customer@example.com', status);
            }

            // Refresh orders list
            await fetchOrders();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const addTrackingInfo = async (orderId: string) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/tracking`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trackingInfo),
            });

            if (!response.ok) throw new Error('Failed to add tracking information');

            // Update order status to shipped
            await updateOrderStatus(orderId, 'shipped');

            setSelectedOrder(null);
            setTrackingInfo({ trackingNumber: '', carrier: '' });
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Order Management</h1>

            <div className="space-y-4">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="border rounded-lg p-4 space-y-2"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold">
                                    Order #{order.id}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {new Date(order.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">
                                    ${order.total.toFixed(2)}
                                </p>
                                <span
                                    className={`inline-block px-2 py-1 rounded text-sm ${
                                        order.status === 'paid'
                                            ? 'bg-green-100 text-green-800'
                                            : order.status === 'shipped'
                                            ? 'bg-blue-100 text-blue-800'
                                            : order.status === 'delivered'
                                            ? 'bg-purple-100 text-purple-800'
                                            : order.status === 'cancelled'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                >
                                    {order.status.charAt(0).toUpperCase() +
                                        order.status.slice(1)}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium">Items:</h4>
                                <ul className="text-sm">
                                    {order.items.map((item, index) => (
                                        <li key={index}>
                                            {item.name} x {item.quantity} - $
                                            {(item.price * item.quantity).toFixed(
                                                2
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium">Shipping Address:</h4>
                                <p className="text-sm">
                                    {order.shippingAddress.name}
                                    <br />
                                    {order.shippingAddress.street}
                                    <br />
                                    {order.shippingAddress.city},{' '}
                                    {order.shippingAddress.state}{' '}
                                    {order.shippingAddress.zipCode}
                                    <br />
                                    {order.shippingAddress.country}
                                </p>
                            </div>
                        </div>

                        {order.trackingNumber && (
                            <div className="text-sm">
                                <p>
                                    Tracking: {order.trackingNumber} ({order.carrier})
                                </p>
                            </div>
                        )}

                        <div className="flex space-x-2">
                            {order.status === 'paid' && (
                                <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded"
                                >
                                    Add Tracking
                                </button>
                            )}
                            {order.status === 'shipped' && (
                                <button
                                    onClick={() =>
                                        updateOrderStatus(order.id, 'delivered')
                                    }
                                    className="px-3 py-1 bg-green-500 text-white rounded"
                                >
                                    Mark Delivered
                                </button>
                            )}
                            {['pending', 'paid'].includes(order.status) && (
                                <button
                                    onClick={() =>
                                        updateOrderStatus(order.id, 'cancelled')
                                    }
                                    className="px-3 py-1 bg-red-500 text-white rounded"
                                >
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">
                            Add Tracking Information
                        </h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                addTrackingInfo(selectedOrder.id);
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block mb-1">
                                    Tracking Number
                                </label>
                                <input
                                    type="text"
                                    value={trackingInfo.trackingNumber}
                                    onChange={(e) =>
                                        setTrackingInfo({
                                            ...trackingInfo,
                                            trackingNumber: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Carrier</label>
                                <input
                                    type="text"
                                    value={trackingInfo.carrier}
                                    onChange={(e) =>
                                        setTrackingInfo({
                                            ...trackingInfo,
                                            carrier: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedOrder(null)}
                                    className="px-4 py-2 border rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
