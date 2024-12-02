import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();
        
        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await AuthService.signUp(email, password, name);
        return NextResponse.json({ 
            message: 'User registered successfully',
            userSub: result.UserSub
        });
    } catch (error: any) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to register user' },
            { status: 500 }
        );
    }
}
