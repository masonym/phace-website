import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
        // Clone the request headers
        const headers = new Headers(request.headers);
        headers.set('Authorization', `Bearer ${token}`);
        
        // Verify token with the auth endpoint
        const res = await fetch(`${request.nextUrl.origin}/api/admin/auth`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            cache: 'no-store'
        })

        if (!res.ok) {
            // Clear the invalid token
            const response = NextResponse.redirect(new URL('/admin/login', request.url));
            response.cookies.delete('adminToken');
            return response;
        }

        // Add the verified token to subsequent requests
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('Authorization', `Bearer ${token}`);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    } catch (error) {
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
