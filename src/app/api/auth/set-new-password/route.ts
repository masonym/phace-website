import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';

export async function POST(request: Request) {
    try {
        const { email, newPassword, session } = await request.json();
        
        if (!email || !newPassword || !session) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await AuthService.setNewPassword(email, newPassword, session);
        
        if (!result.AuthenticationResult?.IdToken || !result.AuthenticationResult?.AccessToken) {
            throw new Error('No token received from authentication');
        }

        return NextResponse.json({
            idToken: result.AuthenticationResult.IdToken,
            accessToken: result.AuthenticationResult.AccessToken
        });
    } catch (error: any) {
        console.error('Set new password error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to set new password' },
            { status: 500 }
        );
    }
}
