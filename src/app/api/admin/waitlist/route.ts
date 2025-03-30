import { NextRequest, NextResponse } from 'next/server';
import { SquareBookingService } from '@/lib/services/squareBookingService';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const serviceId = searchParams.get('serviceId');
        const staffId = searchParams.get('staffId');
        const status = (searchParams.get('status') || 'active') as 'active' | 'contacted' | 'booked' | 'expired';

        const entries = serviceId
            ? await SquareBookingService.getWaitlistEntriesByService(serviceId, status, staffId || undefined)
            : await SquareBookingService.getWaitlistEntries(status, staffId || undefined);

        return NextResponse.json(entries);
    } catch (error: any) {
        console.error('Error fetching waitlist entries:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { id, status, notes } = await req.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updatedEntry = await SquareBookingService.updateWaitlistStatus(id, status, notes);
        return NextResponse.json(updatedEntry);
    } catch (error: any) {
        console.error('Error updating waitlist entry:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing waitlist entry ID' }, { status: 400 });
        }

        await SquareBookingService.deleteWaitlistEntry(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting waitlist entry:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
