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

        try {
            const result = await AuthService.signIn(email, password);
            
            if (!result.AuthenticationResult?.IdToken || !result.AuthenticationResult?.AccessToken) {
                throw new Error('No token received from authentication');
            }

            return NextResponse.json({
                idToken: result.AuthenticationResult.IdToken,
                accessToken: result.AuthenticationResult.AccessToken
            });
        } catch (error: any) {
            // Check if the error is due to unconfirmed user
            if (error.name === 'UserNotConfirmedException') {
                return NextResponse.json(
                    { 
                        needsConfirmation: true,
                        email,
                        message: 'Please verify your email before logging in'
                    },
                    { status: 401 }
                );
            }
            
            // Check if the user needs to set a new password (temporary password)
            if (error.name === 'NewPasswordRequired') {
                return NextResponse.json(
                    {
                        needsNewPassword: true,
                        email,
                        session: error.session,
                        message: error.message
                    },
                    { status: 200 }
                );
            }
            
            throw error;
        }
    } catch (error: any) {
        console.error('Signin error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to sign in' },
            { status: 500 }
        );
    }
}
