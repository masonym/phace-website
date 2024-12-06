import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/services/bookingService';
import { parseISO, addMinutes } from 'date-fns';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const {
            serviceId,
            staffId,
            startTime,
            clientName,
            clientEmail,
            clientPhone,
            addons = [],
            consentFormResponses,
            notes,
            userId,
        } = data;

        // Validate required fields
        if (!serviceId || !staffId || !startTime || !clientName || !clientEmail || !clientPhone) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get service details
        const service = await BookingService.getServiceById(serviceId);
        if (!service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        // Calculate total duration including addons
        let totalDuration = service.duration;
        let totalPrice = service.price;

        if (addons.length > 0) {
            const addonDetails = await BookingService.getAddonsByIds(addons);
            const validAddons = addonDetails.filter(addon => addon != null);
            for (const addon of validAddons) {
                totalDuration += addon.duration;
                totalPrice += addon.price;
            }
        }

        // Calculate end time
        const startDate = parseISO(startTime);
        const endTime = addMinutes(startDate, totalDuration);

        // Check if the time slot is still available
        const isAvailable = await BookingService.checkTimeSlotAvailability(
            staffId,
            startTime,
            endTime.toISOString()
        );

        if (!isAvailable) {
            return NextResponse.json(
                { error: 'Selected time slot is no longer available' },
                { status: 409 }
            );
        }

        // Create the appointment
        const appointment = await BookingService.createAppointment({
            clientEmail,
            clientName,
            clientPhone,
            staffId,
            serviceId,
            addons,
            startTime,
            endTime: endTime.toISOString(),
            totalPrice,
            totalDuration,
            consentFormResponses,
            notes,
            userId,
        });

        // Send confirmation email
        await BookingService.sendAppointmentConfirmation({
            appointmentId: appointment.id,
            clientEmail,
            clientName,
            serviceName: service.name,
            startTime,
            endTime: endTime.toISOString(),
            staffName: (await BookingService.getStaffById(staffId))?.name || '',
        });

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
        const clientEmail = searchParams.get('clientEmail');
        const staffId = searchParams.get('staffId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (clientEmail) {
            const appointments = await BookingService.getClientAppointments(clientEmail);
            return NextResponse.json(appointments);
        }

        if (staffId && startDate && endDate) {
            const appointments = await BookingService.getStaffAppointments(
                staffId,
                startDate,
                endDate
            );
            return NextResponse.json(appointments);
        }

        return NextResponse.json(
            { error: 'Invalid query parameters' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Error fetching appointments:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch appointments' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json();
        const { appointmentId, status } = data;

        if (!appointmentId || !status) {
            return NextResponse.json(
                { error: 'Appointment ID and status are required' },
                { status: 400 }
            );
        }

        const appointment = await BookingService.updateAppointmentStatus(appointmentId, status);
        return NextResponse.json(appointment);
    } catch (error: any) {
        console.error('Error updating appointment:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update appointment' },
            { status: 500 }
        );
    }
}
