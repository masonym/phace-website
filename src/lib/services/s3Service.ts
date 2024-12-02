import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ 
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'phace-product-images';

export class S3Service {
    static async getUploadUrl(key: string, contentType: string) {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS credentials not configured');
        }

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
            CacheControl: 'max-age=31536000'
        });

        try {
            const url = await getSignedUrl(s3Client, command, { 
                expiresIn: 3600,
                signableHeaders: new Set(['host', 'content-type'])
            });
            return url;
        } catch (error) {
            console.error('Error generating presigned URL:', error);
            throw new Error('Failed to generate upload URL');
        }
    }

    static getImageUrl(key: string) {
        return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-west-2'}.amazonaws.com/${key}`;
    }

    static async deleteImage(key: string) {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS credentials not configured');
        }

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        try {
            await s3Client.send(command);
        } catch (error) {
            console.error('Error deleting image:', error);
            throw new Error('Failed to delete image');
        }
    }
}
