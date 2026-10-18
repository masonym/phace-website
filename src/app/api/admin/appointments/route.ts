import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { AdminBookingService, MAX_RANGE_DAYS } from '@/lib/services/adminBookingService';

// The Square SDK uses fetch, which Next caches by default; the schedule must always be current
export const fetchCache = 'force-no-store';

// GET /api/admin/appointments?start=ISO&end=ISO&staffId=optional
export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const start = new Date(searchParams.get('start') ?? '');
    const end = new Date(searchParams.get('end') ?? '');

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
        return NextResponse.json({ error: 'Valid start and end dates are required' }, { status: 400 });
    }
    if (end.getTime() - start.getTime() > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
        return NextResponse.json({ error: `Date range can be at most ${MAX_RANGE_DAYS} days` }, { status: 400 });
    }

    try {
        const appointments = await AdminBookingService.listAppointments(start, end, searchParams.get('staffId') ?? undefined);
        return NextResponse.json(appointments);
    } catch (error) {
        console.error('Error listing appointments:', error);
        return NextResponse.json({ error: 'Failed to load appointments from Square' }, { status: 500 });
    }
}
