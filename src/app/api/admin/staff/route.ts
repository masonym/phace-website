import { NextResponse } from 'next/server';
import { SquareBookingService } from '@/lib/services/squareBookingService';

export async function GET() {
  try {
    // For now, we'll get all staff members. In the future, we might want to add pagination
    const staffMembers = await SquareBookingService.getAllStaffMembers();
    return NextResponse.json(staffMembers);
  } catch (error: any) {
    console.error('Error fetching staff members:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch staff members' },
      { status: 500 }
    );
  }
}
