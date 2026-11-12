import { NextResponse } from 'next/server';
import { S3Service } from '@/lib/services/s3Service';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function POST(request: Request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { fileName, contentType } = await request.json();

        const uploadUrl = await S3Service.getUploadUrl(fileName, contentType);

        // The bucket is public-read, so this is where the file can be viewed once the upload finishes
        return NextResponse.json({ uploadUrl, imageUrl: S3Service.getImageUrl(fileName) });
    } catch (error: any) {
        console.error('Get upload URL error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get upload URL' },
            { status: 500 }
        );
    }
}
