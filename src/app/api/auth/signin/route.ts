import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await AuthService.signIn(email, password);
        
        // Return the authentication tokens
        return NextResponse.json({
            accessToken: result.AuthenticationResult?.AccessToken,
            refreshToken: result.AuthenticationResult?.RefreshToken,
            idToken: result.AuthenticationResult?.IdToken,
        });
    } catch (error: any) {
        console.error('Signin error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to sign in' },
            { status: 500 }
        );
    }
}
