import { NextResponse } from 'next/server';
import { SquareService } from '@/lib/services/squareService';

export async function POST(request: Request) {
    try {
        // We're now using Square instead of Stripe
        // This route is kept for backward compatibility
        // New code should use /api/square-payment directly
        
        const { amount, items, shippingAddress, sourceId } = await request.json();
        
        if (!sourceId) {
            return NextResponse.json(
                { error: 'Payment source ID is required for Square payments' },
                { status: 400 }
            );
        }

        const payment = await SquareService.createPayment(
            sourceId,
            amount,
            items,
            shippingAddress
        );

        return NextResponse.json({
            payment,
            // Include clientSecret for backward compatibility
            clientSecret: 'square-payment-' + payment.id,
        });
    } catch (error: any) {
        console.error('Square payment error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process payment' },
            { status: 500 }
        );
    }
}
