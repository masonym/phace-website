import { NextRequest, NextResponse } from 'next/server';
import { SquareBookingService } from "@/lib/services/squareBookingService";
import { parseISO } from 'date-fns';

import { DateTime } from 'luxon';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const staffId = searchParams.get('staffId');
        const serviceId = searchParams.get('serviceId');
        const variationId = searchParams.get('variationId');
        const addonIds = searchParams.get('addons')?.split(',') || [];

        const startDate = searchParams.get('start');
        const endDate = searchParams.get('end');

        console.log("Start and end date: ", startDate, endDate);

        if (!staffId || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
        }

        const slots = await SquareBookingService.getAvailableTimeSlotsInRange({
            staffId,
            serviceId: serviceId ?? undefined,
            variationId: variationId ?? undefined,
            startDate,
            endDate,
            addonIds,
        });

        const grouped: Record<string, any[]> = {};
        for (const slot of slots) {
            const localDate = DateTime.fromISO(slot.startTime)
                .setZone('America/Los_Angeles')
                .toISODate();

            if (!localDate) continue; // skip invalid

            if (!grouped[localDate]) grouped[localDate] = [];
            grouped[localDate].push(slot);
        }


        const isSingleDay = (() => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            return end.getTime() - start.getTime() <= 26 * 60 * 60 * 1000;
        })();
        if (isSingleDay) {
            const slots = grouped[startDate] || [];
            return NextResponse.json({ slots });
        }
        else {
            return NextResponse.json({ slotsByDate: grouped });
        }
    } catch (err) {
        console.error('Error in availability handler:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
