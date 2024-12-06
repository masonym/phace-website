import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/services/bookingService';
import { addMinutes, parseISO, format, eachMinuteOfInterval } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const serviceId = searchParams.get('serviceId');
        const staffId = searchParams.get('staffId');
        const date = searchParams.get('date');

        if (!serviceId || !staffId || !date) {
            return NextResponse.json(
                { error: 'Service ID, Staff ID, and date are required' },
                { status: 400 }
            );
        }

        // Get service details to know duration
        const service = await BookingService.getServiceById(serviceId);
        if (!service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        // Get staff availability for the date
        const startOfDay = `${date}T00:00:00Z`;
        const endOfDay = `${date}T23:59:59Z`;
        
        // Get existing appointments
        const appointments = await BookingService.getStaffAppointments(
            staffId,
            startOfDay,
            endOfDay
        );

        // Get staff's default availability for this day of week
        const dayOfWeek = parseISO(date).getDay();
        const staffAvailability = await BookingService.getStaffAvailability(staffId, dayOfWeek);

        if (!staffAvailability) {
            return NextResponse.json([]);
        }

        // Get blocked times
        const blockedTimes = await BookingService.getBlockedTimes(
            staffId,
            startOfDay,
            endOfDay
        );

        // Generate all possible time slots based on service duration
        const availableTimeSlots = [];
        const { startTime, endTime } = staffAvailability;
        
        const dayStart = parseISO(`${date}T${startTime}`);
        const dayEnd = parseISO(`${date}T${endTime}`);

        // Create 15-minute intervals
        const intervals = eachMinuteOfInterval(
            { start: dayStart, end: dayEnd },
            { step: 15 }
        );

        for (const slotStart of intervals) {
            const slotEnd = addMinutes(slotStart, service.duration);
            
            // Check if slot ends before closing time
            if (slotEnd > dayEnd) continue;

            // Check if slot conflicts with any appointments
            const hasConflict = appointments.some(apt => {
                const aptStart = parseISO(apt.startTime);
                const aptEnd = parseISO(apt.endTime);
                return (
                    (slotStart >= aptStart && slotStart < aptEnd) ||
                    (slotEnd > aptStart && slotEnd <= aptEnd)
                );
            });

            // Check if slot is in blocked time
            const isBlocked = blockedTimes.some(block => {
                const blockStart = parseISO(block.startTime);
                const blockEnd = parseISO(block.endTime);
                return (
                    (slotStart >= blockStart && slotStart < blockEnd) ||
                    (slotEnd > blockStart && slotEnd <= blockEnd)
                );
            });

            if (!hasConflict && !isBlocked) {
                availableTimeSlots.push({
                    startTime: format(slotStart, "yyyy-MM-dd'T'HH:mm:ssXXX"),
                    endTime: format(slotEnd, "yyyy-MM-dd'T'HH:mm:ssXXX"),
                    available: true,
                });
            }
        }

        return NextResponse.json(availableTimeSlots);
    } catch (error: any) {
        console.error('Error fetching availability:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch availability' },
            { status: 500 }
        );
    }
}
