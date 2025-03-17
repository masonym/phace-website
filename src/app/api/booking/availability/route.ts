import { NextResponse } from 'next/server';
import { SquareBookingService } from '@/lib/services/squareBookingService';
import { addMinutes, parseISO, format, eachMinuteOfInterval } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const serviceId = searchParams.get('serviceId');
        const staffId = searchParams.get('staffId');
        const date = searchParams.get('date');
        const addons = searchParams.get('addons')?.split(',').filter(Boolean) || [];

        if (!serviceId || !staffId || !date) {
            return NextResponse.json(
                { error: 'Service ID, Staff ID, and date are required' },
                { status: 400 }
            );
        }

        // Get service details to know duration
        const service = await SquareBookingService.getServiceById(serviceId);
        if (!service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        // Calculate total duration including addons
        let totalDuration = parseInt(service.duration.toString(), 10);
        if (addons.length > 0) {
            const addonDetails = await SquareBookingService.getAddonsByIds(addons);
            for (const addon of addonDetails) {
                if (addon) {
                    totalDuration += parseInt(addon.duration.toString(), 10);
                }
            }
        }

        // Get staff availability for the date
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;
        
        // Get existing appointments
        const appointments = await SquareBookingService.getStaffAppointments(
            staffId,
            startOfDay,
            endOfDay
        );

        // Get staff's default availability for this day of week
        const dayOfWeek = parseISO(date).getDay();
        
        // Get staff member to access their availability
        const staffMember = await SquareBookingService.getStaffById(staffId);
        
        if (!staffMember) {
            return NextResponse.json(
                { error: 'Staff member not found' },
                { status: 404 }
            );
        }
        
        // Find availability for this day of week
        const staffAvailability = staffMember.defaultAvailability.find(
            avail => avail.dayOfWeek === dayOfWeek
        );

        if (!staffAvailability) {
            return NextResponse.json({
                slots: [],
                isFullyBooked: false, 
                staffAvailable: false
            });
        }

        // Generate all possible time slots based on total duration
        const availableTimeSlots = [];
        const { startTime, endTime } = staffAvailability;
        
        const dayStart = parseISO(`${date}T${startTime}`);
        const dayEnd = parseISO(`${date}T${endTime}`);

        // Create 15-minute intervals
        const intervals = eachMinuteOfInterval(
            { start: dayStart, end: dayEnd },
            { step: 15 }
        );

        let hasConflicts = false;

        for (const slotStart of intervals) {
            const slotEnd = addMinutes(slotStart, totalDuration);
            
            // Check if slot ends before closing time
            if (slotEnd > dayEnd) continue;

            // Check if slot conflicts with any appointments
            const hasConflict = appointments.some(apt => {
                const aptStart = new Date(apt.startTime);
                const aptEnd = new Date(apt.endTime);
                return (
                    // Check if our slot starts during another appointment
                    (slotStart >= aptStart && slotStart < aptEnd) ||
                    // Check if our slot ends during another appointment
                    (slotEnd > aptStart && slotEnd <= aptEnd) ||
                    // Check if our slot completely encompasses another appointment
                    (slotStart <= aptStart && slotEnd >= aptEnd)
                );
            });

            // For Square, we'll directly check if the slot is available
            // instead of checking blocked times separately
            const isAvailable = await SquareBookingService.checkTimeSlotAvailability(
                staffId,
                format(slotStart, "yyyy-MM-dd'T'HH:mm:ss"),
                format(slotEnd, "yyyy-MM-dd'T'HH:mm:ss")
            );

            if (hasConflict) hasConflicts = true;

            if (!hasConflict && isAvailable) {
                availableTimeSlots.push({
                    startTime: format(slotStart, "yyyy-MM-dd'T'HH:mm:ss"),
                    endTime: format(addMinutes(slotStart, totalDuration), "yyyy-MM-dd'T'HH:mm:ss"),
                    available: true,
                });
            }
        }

        return NextResponse.json({
            slots: availableTimeSlots,
            isFullyBooked: hasConflicts && availableTimeSlots.length === 0,
            staffAvailable: true
        });
    } catch (error) {
        console.error('Error in availability endpoint:', error);
        return NextResponse.json(
            { error: 'Failed to get availability' },
            { status: 500 }
        );
    }
}
