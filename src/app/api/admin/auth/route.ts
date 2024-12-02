import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { AdminService } from '@/lib/services/adminService';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        const result = await AdminService.verifyAdmin(email, password);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 401 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const admin = await AdminService.verifyToken(token);
        
        return NextResponse.json({ admin });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 401 }
        );
    }
}
