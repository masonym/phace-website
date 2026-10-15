import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { ProductWaitlistService } from '@/lib/services/productWaitlistService';

export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const entries = await ProductWaitlistService.list();
        return NextResponse.json(entries);
    } catch (error) {
        console.error('Error listing product waitlist:', error);
        return NextResponse.json({ error: 'Failed to load waitlist' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const { productId, email } = await request.json();
        if (typeof productId !== 'string' || typeof email !== 'string') {
            return NextResponse.json({ error: 'productId and email are required' }, { status: 400 });
        }
        await ProductWaitlistService.remove(productId, email);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing product waitlist entry:', error);
        return NextResponse.json({ error: 'Failed to remove entry' }, { status: 500 });
    }
}
