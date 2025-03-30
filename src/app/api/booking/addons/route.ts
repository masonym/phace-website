import { NextResponse } from 'next/server';
import { SquareBookingService } from "@/lib/services/squareBookingService";
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

        // If serviceId is provided, get addons for that service
        // Otherwise, get all addons
        const addons = await SquareBookingService.getAllAddons();

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
        console.log('Auth header:', authHeader); // Debug log

        if (!authHeader) {
            return NextResponse.json(
                { error: 'Authorization header missing' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        try {
            await verifier.verify(token);
            console.log('Token verified successfully');
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid admin token' },
                { status: 401 }
            );
        }

        const data = await request.json();
        console.log('Request data:', data); // Debug log

        // Validate required fields
        if (!data.name || !data.description || !data.duration || !data.price || !data.serviceIds || data.serviceIds.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const addon = await SquareBookingService.createServiceAddon(data);
        return NextResponse.json(addon);
    } catch (error: any) {
        console.error('Error creating addon:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create addon' },
            { status: error.status || 500 }
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
        const { id, ...addonData } = data;

        if (!id) {
            return NextResponse.json(
                { error: 'Addon ID is required' },
                { status: 400 }
            );
        }

        // Validate required fields
        if (!addonData.name || !addonData.description || !addonData.duration || !addonData.price || !addonData.serviceIds || addonData.serviceIds.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const addon = await SquareBookingService.updateServiceAddon(id, addonData);
        return NextResponse.json(addon);
    } catch (error: any) {
        console.error('Error updating addon:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update addon' },
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
                { error: 'Addon ID is required' },
                { status: 400 }
            );
        }

        await SquareBookingService.deleteServiceAddon(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting addon:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete addon' },
            { status: 500 }
        );
    }
}
