import { NextResponse } from 'next/server';
import { SquareBookingService } from '@/lib/services/bookingService';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const {
            serviceId,
            clientName,
            clientEmail,
            clientPhone,
            preferredDates,
            preferredStaffIds,
        } = data;

        // Validate required fields
        if (!serviceId || !clientName || !clientEmail || !clientPhone || !preferredDates) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Add to waitlist
        await SquareBookingService.addToWaitlist({
            serviceId,
            clientName,
            clientEmail,
            clientPhone,
            preferredDates,
            preferredStaffIds: preferredStaffIds || [],
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in waitlist endpoint:', error);
        return NextResponse.json(
            { error: 'Failed to add to waitlist' },
            { status: 500 }
        );
    }
}
