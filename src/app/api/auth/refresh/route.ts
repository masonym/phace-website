import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';

// Exchanges a Cognito refresh token for new ID/access tokens (ID tokens expire after an hour)
export async function POST(request: Request) {
    try {
        const { refreshToken } = await request.json();
        if (!refreshToken || typeof refreshToken !== 'string') {
            return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
        }

        const result = await AuthService.refreshSession(refreshToken);
        if (!result.AuthenticationResult?.IdToken || !result.AuthenticationResult?.AccessToken) {
            return NextResponse.json({ error: 'Session expired' }, { status: 401 });
        }

        return NextResponse.json({
            idToken: result.AuthenticationResult.IdToken,
            accessToken: result.AuthenticationResult.AccessToken,
        });
    } catch (error: any) {
        console.error('Token refresh error:', error?.name || error);
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
}
