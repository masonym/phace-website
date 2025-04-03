import { NextResponse } from 'next/server';
import { SquareBookingService } from "@/lib/services/squareBookingService";
import { parseISO, addMinutes } from 'date-fns';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Get user ID from auth token if available
        let userId = null;
        const cookieStore = cookies();
        const token = cookieStore.get('token');
        if (token) {
            try {
                const decoded = jwtDecode(token.value);
                userId = decoded.sub;
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }

        const {
            serviceId,
            serviceName,
            variationId,
            variationName,
            variationVersion,
            staffId,
            staffName,
            startTime,
            clientName,
            clientEmail,
            clientPhone,
            notes,
            addons = [],
            consentFormResponses = [],
            paymentNonce,
        } = data;

        console.log('Raw request data:', data);
        console.log('Extracted consent form responses:', consentFormResponses);
        console.log('Received appointment data:', {
            ...data,
            consentFormResponses: JSON.stringify(consentFormResponses, null, 2)
        });

        // Validate required fields
        if (!variationId && !serviceId) {
            return NextResponse.json(
                { error: 'Service ID or Variation ID is required' },
                { status: 400 }
            );
        }

        if (!staffId) {
            return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
        }

        if (!startTime) {
            return NextResponse.json({ error: 'Start time is required' }, { status: 400 });
        }

        if (!clientName || !clientEmail) {
            return NextResponse.json(
                { error: 'Client name and email are required' },
                { status: 400 }
            );
        }

        // Use the variation ID if provided, otherwise use the service ID
        const idToUse = variationId || serviceId;
        const nameToUse = variationName ? `${serviceName} - ${variationName}` : serviceName;

        // Get service details
        const service = await SquareBookingService.getServiceById(idToUse);
        if (!service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        // Calculate total duration including addons
        let totalDuration = parseInt(service.duration.toString(), 10) / 60000; // convert ms to minutes
        let totalPrice = parseInt(service.price.toString(), 10);

        if (addons.length > 0) {
            const addonDetails = await SquareBookingService.getAddonsByIds(addons);
            const validAddons = addonDetails.filter(addon => addon != null);
            for (const addon of validAddons) {
                totalDuration += parseInt(addon.duration.toString(), 10) / 60000;
                totalPrice += parseInt(addon.price.toString(), 10);
            }
        }

        // Calculate end time
        const startDate = parseISO(startTime);
        const endTime = addMinutes(startDate, totalDuration);
        // Round UP endTime to the nearest hour if under 1 hour
        if (totalDuration < 60) {
            endTime.setMinutes(0);
            endTime.setHours(endTime.getHours() + 1);
        }

        console.log('Appointment times:', {
            startTime,
            endTime: endTime.toISOString(),
            totalDuration
        });

        // Check if the time slot is still available
        const isAvailable = await SquareBookingService.checkTimeSlotAvailability(
            staffId,
            startTime,
            endTime.toISOString(),
            idToUse,
        );

        if (!isAvailable) {
            return NextResponse.json(
                { error: 'Selected time slot is no longer available' },
                { status: 409 }
            );
        }

        // Create the appointment in Square
        const appointment = await SquareBookingService.createAppointmentWithMultipleSegments({
            clientEmail,
            clientName,
            clientPhone,
            staffId,
            serviceId: idToUse,
            serviceName: nameToUse,
            variationVersion,
            variationId,
            addons,
            startTime,
            //endTime: endTime.toISOString(),
            totalPrice,
            totalDuration,
            consentFormResponses,
            notes,
            //userId,  // Include userId if user is logged in
        });

        console.log('Created appointment with responses:', {
            appointmentId: appointment.id,
            consentFormResponses: JSON.stringify(appointment.consentFormResponses, null, 2)
        });

        // No need to send confirmation email as Square will handle this
        // Square sends automatic confirmations based on the seller's settings

        return NextResponse.json(appointment);
    } catch (error: any) {
        console.error('Error creating appointment:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create appointment' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        let bookings;

        bookings = await SquareBookingService.listBookings(); // fetch all if no filters

        return NextResponse.json(SquareBookingService.safeStringify(bookings));
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch bookings' },
            { status: 500 }
        );
    }
}

//export async function PUT(request: Request) {
//    try {
//        const data = await request.json();
//        const { appointmentId, status } = data;
//
//        if (!appointmentId || !status) {
//            return NextResponse.json(
//                { error: 'Appointment ID and status are required' },
//                { status: 400 }
//            );
//        }
//
//        const appointment = await SquareBookingService.updateAppointmentStatus(appointmentId, status);
//        return NextResponse.json(appointment);
//    } catch (error: any) {
//        console.error('Error updating appointment:', error);
//        return NextResponse.json(
//            { error: error.message || 'Failed to update appointment' },
//            { status: 500 }
//        );
//    }
//}
