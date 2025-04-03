import { NextRequest, NextResponse } from 'next/server';
import { SquareClient } from 'square';
import { randomUUID } from 'crypto';

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { nonce, amount, appointmentId } = body;

        if (!nonce || !amount || !appointmentId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const paymentResponse = await client.payments.create({
            sourceId: nonce,
            amountMoney: {
                amount: BigInt(amount), // Amount in cents
                currency: 'USD',
            },
            idempotencyKey: randomUUID(),
            locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
            referenceId: appointmentId, // Link payment to appointment
        });

        if (paymentResponse.payment) {
            return NextResponse.json({
                paymentId: paymentResponse.payment.id,
                status: paymentResponse.payment.status,
            });
        }

        throw new Error('Payment creation failed');
    } catch (error) {
        console.error('Payment processing error:', error);
        return NextResponse.json(
            {
                error: 'Failed to process payment',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
