import { NextResponse } from 'next/server';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AdminService } from '@/lib/services/adminService';

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    tokenUse: 'id',
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
});

/**
 * Drop-in replacement for a CognitoJwtVerifier in admin routes: verifies the token
 * and also requires the email to be in the admin table.
 */
export const adminVerifier = {
    async verify(token: string) {
        const payload = await verifier.verify(token);
        const admin = await AdminService.getAdmin(payload.email as string);
        if (!admin) {
            throw new Error('Not an admin user');
        }
        return payload;
    },
};

function getToken(request: Request): string | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice('Bearer '.length).trim() || null;
    }

    // Admin pages that don't send a header still carry the adminToken cookie
    const cookieHeader = request.headers.get('cookie') ?? '';
    const match = cookieHeader.match(/(?:^|;\s*)adminToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Returns a 401/403 response if the request isn't from an admin, otherwise null.
 * Customers share the same Cognito pool, so a valid token alone isn't enough --
 * the email must also exist in the admin table.
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
    const token = getToken(request);
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    try {
        const payload = await verifier.verify(token);
        const admin = await AdminService.getAdmin(payload.email as string);
        if (!admin) {
            return NextResponse.json({ error: 'Not an admin user' }, { status: 403 });
        }
        return null;
    } catch (error) {
        console.error('Admin token verification failed:', error);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
}
