import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

export class StripeService {
    static async createPaymentIntent(amount: number, currency: string = 'usd') {
        return await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
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
