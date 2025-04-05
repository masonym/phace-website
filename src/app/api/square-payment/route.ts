
import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';
import { SquareClient, SquareEnvironment } from "square";

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment:
        process.env.SQUARE_ENVIRONMENT === "production"
            ? SquareEnvironment.Production
            : SquareEnvironment.Sandbox,
});

export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        sourceId,
        amount, // total amount in cents
        currency,
        items,
        shippingAddress,
        locationId,
    } = body;

    try {
        const orderResponse = await client.orders.create({
            order: {
                locationId,
                lineItems: items.map((item: any) => ({
                    name: `${item.name}${item.variationName ? ` (${item.variationName})` : ''}`,
                    quantity: item.quantity.toString(),
                    basePriceMoney: {
                        amount: BigInt(Math.round(item.price * 100)), // price per unit in cents
                        currency,
                    },
                })),
            },
        });

        const orderId = orderResponse.order?.id;
        if (!orderId) throw new Error('Failed to create order with Square');

        const paymentResponse = await client.payments.create({
            idempotencyKey: crypto.randomUUID(),
            sourceId,
            amountMoney: {
                amount: BigInt(amount),
                currency,
            },
            locationId,
            orderId,
            shippingAddress: {
                addressLine1: shippingAddress.street,
                locality: shippingAddress.city,
                administrativeDistrictLevel1: shippingAddress.state,
                postalCode: shippingAddress.zipCode,
                country: "CA",
            },
            note: `Purchase of ${items.length} item(s)`,
            autocomplete: false,
        });

        return NextResponse.json(JSON.parse(ProductService.safeStringify({ payment: paymentResponse.payment })));
    } catch (error: any) {
        const message =
            error?.body?.errors?.[0]?.detail ||
            error?.message ||
            'An unexpected error occurred';
        console.error('[Square Payment Error]', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
