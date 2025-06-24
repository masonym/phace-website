
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
        currency,
        items,
        shippingAddress,
        locationId,
        fulfillmentMethod,
    } = body;

    try {
        const order: any = {
                locationId,
                pricingOptions: {
                    autoApplyDiscounts: true,
                    autoApplyTaxes: true,
                },
                lineItems: items.map((item: any) => ({
                    name: `${item.name}${item.variationName ? ` (${item.variationName})` : ''}`,
                    quantity: item.quantity.toString(),
                    basePriceMoney: {
                        amount: BigInt(Math.round(item.price * 100)), // price per unit in cents
                        currency,
                    },
                })),
        };

        if (fulfillmentMethod === 'shipping') {
            order.serviceCharges = [
                {
                    name: 'Shipping',
                    amountMoney: {
                        amount: BigInt(2500),
                        currency: 'CAD',
                    },
                    calculationPhase: 'TOTAL_PHASE',
                },
            ];
            order.fulfillments = [
                {
                    type: 'SHIPMENT' as any,
                    state: 'PROPOSED' as any,
                    shipmentDetails: {
                        recipient: {
                            displayName: shippingAddress.name,
                            address: {
                                addressLine1: shippingAddress.street,
                                locality: shippingAddress.city,
                                administrativeDistrictLevel1: shippingAddress.state,
                                postalCode: shippingAddress.zipCode,
                                country: 'CA' as any,
                            },
                        },
                    },
                },
            ];
        } else { // pickup
            order.fulfillments = [
                {
                    type: 'PICKUP' as any,
                    state: 'PROPOSED' as any,
                    recipient: {
                        displayName: shippingAddress.name,
                    },
                    pickupDetails: {
                        isCurbsidePickup: false,
                        note: 'Order ready for pickup.',
                    }
                },
            ];
        }

        const orderResponse = await client.orders.create({ order });

        const orderId = orderResponse.order?.id;
        const totalAmount = orderResponse.order?.totalMoney?.amount;

        if (!orderId || totalAmount === undefined) {
            throw new Error('Failed to create order with Square or retrieve total amount');
        }

        const paymentResponse = await client.payments.create({
            idempotencyKey: crypto.randomUUID(),
            sourceId,
            amountMoney: {
                amount: totalAmount,
                currency,
            },
            locationId,
            orderId,
            shippingAddress: {
                addressLine1: shippingAddress.street,
                locality: shippingAddress.city,
                administrativeDistrictLevel1: shippingAddress.state,
                postalCode: shippingAddress.zipCode,
                country: 'CA' as any,
            },
            note: `Purchase of ${items.length} item(s)`,
            autocomplete: true,
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
