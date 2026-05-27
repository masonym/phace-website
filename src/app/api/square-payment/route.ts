
import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';
import { EmailService } from '@/lib/services/emailService';
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
        discount,
    } = body;

    try {
        const order: any = {
                locationId,
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
                        currency,
                    },
                    scope: 'ORDER',
                }
            ];
        }

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
                    pickupDetails: {
                        recipient: {
                            displayName: shippingAddress.name,
                        },
                        isCurbsidePickup: false,
                        note: 'Order ready for pickup.',
                        scheduleType: 'ASAP',
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

        // Create or retrieve Square customer for receipt email and customer history
        const nameParts = shippingAddress.name.split(' ').filter(Boolean);
        const givenName = nameParts[0] || '';
        const familyName = nameParts.slice(1).join(' ') || '';

        const customerResponse = await client.customers.create({
            idempotencyKey: crypto.randomUUID(),
            emailAddress: shippingAddress.email,
            givenName,
            familyName,
            phoneNumber: shippingAddress.phone ? `+1${shippingAddress.phone.replace(/\D/g, '')}` : undefined,
            address: {
                addressLine1: shippingAddress.street,
                locality: shippingAddress.city,
                administrativeDistrictLevel1: shippingAddress.state,
                postalCode: shippingAddress.zipCode,
                country: 'CA',
            },
        });

        const customerId = customerResponse.customer?.id;
        if (!customerId) {
            throw new Error('Failed to create Square customer');
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
            customerId,
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

        // Send branded confirmation email via AWS SES
        try {
            const squareOrder = orderResponse.order!;
            const formatMoney = (amount: bigint | null | undefined) =>
                `$${((Number(amount ?? BigInt(0))) / 100).toFixed(2)} CAD`;

            const lineItems = squareOrder.lineItems ?? [];
            const subtotalCents = lineItems.reduce(
                (sum, li) => sum + Number(li.totalMoney?.amount ?? BigInt(0)),
                0
            );

            const discountAmount = squareOrder.totalDiscountMoney?.amount;

            await EmailService.sendOrderConfirmation({
                orderId: orderId,
                customerName: shippingAddress.name,
                customerEmail: shippingAddress.email,
                items: lineItems.map((li) => ({
                    name: li.name ?? 'Item',
                    variationName: li.variationName ?? undefined,
                    quantity: li.quantity ?? '1',
                    totalFormatted: formatMoney(li.totalMoney?.amount),
                })),
                subtotalFormatted: `$${(subtotalCents / 100).toFixed(2)} CAD`,
                taxFormatted: formatMoney(squareOrder.totalTaxMoney?.amount),
                discountFormatted: discountAmount && discountAmount > BigInt(0)
                    ? formatMoney(discountAmount)
                    : undefined,
                totalFormatted: formatMoney(squareOrder.totalMoney?.amount),
                fulfillmentMethod: fulfillmentMethod === 'shipping' ? 'shipping' : 'pickup',
                shippingAddress: fulfillmentMethod === 'shipping' ? {
                    street: shippingAddress.street,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    zipCode: shippingAddress.zipCode,
                } : undefined,
                receiptUrl: paymentResponse.payment?.receiptUrl ?? undefined,
            });
        } catch (emailError) {
            console.error('[Email Error] Failed to send order confirmation:', emailError);
        }

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
