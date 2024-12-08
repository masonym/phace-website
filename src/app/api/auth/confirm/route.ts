import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    await AuthService.confirmSignUp(email, code);

    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify email' },
      { status: 400 }
    );
  }
}
