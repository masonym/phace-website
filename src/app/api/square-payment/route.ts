import { NextResponse } from 'next/server';
import { SquareService } from '@/lib/services/squareService';

export async function POST(request: Request) {
    try {
        const { sourceId, amount, items, shippingAddress } = await request.json();

        const payment = await SquareService.createPayment(
            sourceId,
            amount,
            items,
            shippingAddress
        );

        return NextResponse.json({
            payment
        });
    } catch (error: any) {
        console.error('Square payment error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process payment' },
            { status: 500 }
        );
    }
}
