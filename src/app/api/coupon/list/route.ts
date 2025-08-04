import { NextResponse } from 'next/server';
import { SimpleCouponService } from '@/lib/services/simpleCouponService';

export async function GET() {
  try {
    const coupons = await SimpleCouponService.listCoupons();
    
    return NextResponse.json({
      success: true,
      coupons: coupons.map(coupon => ({
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        isActive: coupon.isActive,
        expiresAt: coupon.expiresAt?.toISOString(),
        usageLimit: coupon.usageLimit,
        currentUsage: coupon.currentUsage,
        createdAt: coupon.createdAt.toISOString(),
      }))
    });
  } catch (error) {
    console.error('Error listing coupons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
