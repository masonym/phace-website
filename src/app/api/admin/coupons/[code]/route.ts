import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { SimpleCouponService } from '@/lib/services/simpleCouponService';
import { parseCouponFields } from '@/lib/utils/couponInput';

type Params = { params: { code: string } };

/** Replaces a coupon's editable fields; optional fields left out are cleared. The code itself can't change. */
export async function PUT(request: Request, { params }: Params) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const body = await request.json();
        const parsed = parseCouponFields(body);
        if ('error' in parsed) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }
        if (typeof body.isActive !== 'boolean') {
            return NextResponse.json({ error: 'isActive must be true or false' }, { status: 400 });
        }

        const { expiresAt, usageLimit, categoryIds, ...fields } = parsed.fields;
        const updated = await SimpleCouponService.updateCoupon(params.code, {
            ...fields,
            isActive: body.isActive,
            expiresAt: expiresAt ?? null,
            usageLimit: usageLimit ?? null,
            categoryIds: categoryIds ?? null,
        });
        if (!updated) {
            return NextResponse.json({ error: 'Could not update coupon. It may have been deleted.' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating coupon:', error);
        return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: Params) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const deleted = await SimpleCouponService.deleteCoupon(params.code);
        if (!deleted) {
            return NextResponse.json({ error: 'Could not delete coupon. It may already be gone.' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
    }
}
