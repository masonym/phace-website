import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/services/bookingService';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const ids = searchParams.get('ids');

        if (!ids) {
            return NextResponse.json(
                { error: 'Add-on IDs are required' },
                { status: 400 }
            );
        }

        const addons = await BookingService.getAddonsByIds(ids.split(','));
        return NextResponse.json(addons);
    } catch (error: any) {
        console.error('Error fetching selected addons:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch selected addons' },
            { status: 500 }
        );
    }
}