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
        currency,
        items,
        shippingAddress,
        locationId,
        fulfillmentMethod,
        discount,
    } = body;

    try {
        const effectiveLocationId = locationId || process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
        if (!effectiveLocationId) {
            throw new Error('Square locationId is missing. Set NEXT_PUBLIC_SQUARE_LOCATION_ID.');
        }

        const effectiveCurrency = currency || 'CAD';

        const safeAddress = shippingAddress || {
            name: '',
            street: '',
            city: '',
            state: '',
            zipCode: '',
        };

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'No items provided for order calculation.' }, { status: 400 });
        }
        const missingIds: number[] = [];
        items.forEach((it: any, idx: number) => {
            const id = it?.catalogObjectId || it?.variationId;
            if (!id) missingIds.push(idx);
        });
        if (missingIds.length > 0) {
            return NextResponse.json({
                error: `One or more items are missing variationId/catalogObjectId at indices: ${missingIds.join(', ')}`,
            }, { status: 400 });
        }

        const order: any = {
            locationId: effectiveLocationId,
            pricingOptions: {
                autoApplyDiscounts: true,
                autoApplyTaxes: true,
            },
            lineItems: items.map((item: any) => ({
                // Use Square catalog variation ID so pricing rules/discounts auto-apply
                catalogObjectId: item.catalogObjectId || item.variationId,
                quantity: item.quantity.toString(),
            })),
        };

        // Add discount if provided
        if (discount && discount.discountAmount > 0) {
            order.discounts = [
                {
                    name: `${discount.name} (${discount.code})`,
                    type: 'FIXED_AMOUNT',
                    amountMoney: {
                        amount: BigInt(Math.round(discount.discountAmount * 100)), // discount amount in cents
                        currency: effectiveCurrency,
                    },
                    scope: 'ORDER',
                }
            ];
        }

        if (fulfillmentMethod === 'shipping') {
            // Apply a flat shipping service charge for preview without adding a fulfillment to avoid extra required fields
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
        }

        const response = await client.orders.calculate({ order });

        return NextResponse.json(JSON.parse(ProductService.safeStringify({ order: response.order })));
    } catch (error: any) {
        const detail = error?.body?.errors?.[0]?.detail || error?.message || 'An unexpected error occurred';
        console.error('[Square Calculate Order Error]', { detail, raw: error?.body || error });
        return NextResponse.json({ error: detail }, { status: 500 });
    }
}
