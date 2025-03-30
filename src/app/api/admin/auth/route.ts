import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { AdminService } from '@/lib/services/adminService';
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Create a verifier that expects valid ID tokens
const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    tokenUse: "id",
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
});

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        const admin = await AdminService.verifyAdmin(email, password);

        // Get the user's Cognito ID token from the request
        const authHeader = request.headers.get('Authorization');
        const idToken = authHeader?.replace('Bearer ', '') || '';

        // Verify the token is valid
        try {
            await verifier.verify(idToken);
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // If we get here, both the admin credentials and Cognito token are valid
        return NextResponse.json({
            token: idToken, // Use the Cognito token as the admin token
            admin
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 401 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');

        try {
            // Verify the Cognito token
            const payload = await verifier.verify(token);

            // Check if user exists in admin table
            const admin = await AdminService.getAdmin(payload.email as string);
            if (!admin) {
                return NextResponse.json({ error: 'Not an admin user' }, { status: 403 });
            }

            return NextResponse.json({
                admin: {
                    email: admin.email,
                    name: admin.name,
                    role: admin.role
                }
            });
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
    } catch (error: any) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 401 }
        );
    }
}
