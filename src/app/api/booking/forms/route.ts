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

        const forms = await BookingService.getServiceForms(serviceId);
        return NextResponse.json(forms);
    } catch (error: any) {
        console.error('Error fetching forms:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch forms' },
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
        const form = await BookingService.createConsentForm(data);
        return NextResponse.json(form);
    } catch (error: any) {
        console.error('Error creating form:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create form' },
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
            await AdminService.verifyToken(token);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid admin token' },
                { status: 401 }
            );
        }

        const data = await request.json();
        const { id, ...updateData } = data;
        
        if (!id) {
            return NextResponse.json(
                { error: 'Form ID is required' },
                { status: 400 }
            );
        }

        const form = await BookingService.updateConsentForm(id, updateData);
        return NextResponse.json(form);
    } catch (error: any) {
        console.error('Error updating form:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update form' },
            { status: 500 }
        );
    }
}
