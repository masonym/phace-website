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

        console.log(`Availability request for service: ${serviceId}, staff: ${staffId}, date: ${date}, addons: ${addons.join(',')}`);

        if (!serviceId || !staffId || !date) {
            return NextResponse.json(
                { error: 'Service ID, Staff ID, and date are required' },
                { status: 400 }
            );
        }

        // Get service details to know duration
        const service = await SquareBookingService.getServiceById(serviceId);
        if (!service) {
            console.log(`Service not found: ${serviceId}`);
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        console.log(`Service found: ${service.name}, duration: ${service.duration}`);

        // Calculate total duration including addons
        let totalDuration = parseInt(service.duration.toString(), 10);
        // Convert from milliseconds to minutes
        totalDuration = Math.ceil(totalDuration / 60000);
        
        if (addons.length > 0) {
            const addonDetails = await SquareBookingService.getAddonsByIds(addons);
            for (const addon of addonDetails) {
                if (addon) {
                    // Convert addon duration from milliseconds to minutes
                    totalDuration += Math.ceil(parseInt(addon.duration.toString(), 10) / 60000);
                }
            }
        }

        console.log(`Total appointment duration: ${totalDuration} minutes`);

        // Get staff member to access their availability
        const staffMember = await SquareBookingService.getStaffById(staffId);
        
        if (!staffMember) {
            console.log(`Staff member not found: ${staffId}`);
            return NextResponse.json(
                { error: 'Staff member not found' },
                { status: 404 }
            );
        }
        
        console.log(`Staff member found: ${staffMember.name}`);

        // Get day of week for the requested date
        const dayOfWeek = parseISO(date).getDay();
        console.log(`Day of week for ${date}: ${dayOfWeek}`);
        
        // Find availability for this day of week in staff's default availability
        const staffAvailability = staffMember.defaultAvailability.find(
            avail => avail.dayOfWeek === dayOfWeek
        );

        if (!staffAvailability) {
            console.log(`No availability defined for day of week ${dayOfWeek}`);
            return NextResponse.json({
                slots: [],
                isFullyBooked: false, 
                staffAvailable: false
            });
        }

        console.log(`Staff availability for day ${dayOfWeek}: ${staffAvailability.startTime} - ${staffAvailability.endTime}`);

        // Format the date range for Square API (must be at least 24 hours)
        const startOfDay = `${date}T00:00:00`;
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 2); // Changed from +1 to +2
        const endOfDay = format(nextDay, "yyyy-MM-dd'T'23:59:59"); // Changed from '00:00:00' to '23:59:59'

        // Get all available slots from Square for the entire day
        const squareAvailability = await SquareBookingService.getAvailableTimeSlots({
            staffId,
            serviceId,
            date,
            addonIds: addons.length > 0 ? addons : undefined
        });

        console.log(`Retrieved ${squareAvailability.length} available slots from Square`);

        if (squareAvailability.length === 0) {
            console.log('No available slots returned from Square');
            return NextResponse.json({
                slots: [],
                isFullyBooked: true,
                staffAvailable: true
            });
        }

        // Filter the slots based on the staff's working hours
        const dayStart = parseISO(`${date}T${staffAvailability.startTime}`);
        const dayEnd = parseISO(`${date}T${staffAvailability.endTime}`);

        console.log(`Filtering slots between ${format(dayStart, "HH:mm")} and ${format(dayEnd, "HH:mm")}`);

        const filteredSlots = squareAvailability.filter(slot => {
            const slotStart = new Date(slot.startTime);
            const slotEnd = new Date(slot.endTime);
            
            // Check if the slot is within the staff's working hours
            return slotStart >= dayStart && slotEnd <= dayEnd;
        });

        console.log(`After filtering by working hours: ${filteredSlots.length} slots available`);

        return NextResponse.json({
            slots: filteredSlots,
            isFullyBooked: filteredSlots.length === 0,
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
