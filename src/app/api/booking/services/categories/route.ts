import { NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/adminService';
import { BookingService } from '@/lib/services/bookingService';

export async function DELETE(request: Request) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    try {
      await AdminService.verifyToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    await BookingService.deleteServiceCategory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
