import Stripe from 'stripe';
import { CartItem } from '@/types/cart';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

interface ShippingAddress {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export class StripeService {
    static async createPaymentIntent(
        amount: number,
        items: CartItem[],
        shippingAddress: ShippingAddress,
        currency: string = 'cad'
    ) {
        // Create a customer
        const customer = await stripe.customers.create({
            name: shippingAddress.name,
            shipping: {
                name: shippingAddress.name,
                address: {
                    line1: shippingAddress.street,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    postal_code: shippingAddress.zipCode,
                    country: shippingAddress.country,
                },
            },
        });

        // Create payment intent
        return await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            customer: customer.id,
            shipping: {
                name: shippingAddress.name,
                address: {
                    line1: shippingAddress.street,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    postal_code: shippingAddress.zipCode,
                    country: shippingAddress.country,
                },
            },
            metadata: {
                items: JSON.stringify(
                    items.map(item => ({
                        id: item.product.id,
                        name: item.product.name,
                        price: item.product.price,
                        quantity: item.quantity,
                        color: item.selectedColor?.name || 'N/A',
                    }))
                ),
            },
        });
    }

    static async createCustomer(email: string, name: string) {
        return await stripe.customers.create({
            email,
            name,
        });
    }

    static async getPublishableKey() {
        return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    }
}
