import { NextResponse } from 'next/server';
import { BookingService } from '@/lib/services/bookingService';
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Create a verifier that expects valid ID tokens
const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    tokenUse: "id",
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';
        
        const categories = await BookingService.getServiceCategories();
        
        // For each category, get its services
        const categoriesWithServices = await Promise.all(
            categories.map(async (category) => {
                const services = await BookingService.getServicesByCategory(category.id);
                return {
                    ...category,
                    // Filter out inactive services unless explicitly requested
                    services: services.filter(service => includeInactive || service.isActive),
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

export async function PUT(request: Request) {
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
            await verifier.verify(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid admin token' },
                { status: 401 }
            );
        }

        const data = await request.json();
        const { type, id, ...serviceData } = data;

        if (type === 'service' && id) {
            const service = await BookingService.updateService(id, serviceData);
            return NextResponse.json(service);
        } else {
            return NextResponse.json(
                { error: 'Invalid request. Service ID is required for updates.' },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('Error updating service:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update service' },
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
            await verifier.verify(token);
        } catch (error) {
            console.error('Token verification failed:', error);
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
            await verifier.verify(token);
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
                { error: 'Service ID is required' },
                { status: 400 }
            );
        }

        await BookingService.deleteService(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting service:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete service' },
            { status: 500 }
        );
    }
}
