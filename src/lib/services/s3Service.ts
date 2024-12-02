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
            ACL: 'public-read', // Make the uploaded file publicly readable
            CacheControl: 'max-age=31536000'
        });

        try {
            const url = await getSignedUrl(s3Client, command, { 
                expiresIn: 3600,
            });
            return url;
        } catch (error) {
            console.error('Error generating presigned URL:', error);
            throw new Error('Failed to generate upload URL');
        }
    }

    static async deleteImage(key: string) {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS credentials not configured');
        }

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        try {
            return await s3Client.send(command);
        } catch (error) {
            console.error('Error deleting image:', error);
            throw new Error('Failed to delete image');
        }
    }

    static getImageUrl(key: string) {
        if (!key) {
            throw new Error('Image key is required');
        }
        // Use the same region as the S3 client
        return `https://${BUCKET_NAME}.s3.${s3Client.config.region}.amazonaws.com/${key}`;
    }
}
