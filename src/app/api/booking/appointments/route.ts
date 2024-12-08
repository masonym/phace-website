import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/services/bookingService';
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
            staffId,
            startTime,
            clientName,
            clientEmail,
            clientPhone,
            addons = [],
            consentFormResponses = [],
            notes,
        } = data;

        console.log('Raw request data:', data);
        console.log('Extracted consent form responses:', consentFormResponses);
        console.log('Received appointment data:', {
            ...data,
            consentFormResponses: JSON.stringify(consentFormResponses, null, 2)
        });

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
        let totalPrice = parseInt(service.price, 10);

        if (addons.length > 0) {
            const addonDetails = await BookingService.getAddonsByIds(addons);
            const validAddons = addonDetails.filter(addon => addon != null);
            for (const addon of validAddons) {
                totalDuration += addon.duration;
                totalPrice += parseInt(addon.price);
            }
        }

        // Calculate end time and round up to nearest 15 minutes
        const startDate = parseISO(startTime);
        const rawEndTime = addMinutes(startDate, totalDuration);
        
        // Round up to nearest 15 minutes
        const minutes = rawEndTime.getMinutes();
        const roundUpTo = Math.ceil(minutes / 15) * 15;
        const endTime = addMinutes(
            new Date(
                rawEndTime.getFullYear(),
                rawEndTime.getMonth(),
                rawEndTime.getDate(),
                rawEndTime.getHours(),
                roundUpTo
            ),
            roundUpTo === 60 ? 0 : 0 // If we rounded to 60, the hour will auto-increment
        );

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
            userId,  // Include userId if user is logged in
        });

        console.log('Created appointment with responses:', {
            appointmentId: appointment.id,
            consentFormResponses: JSON.stringify(appointment.consentFormResponses, null, 2)
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
