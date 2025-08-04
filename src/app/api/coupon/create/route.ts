import { NextRequest, NextResponse } from 'next/server';
import { SimpleCouponService } from '@/lib/services/simpleCouponService';

interface CreateCouponRequest {
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  expiresAt?: string;
  usageLimit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCouponRequest = await request.json();

    // Validate required fields
    if (!body.code || !body.name || !body.type || typeof body.value !== 'number') {
      return NextResponse.json(
        { error: 'Code, name, type, and value are required' },
        { status: 400 }
      );
    }

    // Validate value is positive
    if (body.value <= 0) {
      return NextResponse.json(
        { error: 'Value must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate percentage is not over 100
    if (body.type === 'PERCENTAGE' && body.value > 100) {
      return NextResponse.json(
        { error: 'Percentage cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Create the coupon
    const couponData = {
      code: body.code.toUpperCase(),
      name: body.name,
      type: body.type,
      value: body.value,
      isActive: true,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      usageLimit: body.usageLimit,
    };

    const success = await SimpleCouponService.createCoupon(couponData);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to create coupon. Code may already exist.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: couponData.code,
        name: couponData.name,
        type: couponData.type,
        value: couponData.value,
        isActive: couponData.isActive,
        expiresAt: couponData.expiresAt?.toISOString(),
        usageLimit: couponData.usageLimit,
      }
    });

  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
