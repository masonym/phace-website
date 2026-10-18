import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { AdminBookingService } from '@/lib/services/adminBookingService';

// The Square SDK uses fetch, which Next caches by default; staff must always be current
export const fetchCache = 'force-no-store';

// GET /api/admin/staff -- everyone with a Square booking profile
export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        return NextResponse.json(await AdminBookingService.listStaff());
    } catch (error) {
        console.error('Error listing staff:', error);
        return NextResponse.json({ error: 'Failed to load staff from Square' }, { status: 500 });
    }
}
