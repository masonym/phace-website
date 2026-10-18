import { SquareClient, SquareEnvironment, Square } from 'square';
import { randomUUID } from 'crypto';

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment:
        process.env.SQUARE_ENVIRONMENT === 'production'
            ? SquareEnvironment.Production
            : SquareEnvironment.Sandbox,
});

export type OrderView = 'open' | 'completed' | 'cancelled';
export type FulfillmentType = 'PICKUP' | 'SHIPMENT';
export type FulfillmentState = Square.FulfillmentState;

/** What the admin can do to an order's fulfillment */
export type OrderAction = 'ready' | 'complete' | 'ship';

export interface AdminOrder {
    id: string;
    createdAt: string;
    state: string;
    fulfillment: {
        uid: string;
        type: FulfillmentType;
        state: FulfillmentState;
        recipientName?: string;
        address?: {
            line1?: string;
            city?: string;
            province?: string;
            postalCode?: string;
        };
        trackingNumber?: string;
        carrier?: string;
    } | null;
    customer: {
        name?: string;
        email?: string;
        phone?: string;
    };
    items: {
        uid: string;
        name: string;
        variationName?: string;
        quantity: string;
        /** cents */
        total: number;
    }[];
    // All amounts in cents
    subtotal: number;
    discount: number;
    discountNames: string[];
    tax: number;
    shipping: number;
    total: number;
}

// Orders made by the website always have exactly one PICKUP or SHIPMENT fulfillment
const FULFILLMENT_TYPES: FulfillmentType[] = ['PICKUP', 'SHIPMENT'];

const VIEW_FULFILLMENT_STATES: Record<OrderView, FulfillmentState[]> = {
    open: ['PROPOSED', 'RESERVED', 'PREPARED'],
    completed: ['COMPLETED'],
    cancelled: ['CANCELED', 'FAILED'],
};

// Square moves fulfillments forward one state at a time
const STATE_ORDER: FulfillmentState[] = ['PROPOSED', 'RESERVED', 'PREPARED', 'COMPLETED'];

const cents = (money?: Square.Money | null) => Number(money?.amount ?? 0);

function getWebFulfillment(order: Square.Order) {
    return order.fulfillments?.find(f => FULFILLMENT_TYPES.includes(f.type as FulfillmentType)) ?? null;
}

/** Abandoned checkouts leave an order behind with nothing paid; the admin never needs to see those */
function isPaid(order: Square.Order): boolean {
    return (order.tenders?.length ?? 0) > 0 && cents(order.netAmountDueMoney) === 0;
}

function toAdminOrder(order: Square.Order, customer?: Square.Customer): AdminOrder {
    const fulfillment = getWebFulfillment(order);
    const shipment = fulfillment?.shipmentDetails;
    const pickup = fulfillment?.pickupDetails;
    const recipient = shipment?.recipient ?? pickup?.recipient;
    const address = shipment?.recipient?.address ?? customer?.address;

    const items = (order.lineItems ?? []).map(li => ({
        uid: li.uid ?? '',
        name: li.name ?? 'Item',
        variationName: li.variationName ?? undefined,
        quantity: li.quantity,
        total: cents(li.totalMoney),
    }));

    const customerName = [customer?.givenName, customer?.familyName].filter(Boolean).join(' ');

    return {
        id: order.id!,
        createdAt: order.createdAt!,
        state: order.state ?? 'OPEN',
        fulfillment: fulfillment ? {
            uid: fulfillment.uid!,
            type: fulfillment.type as FulfillmentType,
            state: fulfillment.state ?? 'PROPOSED',
            recipientName: recipient?.displayName ?? undefined,
            address: shipment && address ? {
                line1: address.addressLine1 ?? undefined,
                city: address.locality ?? undefined,
                province: address.administrativeDistrictLevel1 ?? undefined,
                postalCode: address.postalCode ?? undefined,
            } : undefined,
            trackingNumber: shipment?.trackingNumber ?? undefined,
            carrier: shipment?.carrier ?? undefined,
        } : null,
        customer: {
            name: customerName || recipient?.displayName || undefined,
            email: customer?.emailAddress ?? recipient?.emailAddress ?? undefined,
            phone: customer?.phoneNumber ?? recipient?.phoneNumber ?? undefined,
        },
        items,
        subtotal: items.reduce((sum, item) => sum + item.total, 0),
        discount: cents(order.totalDiscountMoney),
        discountNames: (order.discounts ?? []).map(d => d.name).filter((n): n is string => !!n),
        tax: cents(order.totalTaxMoney),
        shipping: cents(order.totalServiceChargeMoney),
        total: cents(order.totalMoney),
    };
}

