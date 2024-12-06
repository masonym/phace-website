import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/services/bookingService';
import { AdminService } from '@/lib/services/adminService';

export async function GET() {
    try {
        const categories = await BookingService.getServiceCategories();
        
        // For each category, get its services
        const categoriesWithServices = await Promise.all(
            categories.map(async (category) => {
                const services = await BookingService.getServicesByCategory(category.id);
                return {
                    ...category,
                    services,
                };
            })
        );

        return NextResponse.json(categoriesWithServices);
    } catch (error: any) {
        console.error('Error fetching services:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch services' },
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
        const { type, ...serviceData } = data;

        if (type === 'category') {
            const category = await BookingService.createServiceCategory(serviceData);
            return NextResponse.json(category);
        } else if (type === 'service') {
            const service = await BookingService.createService(serviceData);
            return NextResponse.json(service);
        } else {
            return NextResponse.json(
                { error: 'Invalid type. Must be either "category" or "service"' },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('Error creating service:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create service' },
            { status: 500 }
        );
    }
}
