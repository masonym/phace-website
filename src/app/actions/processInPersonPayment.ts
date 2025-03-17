'use server';

import { SquareService } from '@/lib/services/squareService';
import { CartItem } from '@/types/cart';
import { revalidatePath } from 'next/cache';

interface InPersonPaymentParams {
  amount: number;
  items: CartItem[];
  customerName: string;
  customerEmail?: string;
  notes?: string;
}

export async function processInPersonPayment({
  amount,
  items,
  customerName,
  customerEmail,
  notes
}: InPersonPaymentParams) {
  try {
    // Create a payment with Square using a different method for in-person
    const client = await SquareService.getSquareClient();
    
    // For in-person payments, you'd typically use a different flow
    // This is a simplified example that creates a record of the in-person transaction
    const { result } = await client.ordersApi.createOrder({
      order: {
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
        lineItems: items.map(item => ({
          name: item.product.name,
          quantity: item.quantity.toString(),
          basePriceMoney: {
            amount: BigInt(Math.round(item.product.price * 100)),
            currency: 'CAD'
          },
          note: item.selectedColor ? `Color: ${item.selectedColor.name}` : undefined
        })),
        state: 'COMPLETED',
        customerId: customerEmail ? `customer-${customerEmail.replace('@', '-at-')}` : undefined,
        metadata: {
          source: 'in-person',
          customerName,
          notes: notes || ''
        }
      },
      idempotencyKey: `in-person-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    });

    // Create an order in your system
    // This would typically call your OrderService
    
    // Revalidate any paths that show orders or inventory
    revalidatePath('/admin/orders');
    revalidatePath('/store');
    
    return { 
      success: true, 
      orderId: result.order?.id,
      message: 'In-person payment recorded successfully' 
    };
  } catch (error: any) {
    console.error('In-person payment error:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to process in-person payment' 
    };
  }
}
