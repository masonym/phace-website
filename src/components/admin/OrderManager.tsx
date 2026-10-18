'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, X } from 'lucide-react';
import { adminFetch } from '@/lib/auth/clientSession';
import { formatMoney } from '@/lib/utils/format';
import { formatClinicTime } from '@/lib/utils/clinicTime';
import { showToast } from '@/components/ui/Toast';
import type { AdminOrder, OrderView, OrderAction } from '@/lib/services/adminOrderService';

const VIEWS: { id: OrderView; label: string }[] = [
    { id: 'open', label: 'To do' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
];

function statusLabel(order: AdminOrder): { text: string; className: string } {
    const f = order.fulfillment;
    if (!f) return { text: 'Unknown', className: 'bg-gray-100 text-gray-700' };

    switch (f.state) {
        case 'CANCELED':
            return { text: 'Cancelled', className: 'bg-gray-100 text-gray-700' };
        case 'FAILED':
            return { text: 'Failed', className: 'bg-red-100 text-red-800' };
        case 'COMPLETED':
            return {
                text: f.type === 'PICKUP' ? 'Picked up' : 'Shipped',
                className: 'bg-green-100 text-green-800',
            };
        case 'PREPARED':
            if (f.type === 'PICKUP') return { text: 'Ready for pickup', className: 'bg-blue-100 text-blue-800' };
        // falls through: a prepared shipment still needs shipping
        default:
            return {
                text: f.type === 'PICKUP' ? 'New' : 'To ship',
                className: 'bg-yellow-100 text-yellow-800',
            };
    }
}

const shortId = (id: string) => `#${id.slice(-6).toUpperCase()}`;
const formatDate = (iso: string) => formatClinicTime(iso, 'LLL d, yyyy h:mm a');

export default function OrderManager() {
    const [view, setView] = useState<OrderView>('open');
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [cursor, setCursor] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState<AdminOrder | null>(null);

    const fetchOrders = useCallback(async (nextCursor?: string) => {
        const params = new URLSearchParams({ view });
        if (nextCursor) params.set('cursor', nextCursor);

        const response = await adminFetch(`/api/admin/orders?${params}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Failed to load orders');
        return data as { orders: AdminOrder[]; cursor?: string };
    }, [view]);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError('');

        fetchOrders()
            .then(data => {
                if (cancelled) return;
                setOrders(data.orders);
                setCursor(data.cursor);
            })
            .catch(err => !cancelled && setError(err.message))
            .finally(() => !cancelled && setIsLoading(false));

        return () => {
            cancelled = true;
        };
    }, [fetchOrders]);

    const loadMore = async () => {
        if (!cursor) return;
        setIsLoadingMore(true);
        try {
            const data = await fetchOrders(cursor);
            setOrders(prev => [...prev, ...data.orders]);
            setCursor(data.cursor);
        } catch (err: any) {
            showToast({ title: 'Error', description: err.message, status: 'error' });
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleUpdated = (updated: AdminOrder) => {
        setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
        setSelected(updated);
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-6">
                <h1 className="text-3xl font-semibold">Orders</h1>
                <p className="text-gray-600 mt-2">
                    Paid store orders from the website. Refunds and cancellations are done in the Square Dashboard.
                </p>
            </div>

            <div className="flex gap-2 mb-6 border-b" role="tablist">
                {VIEWS.map(v => (
                    <button
                        key={v.id}
                        role="tab"
                        aria-selected={view === v.id}
                        onClick={() => setView(v.id)}
                        className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium ${view === v.id
                            ? 'border-accent text-accent'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    {view === 'open' ? 'No orders waiting on you' : 'No orders here yet'}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Date', 'Order', 'Customer', 'Items', 'Total', 'Method', 'Status'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.map(order => {
                                const status = statusLabel(order);
                                const itemCount = order.items.reduce((sum, i) => sum + Number(i.quantity), 0);
                                return (
                                    <tr
                                        key={order.id}
                                        onClick={() => setSelected(order)}
                                        className="hover:bg-gray-50 cursor-pointer"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelected(order);
                                                }}
                                                className="text-accent hover:underline"
                                                title={order.id}
                                            >
                                                {shortId(order.id)}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer.name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{itemCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatMoney(order.total)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.fulfillment?.type === 'SHIPMENT' ? 'Shipping' : 'Pickup'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${status.className}`}>{status.text}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {cursor && !isLoading && (
                <div className="mt-6 text-center">
                    <button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                        {isLoadingMore ? 'Loading...' : 'Load more'}
                    </button>
                </div>
            )}

            {selected && (
                <OrderDetail
                    order={selected}
                    onClose={() => setSelected(null)}
                    onUpdated={handleUpdated}
                />
            )}
        </div>
    );
}

function OrderDetail({
    order,
    onClose,
    onUpdated,
}: {
    order: AdminOrder;
    onClose: () => void;
    onUpdated: (order: AdminOrder) => void;
}) {
    const [trackingNumber, setTrackingNumber] = useState(order.fulfillment?.trackingNumber ?? '');
    const [carrier, setCarrier] = useState(order.fulfillment?.carrier ?? '');
    const [notifyCustomer, setNotifyCustomer] = useState(true);
    const [pendingAction, setPendingAction] = useState<OrderAction | null>(null);

    const f = order.fulfillment;
    const status = statusLabel(order);
    const isPickup = f?.type === 'PICKUP';
    const isOpen = !!f && !['COMPLETED', 'CANCELED', 'FAILED'].includes(f.state);
    const canMarkReady = isOpen && isPickup && f.state !== 'PREPARED';
    const canMarkPickedUp = isOpen && isPickup && f.state === 'PREPARED';
    const canShip = isOpen && !isPickup;
    const sendsEmail = canMarkReady || canShip;

    const runAction = async (action: OrderAction) => {
        setPendingAction(action);
        try {
            const response = await adminFetch(`/api/admin/orders/${order.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ action, trackingNumber, carrier, notifyCustomer }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || 'Failed to update order');

            onUpdated(data.order);
            const emailNote = action === 'complete' || !notifyCustomer || !order.customer.email
                ? ''
                : data.emailSent ? ' The customer was emailed.' : ' The customer email could not be sent.';
            showToast({ title: 'Order updated', description: `${statusLabel(data.order).text}.${emailNote}`, status: 'success' });
        } catch (err: any) {
            showToast({ title: 'Error', description: err.message, status: 'error' });
        } finally {
            setPendingAction(null);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="order-detail-title"
                className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start p-6 border-b">
                    <div>
                        <h2 id="order-detail-title" className="text-xl font-semibold">Order {shortId(order.id)}</h2>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                        <p className="text-xs text-gray-400 font-mono mt-1 break-all">{order.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${status.className}`}>{status.text}</span>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <section>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Customer</h3>
                            <p className="text-gray-900">{order.customer.name || '-'}</p>
                            {order.customer.email && (
                                <a href={`mailto:${order.customer.email}`} className="block text-sm text-accent hover:underline">
                                    {order.customer.email}
                                </a>
                            )}
                            {order.customer.phone && (
                                <a href={`tel:${order.customer.phone}`} className="block text-sm text-accent hover:underline">
                                    {order.customer.phone}
                                </a>
                            )}
                        </section>
                        <section>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                                {isPickup ? 'Pickup' : 'Ship to'}
                            </h3>
                            {isPickup ? (
                                <p className="text-sm text-gray-700">Customer picks up at the clinic</p>
                            ) : f?.address ? (
                                <p className="text-sm text-gray-700">
                                    {f.recipientName && <>{f.recipientName}<br /></>}
                                    {f.address.line1}<br />
                                    {f.address.city}, {f.address.province} {f.address.postalCode}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500">No address on the order</p>
                            )}
                            {f?.trackingNumber && (
                                <p className="text-sm text-gray-700 mt-2">
                                    Tracking: <span className="font-mono">{f.trackingNumber}</span>
                                    {f.carrier && ` (${f.carrier})`}
                                </p>
                            )}
                        </section>
                    </div>

                    <section>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Items</h3>
                        <ul className="divide-y border rounded-md">
                            {order.items.map(item => (
                                <li key={item.uid} className="flex justify-between gap-4 px-4 py-2 text-sm">
                                    <span>
                                        {item.name}
                                        {item.variationName && <span className="text-gray-500"> ({item.variationName})</span>}
                                        <span className="text-gray-500"> &times; {item.quantity}</span>
                                    </span>
                                    <span className="whitespace-nowrap">{formatMoney(item.total)}</span>
                                </li>
                            ))}
                        </ul>
                        <dl className="mt-3 space-y-1 text-sm">
                            <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd>{formatMoney(order.subtotal)}</dd></div>
                            {order.discount > 0 && (
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Discount{order.discountNames.length > 0 && ` (${order.discountNames.join(', ')})`}</dt>
                                    <dd>-{formatMoney(order.discount)}</dd>
                                </div>
                            )}
                            {order.shipping > 0 && (
                                <div className="flex justify-between"><dt className="text-gray-500">Shipping</dt><dd>{formatMoney(order.shipping)}</dd></div>
                            )}
                            <div className="flex justify-between"><dt className="text-gray-500">Tax</dt><dd>{formatMoney(order.tax)}</dd></div>
                            <div className="flex justify-between font-semibold border-t pt-2"><dt>Total</dt><dd>{formatMoney(order.total)}</dd></div>
                        </dl>
                    </section>

                    {isOpen && (
                        <section className="border-t pt-6 space-y-4">
                            {canShip && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className="block text-sm">
                                        <span className="text-gray-700">Tracking number (optional)</span>
                                        <input
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-accent focus:ring-accent"
                                        />
                                    </label>
                                    <label className="block text-sm">
                                        <span className="text-gray-700">Carrier (optional)</span>
                                        <input
                                            value={carrier}
                                            onChange={(e) => setCarrier(e.target.value)}
                                            placeholder="e.g. Canada Post"
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-accent focus:ring-accent"
                                        />
                                    </label>
                                </div>
                            )}

                            {sendsEmail && (
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={notifyCustomer}
                                        onChange={(e) => setNotifyCustomer(e.target.checked)}
                                        disabled={!order.customer.email}
                                        className="rounded border-gray-300 text-accent focus:ring-accent"
                                    />
                                    {order.customer.email ? 'Email the customer' : 'No customer email on file'}
                                </label>
                            )}

                            <div className="flex flex-wrap gap-3">
                                {canMarkReady && (
                                    <ActionButton action="ready" pending={pendingAction} onClick={runAction}>
                                        Mark ready for pickup
                                    </ActionButton>
                                )}
                                {canMarkPickedUp && (
                                    <ActionButton action="complete" pending={pendingAction} onClick={runAction}>
                                        Mark picked up
                                    </ActionButton>
                                )}
                                {canShip && (
                                    <ActionButton action="ship" pending={pendingAction} onClick={runAction}>
                                        Mark shipped
                                    </ActionButton>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

function ActionButton({
    action,
    pending,
    onClick,
    children,
}: {
    action: OrderAction;
    pending: OrderAction | null;
    onClick: (action: OrderAction) => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={() => onClick(action)}
            disabled={pending !== null}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent/90 disabled:opacity-50"
        >
            {pending === action && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
