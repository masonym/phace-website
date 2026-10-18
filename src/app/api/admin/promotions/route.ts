import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getB2G1CategoryId } from '@/lib/services/orderDiscountService';

// GET /api/admin/promotions -- automatic promotions configured through environment variables
export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const categoryId = getB2G1CategoryId();
    // The cart and checkout previews only see the public variable; if it differs, they show a different total than is charged
    const previewCategoryId = process.env.NEXT_PUBLIC_B2G1_PROMO_CATEGORY_ID || '';

    return NextResponse.json({
        b2g1: {
            categoryId: categoryId || null,
            previewMismatch: categoryId !== previewCategoryId,
        },
    });
}
