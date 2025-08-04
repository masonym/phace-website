import { SquareClient, SquareEnvironment } from "square";
import { randomUUID } from 'crypto';
import { CartItem } from '@/types/product';
import { GetPaymentsRequest } from "square/api";
import { GetCheckoutsRequest } from "square/api/resources/terminal";

interface PaymentResult {
  id: string;
  status: string;
  receiptUrl?: string;
}

interface DiscountCode {
  id: string;
  code: string;
  discountId: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  isActive: boolean;
  expiresAt?: string;
  usageLimit?: number;
  currentUsage?: number;
}

interface AppliedDiscount {
  discountId: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  appliedAmount: number;
}

// Initialize Square client

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
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
            name: item.product.itemData!.name,
            quantity: item.quantity.toString(),
            basePriceMoney: {
              amount: BigInt(Number(item.selectedVariation?.itemVariationData!.priceMoney?.amount) * 100),
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

  /**
   * Create a discount code with associated CatalogDiscount, CatalogProductSet, and CatalogPricingRule
   */
  static async createDiscountCode(
    code: string,
    name: string,
    type: 'PERCENTAGE' | 'FIXED_AMOUNT',
    value: number,
    productIds?: string[],
    expiresAt?: string,
    usageLimit?: number
  ): Promise<DiscountCode> {
    try {
      const batchRequest: any = {
        idempotencyKey: randomUUID(),
        batches: []
      };

      // Create CatalogDiscount
      const discountObject = {
        type: 'DISCOUNT',
        id: `#discount-${code}`,
        discountData: {
          name: name,
          discountType: type,
          ...(type === 'PERCENTAGE' ? {
            percentage: value.toString()
          } : {
            amountMoney: {
              amount: BigInt(Math.round(value * 100)), // Convert to cents
              currency: 'CAD'
            }
          })
        }
      };

      batchRequest.batches.push({
        objects: [discountObject]
      });

      // Create CatalogProductSet if productIds are specified
      let productSetId = null;
      if (productIds && productIds.length > 0) {
        productSetId = `#product-set-${code}`;
        const productSetObject = {
          type: 'PRODUCT_SET',
          id: productSetId,
          productSetData: {
            name: `Product Set for ${name}`,
            productIdsAny: productIds
          }
        };
        batchRequest.batches[0].objects.push(productSetObject);
      }

      // Create CatalogPricingRule
      const pricingRuleObject = {
        type: 'PRICING_RULE',
        id: `#pricing-rule-${code}`,
        pricingRuleData: {
          name: `Pricing Rule for ${name}`,
          discountId: `#discount-${code}`,
          ...(productSetId && {
            matchProductsId: productSetId
          }),
          ...(expiresAt && {
            timePeriodIds: [`#time-period-${code}`]
          })
        }
      };

      batchRequest.batches[0].objects.push(pricingRuleObject);

      // Create TimePeriod if expiration is specified
      if (expiresAt) {
        const timePeriodObject = {
          type: 'TIME_PERIOD',
          id: `#time-period-${code}`,
          timePeriodData: {
            event: `VALID_UNTIL_${expiresAt}`
          }
        };
        batchRequest.batches[0].objects.push(timePeriodObject);
      }

      const result = await client.catalog.batchUpsert(batchRequest);

      if (!result.objects) {
        throw new Error('Failed to create discount code objects');
      }

      // Find the created discount object
      const createdDiscount = result.objects.find(obj => obj.type === 'DISCOUNT');
      if (!createdDiscount) {
        throw new Error('Discount object not found in response');
      }

      return {
        id: createdDiscount.id!,
        code: code,
        discountId: createdDiscount.id!,
        name: name,
        type: type,
        value: value,
        isActive: true,
        expiresAt: expiresAt,
        usageLimit: usageLimit,
        currentUsage: 0
      };
    } catch (error) {
      console.error('Error creating discount code:', error);
      throw error;
    }
  }

  /**
   * Validate and retrieve discount code information
   */
  static async validateDiscountCode(code: string): Promise<DiscountCode | null> {
    try {
      // Search for pricing rules that match the discount code pattern
      const searchResult = await client.catalog.search({
        objectTypes: ['PRICING_RULE'],
        query: {
          textQuery: {
            keywords: [code]
          }
        }
      });

      if (!searchResult.objects || searchResult.objects.length === 0) {
        return null;
      }

      // Find the pricing rule that matches our code
      const pricingRule = searchResult.objects.find(obj => 
        obj.type === 'PRICING_RULE' && (obj as any).pricingRuleData?.name?.includes(code)
      );

      if (!pricingRule || !(pricingRule as any).pricingRuleData?.discountId) {
        return null;
      }

      // Get the associated discount
      const discountResult = await (client.catalog as any).retrieveCatalogObject({
        objectId: (pricingRule as any).pricingRuleData.discountId
      });

      if (!discountResult.object || !discountResult.object.discountData) {
        return null;
      }

      const discount = discountResult.object;
      const discountData = discount.discountData;

      return {
        id: discount.id!,
        code: code,
        discountId: discount.id!,
        name: discountData.name || 'Unknown Discount',
        type: discountData.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT',
        value: discountData.percentage ? 
          parseFloat(discountData.percentage) : 
          (discountData.amountMoney ? Number(discountData.amountMoney.amount) / 100 : 0),
        isActive: true, // TODO: Check if pricing rule is active
        currentUsage: 0 // TODO: Track usage if needed
      };
    } catch (error) {
      console.error('Error validating discount code:', error);
      return null;
    }
  }

  /**
   * Calculate discount amount for given cart items
   */
  static calculateDiscountAmount(
    discount: DiscountCode,
    cartTotal: number
  ): number {
    if (discount.type === 'PERCENTAGE') {
      return Math.round(cartTotal * (discount.value / 100));
    } else {
      return Math.min(discount.value * 100, cartTotal); // Ensure discount doesn't exceed cart total
    }
  }

  /**
   * Apply discount to order before payment
   */
  static async applyDiscountToOrder(
    orderId: string,
    discountId: string
  ): Promise<void> {
    try {
      await client.orders.update({
        orderId: orderId,
        order: {
          locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
          version: 1, // This should be the current version of the order
          discounts: [{
            catalogObjectId: discountId
          }]
        }
      });
    } catch (error) {
      console.error('Error applying discount to order:', error);
      throw error;
    }
  }

  /**
   * List all available discount codes
   */
  static async listDiscountCodes(): Promise<DiscountCode[]> {
    try {
      const result = await client.catalog.search({
        objectTypes: ['PRICING_RULE']
      });

      if (!result.objects) {
        return [];
      }

      const discountCodes: DiscountCode[] = [];

      for (const pricingRule of result.objects) {
        if (pricingRule.type !== 'PRICING_RULE' || !(pricingRule as any).pricingRuleData?.discountId) continue;

        try {
          const discountResult = await (client.catalog as any).retrieveCatalogObject({
            objectId: (pricingRule as any).pricingRuleData.discountId
          });

          if (discountResult.object && discountResult.object.discountData) {
            const discount = discountResult.object;
            const discountData = discount.discountData;
            
            // Extract code from pricing rule name (assuming format "Pricing Rule for [code]")
            const code = (pricingRule as any).pricingRuleData.name?.replace('Pricing Rule for ', '') || 'UNKNOWN';

            discountCodes.push({
              id: discount.id!,
              code: code,
              discountId: discount.id!,
              name: discountData.name || 'Unknown Discount',
              type: discountData.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT',
              value: discountData.percentage ? 
                parseFloat(discountData.percentage) : 
                (discountData.amountMoney ? Number(discountData.amountMoney.amount) / 100 : 0),
              isActive: true,
              currentUsage: 0
            });
          }
        } catch (error) {
          console.error('Error retrieving discount for pricing rule:', error);
          continue;
        }
      }

      return discountCodes;
    } catch (error) {
      console.error('Error listing discount codes:', error);
      throw error;
    }
  }
}
