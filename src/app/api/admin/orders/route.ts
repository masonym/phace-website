import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { AdminOrderService, type OrderView } from '@/lib/services/adminOrderService';

// The Square SDK uses fetch, which Next caches by default; orders must always be current
export const fetchCache = 'force-no-store';

const VIEWS: OrderView[] = ['open', 'completed', 'cancelled'];

// GET /api/admin/orders?view=open|completed|cancelled&cursor=...
export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const view = (searchParams.get('view') ?? 'open') as OrderView;
    if (!VIEWS.includes(view)) {
        return NextResponse.json({ error: 'Unknown view' }, { status: 400 });
    }

    try {
        const result = await AdminOrderService.listOrders(view, searchParams.get('cursor') ?? undefined);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error listing orders:', error);
        return NextResponse.json({ error: 'Failed to load orders from Square' }, { status: 500 });
    }
}
