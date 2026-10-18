import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { AdminOrderService, type OrderAction } from '@/lib/services/adminOrderService';
import { EmailService } from '@/lib/services/emailService';

// The Square SDK uses fetch, which Next caches by default; orders must always be current
export const fetchCache = 'force-no-store';

const ACTIONS: OrderAction[] = ['ready', 'complete', 'ship'];

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        return NextResponse.json(await AdminOrderService.getOrder(params.id));
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
}

// PATCH /api/admin/orders/{id}  { action, trackingNumber?, carrier?, notifyCustomer? }
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const { action, trackingNumber, carrier, notifyCustomer = true } = await request.json().catch(() => ({}));
    if (!ACTIONS.includes(action)) {
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    let order;
    try {
        order = await AdminOrderService.updateFulfillment(params.id, action, { trackingNumber, carrier });
    } catch (error: any) {
        console.error('Error updating order fulfillment:', error?.body ?? error);
        const message = error?.body?.errors?.[0]?.detail || error?.message || 'Failed to update order';
        return NextResponse.json({ error: message }, { status: 400 });
    }

    // Tell the customer when there's something for them to do or watch for
    let emailSent = false;
    const emailStatus = action === 'ready' ? 'ready' : action === 'ship' ? 'shipped' : null;
    if (notifyCustomer && emailStatus && order.customer.email) {
        try {
            await EmailService.sendOrderStatusUpdate({
                orderId: order.id,
                customerName: order.customer.name ?? '',
                customerEmail: order.customer.email,
                status: emailStatus,
                items: order.items,
                trackingNumber: order.fulfillment?.trackingNumber,
                carrier: order.fulfillment?.carrier,
            });
            emailSent = true;
        } catch (error) {
            console.error('Order updated but status email failed:', error);
        }
    }

    return NextResponse.json({ order, emailSent });
}
