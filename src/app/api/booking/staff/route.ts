import { NextResponse } from 'next/server';
import { SquareBookingService } from "@/lib/services/squareBookingService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Get all staff members from Square
    const staffMembers = await SquareBookingService.getStaffMembers(serviceId);

    // Filter staff by service if serviceId is provided
    let filteredStaff = staffMembers;
    if (serviceId) {
      // Since we don't have a direct service-to-staff mapping in Square,
      // we'll just return all active staff for now
      filteredStaff = staffMembers.filter(staff => staff.isActive);
    }

    // Use a custom replacer function to handle BigInt values
    const safeJson = JSON.stringify(filteredStaff, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    });

    return new NextResponse(safeJson, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching staff:', error);

    const errorResponse = {
      error: error instanceof Error ? error.message : 'Failed to fetch staff'
    };

    return new NextResponse(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
