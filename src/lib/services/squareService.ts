import { SquareClient } from "square";
import { randomUUID } from 'crypto';
import { CartItem } from '@/types/cart';
import { GetPaymentsRequest } from "square/api";
import { GetCheckoutsRequest } from "square/api/resources/terminal";

interface PaymentResult {
  id: string;
  status: string;
  receiptUrl?: string;
}

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
});

interface ShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export class SquareService {
  /**
   * Process a payment with Square
   */
  static async processPayment(
    sourceId: string,
    amount: number,
    customerId?: string,
    note?: string
  ) {
    try {
      // Create a payment with Square
      const result = await client.payments.create({
        sourceId,
        idempotencyKey: randomUUID(),
        amountMoney: {
          amount: BigInt(amount),
          currency: "CAD",
        },
        customerId,
        note,
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
        autocomplete: true
      });

      if (!result.payment) {
        throw new Error('Failed to process payment with Square');
      }

      return {
        id: result.payment.id,
        status: result.payment.status,
        receiptUrl: result.payment.receiptUrl
      } as PaymentResult;
    } catch (error) {
      console.error('Error processing payment with Square:', error);
      throw error;
    }
  }

  /**
   * Process an in-person payment with Square
   */
  static async processInPersonPayment(
    amount: number,
    customerId?: string,
    note?: string,
    items?: CartItem[]
  ) {
    try {
      // Create an order first
      const orderResponse = await client.orders.create({
        order: {
          locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
          lineItems: items?.map(item => ({
            name: item.product.name,
            quantity: item.quantity.toString(),
            basePriceMoney: {
              amount: BigInt(item.product.price * 100),
              currency: "CAD",
            }
          })) || [],
          state: 'OPEN'
        },
        idempotencyKey: randomUUID()
      });

      if (!orderResponse.order) {
        throw new Error('Failed to create order with Square');
      }

      // Create a terminal checkout
      const result = await client.terminal.checkouts.create({
        idempotencyKey: randomUUID(),
        checkout: {
          amountMoney: {
            amount: BigInt(amount),
            currency: "CAD",
          },
          deviceOptions: {
            deviceId: process.env.SQUARE_TERMINAL_DEVICE_ID!,
            skipReceiptScreen: false,
            tipSettings: {
              allowTipping: true
            }
          },
          note,
          orderId: orderResponse.order.id,
          customerId,
          locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
        }
      });

      if (!result.checkout) {
        throw new Error('Failed to create terminal checkout with Square');
      }

      return {
        id: result.checkout.id,
        status: result.checkout.status,
        paymentId: result.checkout.paymentIds
      };
    } catch (error) {
      console.error('Error processing in-person payment with Square:', error);
      throw error;
    }
  }

  /**
   * Get a payment by ID
   */
  static async getPayment(paymentId: GetPaymentsRequest) {
    try {
      const result = await client.payments.get(paymentId)

      if (!result.payment) {
        throw new Error('Payment not found');
      }

      return {
        id: result.payment.id,
        status: result.payment.status,
        receiptUrl: result.payment.receiptUrl
      } as PaymentResult;
    } catch (error) {
      console.error('Error getting payment from Square:', error);
      throw error;
    }
  }

  /**
   * Get a terminal checkout by ID
   */
  static async getTerminalCheckout(checkoutId: GetCheckoutsRequest) {
    try {
      const result = await client.terminal.checkouts.get(checkoutId);

      if (!result.checkout) {
        throw new Error('Terminal checkout not found');
      }

      return {
        id: result.checkout.id,
        status: result.checkout.status,
        paymentId: result.checkout.paymentIds
      };
    } catch (error) {
      console.error('Error getting terminal checkout from Square:', error);
      throw error;
    }
  }
}