async function getCustomers(customerIds: string[]): Promise<Record<string, Square.Customer>> {
    const ids = [...new Set(customerIds)];
    if (ids.length === 0) return {};

    const result = await client.customers.bulkRetrieveCustomers({ customerIds: ids });
    const customers: Record<string, Square.Customer> = {};
    for (const [id, response] of Object.entries(result.responses ?? {})) {
        if (response.customer) customers[id] = response.customer;
    }
    return customers;
}

async function getSquareOrder(orderId: string): Promise<Square.Order> {
    const result = await client.orders.get({ orderId });
    if (!result.order) throw new Error('Order not found');
    return result.order;
}

export class AdminOrderService {
    /** Paid website orders, newest first */
    static async listOrders(view: OrderView, cursor?: string): Promise<{ orders: AdminOrder[]; cursor?: string }> {
        const result = await client.orders.search({
            locationIds: [process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!],
            cursor,
            limit: 50,
            query: {
                filter: {
                    stateFilter: { states: ['OPEN', 'COMPLETED', 'CANCELED'] },
                    fulfillmentFilter: {
                        fulfillmentTypes: FULFILLMENT_TYPES,
                        fulfillmentStates: VIEW_FULFILLMENT_STATES[view],
                    },
                },
                sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
            },
        });

        const paidOrders = (result.orders ?? []).filter(isPaid);
        const customers = await getCustomers(
            paidOrders.map(o => o.customerId).filter((id): id is string => !!id)
        );

        return {
            orders: paidOrders.map(o => toAdminOrder(o, o.customerId ? customers[o.customerId] : undefined)),
            cursor: result.cursor ?? undefined,
        };
    }

    static async getOrder(orderId: string): Promise<AdminOrder> {
        const order = await getSquareOrder(orderId);
        const customers = order.customerId ? await getCustomers([order.customerId]) : {};
        return toAdminOrder(order, order.customerId ? customers[order.customerId] : undefined);
    }

    /**
     * Moves the order's fulfillment forward:
     * - ready:    pickup order is ready to collect (PREPARED)
     * - complete: pickup order was collected (COMPLETED)
     * - ship:     shipment was sent, optionally with tracking (COMPLETED)
     */
    static async updateFulfillment(
        orderId: string,
        action: OrderAction,
        tracking?: { trackingNumber?: string; carrier?: string }
    ): Promise<AdminOrder> {
        let order = await getSquareOrder(orderId);
        const fulfillment = getWebFulfillment(order);
        if (!fulfillment?.uid) throw new Error('This order has no pickup or shipping details');

        const isPickup = fulfillment.type === 'PICKUP';
        if ((action === 'ship') === isPickup) {
            throw new Error(isPickup ? 'Pickup orders cannot be shipped' : 'Shipping orders are completed by marking them shipped');
        }

        const target: FulfillmentState = action === 'ready' ? 'PREPARED' : 'COMPLETED';
        const currentIndex = STATE_ORDER.indexOf(fulfillment.state ?? 'PROPOSED');
        const targetIndex = STATE_ORDER.indexOf(target);
        if (currentIndex === -1) throw new Error('This order was cancelled');
        if (currentIndex >= targetIndex) throw new Error('This order has already moved past that step');

        for (const state of STATE_ORDER.slice(currentIndex + 1, targetIndex + 1)) {
            const isFinalStep = state === target;
            const update: Square.Fulfillment = { uid: fulfillment.uid, state };

            if (isFinalStep && action === 'ship') {
                update.shipmentDetails = {
                    trackingNumber: tracking?.trackingNumber?.trim() || undefined,
                    carrier: tracking?.carrier?.trim() || undefined,
                };
            }

            const result = await client.orders.update({
                orderId,
                idempotencyKey: randomUUID(),
                order: {
                    locationId: order.locationId,
                    version: order.version,
                    fulfillments: [update],
                },
            });
            if (!result.order) throw new Error('Square did not return the updated order');
            order = result.order;
        }

        // A collected/shipped order is done; closing it keeps it out of Square's open orders too
        if (target === 'COMPLETED' && order.state === 'OPEN') {
            try {
                const result = await client.orders.update({
                    orderId,
                    idempotencyKey: randomUUID(),
                    order: { locationId: order.locationId, version: order.version, state: 'COMPLETED' },
                });
                if (result.order) order = result.order;
            } catch (error) {
                console.error(`Fulfillment completed but order ${orderId} could not be closed:`, error);
            }
        }

        const customers = order.customerId ? await getCustomers([order.customerId]) : {};
        return toAdminOrder(order, order.customerId ? customers[order.customerId] : undefined);
    }
}
