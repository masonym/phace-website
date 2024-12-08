import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();
        
        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        await AuthService.forgotPassword(email);
        
        return NextResponse.json({ message: 'Reset code sent successfully' });
    } catch (error: any) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send reset code' },
            { status: 500 }
        );
    }
}
