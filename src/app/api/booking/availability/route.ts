import { NextRequest, NextResponse } from 'next/server';
import { SquareBookingService } from "@/lib/services/squareBookingService";
import { parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const serviceId = searchParams.get('serviceId');
        const variationId = searchParams.get('variationId');
        const staffId = searchParams.get('staffId');
        const addons = searchParams.get('addons')?.split(',').filter(Boolean) || [];

        console.log(`Availability request for service: ${serviceId}, variation: ${variationId}, staff: ${staffId}, date: ${date}, addons: ${addons.join(',')}`);

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        // Check if the requested date is in the past
        const requestedDate = new Date(date);
        requestedDate.setHours(0, 0, 0, 0); // Set to beginning of day

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of today

        if (requestedDate < today) {
            console.log(`Requested date ${date} is in the past. Returning empty availability.`);
            return NextResponse.json({
                slots: [],
                isFullyBooked: true,
                staffAvailable: false,
                message: "Date is in the past"
            });
        }

        if (!serviceId && !variationId) {
            return NextResponse.json({ error: 'Service ID or Variation ID is required' }, { status: 400 });
        }

        if (!staffId) {
            return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
        }

        // Verify the staff member exists
        const staffMember = await SquareBookingService.getStaffById(staffId);
        if (!staffMember) {
            console.log(`Staff member not found: ${staffId}`);
            return NextResponse.json(
                { error: 'Staff member not found' },
                { status: 404 }
            );
        }

        console.log(`Staff member found: ${staffMember.name}`);

        // Get all available slots from Square for the requested date
        const idToUse = variationId || serviceId;

        // Verify that the service exists and is bookable
        const service = await SquareBookingService.getServiceById(idToUse!);
        if (!service) {
            console.log(`Service not found: ${idToUse}`);
            return NextResponse.json({
                slots: [],
                isFullyBooked: false,
                staffAvailable: true,
                message: "Service not found"
            });
        }

        console.log(`Service found: ${service.name}, using variation ID: ${variationId || service.variationId}`);

        // Get available time slots from Square
        const squareAvailability = await SquareBookingService.getAvailableTimeSlots({
            staffId,
            id: idToUse!,
            variationId: variationId!, // Pass the variationId explicitly if provided
            date,
            addonIds: addons.length > 0 ? addons : undefined
        });

        console.log(`Retrieved ${squareAvailability.length} available slots from Square`);

        // If no slots are available, return an appropriate response
        if (squareAvailability.length === 0) {
            console.log('No available slots returned from Square');
            return NextResponse.json({
                slots: [],
                isFullyBooked: true,
                staffAvailable: true
            });
        }

        // Return the available slots directly from Square
        return NextResponse.json({
            slots: squareAvailability,
            isFullyBooked: false,
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
