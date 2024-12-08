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
        
        if (!result.AuthenticationResult?.IdToken) {
            throw new Error('No token received from authentication');
        }

        // Return just the ID token as our main auth token
        return NextResponse.json({
            token: result.AuthenticationResult.IdToken
        });
    } catch (error: any) {
        console.error('Signin error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to sign in' },
            { status: 500 }
        );
    }
}
