import { NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/orderService';
import { headers } from 'next/headers';

// Helper to get user ID from the Authorization header
const getUserId = (req: Request) => {
    const authHeader = headers().get('Authorization');
    if (!authHeader) throw new Error('No authorization header');
    
    // In a real app, you'd decode the JWT token to get the user ID
    // This is a simplified version
    const token = authHeader.replace('Bearer ', '');
    // TODO: Decode JWT token and extract user ID
    return 'user-id-from-token';
};

export async function POST(request: Request) {
    try {
        const userId = getUserId(request);
        const orderData = await request.json();
        
        const order = await OrderService.createOrder({
            userId,
            ...orderData,
            paymentProcessor: 'square',
            paymentId: orderData.paymentId,
            status: 'paid'
        });

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('Create order error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create order' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const userId = getUserId(request);
        const orders = await OrderService.getUserOrders(userId);
        
        return NextResponse.json(orders);
    } catch (error: any) {
        console.error('Get orders error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get orders' },
            { status: 500 }
        );
    }
}
