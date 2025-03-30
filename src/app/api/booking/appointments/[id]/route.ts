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

    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment details' },
      { status: 500 }
    );
  }
}
