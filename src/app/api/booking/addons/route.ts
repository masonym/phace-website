import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/services/bookingService';
import { AdminService } from '@/lib/services/adminService';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const serviceId = searchParams.get('serviceId');

        if (!serviceId) {
            return NextResponse.json(
                { error: 'Service ID is required' },
                { status: 400 }
            );
        }

        const addons = await BookingService.getServiceAddons(serviceId);
        return NextResponse.json(addons);
    } catch (error: any) {
        console.error('Error fetching addons:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch addons' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
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
            return NextResponse.json(
                { error: 'Invalid admin token' },
                { status: 401 }
            );
        }

        const data = await request.json();
        const addon = await BookingService.createServiceAddon(data);
        return NextResponse.json(addon);
    } catch (error: any) {
        console.error('Error creating addon:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create addon' },
            { status: 500 }
        );
    }
}
