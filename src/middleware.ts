import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Create a verifier that expects valid ID tokens
const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    tokenUse: "id",
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
});

export async function middleware(request: NextRequest) {
    // Only protect admin routes (except login)
    if (!request.nextUrl.pathname.startsWith('/admin') || 
        request.nextUrl.pathname === '/admin/login') {
        return NextResponse.next()
    }

    // Check for token in cookies
    const token = request.cookies.get('adminToken')?.value

    if (!token) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
        // Verify the token
        await verifier.verify(token);

        // Add the verified token to subsequent requests
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('Authorization', `Bearer ${token}`);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    } catch (error) {
        console.error('Token verification failed:', error);
        // If token is invalid, clear it and redirect to login
        const response = NextResponse.redirect(new URL('/admin/login', request.url));
        response.cookies.delete('adminToken');
        return response;
    }
}

// Configure which paths the middleware should run on
export const config = {
    matcher: '/admin/:path*'
}
