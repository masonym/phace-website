import { NextRequest, NextResponse } from 'next/server';
import { SimpleCouponService } from '@/lib/services/simpleCouponService';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { parseCouponFields } from '@/lib/utils/couponInput';

interface CreateCouponRequest {
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  expiresAt?: string;
  usageLimit?: number;
  categoryIds?: string[];
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body: CreateCouponRequest = await request.json();

    if (!body.code || typeof body.code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const parsed = parseCouponFields(body);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // Create the coupon
    const couponData = {
      ...parsed.fields,
      code: body.code.trim().toUpperCase(),
      isActive: true,
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
        categoryIds: couponData.categoryIds ?? [],
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
