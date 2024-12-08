import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';

export async function POST(request: Request) {
    try {
        const { email, code, newPassword } = await request.json();
        
        if (!email || !code || !newPassword) {
            return NextResponse.json(
                { error: 'Email, code, and new password are required' },
                { status: 400 }
            );
        }

        await AuthService.confirmForgotPassword(email, code, newPassword);
        
        return NextResponse.json({ message: 'Password reset successfully' });
    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reset password' },
            { status: 500 }
        );
    }
}
