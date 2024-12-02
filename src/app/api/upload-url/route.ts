import { NextResponse } from 'next/server';
import { S3Service } from '@/lib/services/s3Service';

export async function POST(request: Request) {
    try {
        const { fileName, contentType } = await request.json();

        const uploadUrl = await S3Service.getUploadUrl(fileName, contentType);

        return NextResponse.json({ uploadUrl });
    } catch (error: any) {
        console.error('Get upload URL error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get upload URL' },
            { status: 500 }
        );
    }
}
