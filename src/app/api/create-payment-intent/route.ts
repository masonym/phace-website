import { NextResponse } from 'next/server';
import { StripeService } from '@/lib/services/stripeService';

export async function POST(request: Request) {
    try {
        const { amount, items, shippingAddress } = await request.json();

        const paymentIntent = await StripeService.createPaymentIntent(
            amount,
            items,
            shippingAddress
        );

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error: any) {
        console.error('Payment intent creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create payment intent' },
            { status: 500 }
        );
    }
}
