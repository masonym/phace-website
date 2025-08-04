import { NextRequest, NextResponse } from 'next/server';
import { SimpleCouponService } from '@/lib/services/simpleCouponService';

interface ValidateDiscountRequest {
  code: string;
  orderAmount: number;
  cartItems?: any[];
}

export async function POST(request: NextRequest) {
  try {
    const { code, orderAmount } = await request.json();

    if (!code || typeof orderAmount !== 'number') {
      return NextResponse.json(
        { valid: false, error: 'Code and subtotal amount are required' },
        { status: 400 }
      );
    }

    // Validate order amount is positive
    if (orderAmount <= 0) {
      return NextResponse.json(
        { valid: false, error: 'Order amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate the coupon code (now async)
    const coupon = await SimpleCouponService.validateCoupon(code);
    
    if (!coupon) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired discount code'
      });
    }

    // Calculate discount amount (applies to subtotal only, not shipping)
    const discountAmount = SimpleCouponService.calculateDiscount(coupon, orderAmount);
    const finalAmount = Math.max(0, orderAmount - discountAmount);

    return NextResponse.json({
      valid: true,
      discount: {
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        finalAmount
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
