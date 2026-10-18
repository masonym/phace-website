import { NextRequest, NextResponse } from 'next/server';
import { previewCouponDiscount } from '@/lib/services/orderDiscountService';
import { CartItem } from '@/types/product';

interface ValidateDiscountRequest {
  code: string;
  cartItems: CartItem[];
}

export async function POST(request: NextRequest) {
  try {
    const { code, cartItems }: ValidateDiscountRequest = await request.json();

    if (!code || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Code and cart items are required' },
        { status: 400 }
      );
    }

    // Price the cart from the Square catalog rather than trusting browser totals
    const items = cartItems.map((item) => ({
      variationId: item.selectedVariation?.id,
      quantity: item.quantity,
    }));
    const preview = await previewCouponDiscount(items, code);

    if (!preview) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired discount code'
      });
    }

    const { coupon, discountAmount } = preview;
    if (discountAmount <= 0) {
      return NextResponse.json({
        valid: false,
        error: coupon.categoryIds?.length
          ? "This code doesn't apply to any items in your cart"
          : 'Invalid or expired discount code'
      });
    }

    return NextResponse.json({
      valid: true,
      discount: {
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discountAmount
      }
    });
  } catch (error) {
    console.error('Error validating discount:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
