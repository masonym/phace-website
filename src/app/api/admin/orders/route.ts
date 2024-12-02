import { NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/orderService';
import { EmailService } from '@/lib/services/emailService';

export async function GET(request: Request) {
    try {
        const orders = await OrderService.getAllOrders();
        return NextResponse.json(orders);
    } catch (error: any) {
        console.error('Get orders error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get orders' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const { orderId, status, trackingNumber, carrier } = await request.json();

        const order = await OrderService.updateOrderStatus(orderId, status);

        if (trackingNumber && carrier) {
            await OrderService.addTrackingInfo(orderId, trackingNumber, carrier);
        }

        // Send email notification
        await EmailService.sendOrderStatusUpdate(order, 'customer@example.com', status);

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('Update order error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update order' },
            { status: 500 }
        );
    }
}
