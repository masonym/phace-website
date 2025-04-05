import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        items,
        totalAmount,
        currency,
        customerId,
        paymentId,
        locationId,
        notes,
    } = body;

    try {
        // 🧪 TODO: Persist this to a database like Postgres, Mongo, etc.
        console.log('[Order received]', {
            customerId,
            items,
            totalAmount,
            currency,
            paymentId,
            locationId,
            notes,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Order Error]', error.message);
        return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
    }
}
