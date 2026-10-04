import { NextRequest, NextResponse } from 'next/server';
import { SquareBookingService } from "@/lib/services/squareBookingService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await SquareBookingService.getAppointmentById(params.id);

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // This route is public (anyone with the booking ID), so only return what the
    // confirmation page shows -- never notes or consent form answers
    return NextResponse.json({
      id: appointment.id,
      serviceNames: appointment.serviceNames,
      staffName: appointment.staffName,
      startTime: appointment.startTime,
      totalDuration: appointment.totalDuration,
      totalPrice: appointment.totalPrice,
      status: appointment.status,
    });
  } catch (error: any) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment details' },
      { status: 500 }
    );
  }
}
