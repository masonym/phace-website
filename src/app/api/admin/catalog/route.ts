import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { AdminCatalogService } from '@/lib/services/adminCatalogService';

// The Square SDK uses fetch, which Next caches by default; admins expect to see edits made in Square right away
export const fetchCache = 'force-no-store';

// GET /api/admin/catalog -- read-only view of bookable services, add-ons and staff in Square
export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        return NextResponse.json(await AdminCatalogService.getSnapshot());
    } catch (error) {
        console.error('Error loading catalog:', error);
        return NextResponse.json({ error: 'Failed to load services from Square' }, { status: 500 });
    }
}
