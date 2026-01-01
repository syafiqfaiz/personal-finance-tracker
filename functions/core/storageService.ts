import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class StorageService {
    constructor(private s3Client: PutObjectCommand | GetObjectCommand | unknown, private bucket: string) { }

    async generateUploadUrl(userId: string, filename: string, contentType: string): Promise<{ url: string; key: string }> {
        // Validate Filename (Prevent Path Traversal)
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            throw new Error('Invalid filename');
        }

        // Validate File Type (Allow images and simple docs)
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(contentType)) {
            throw new Error('Invalid file type');
        }

        const key = `user_storage/${userId}/receipts/${new Date().getFullYear()}/${new Date().toISOString().slice(0, 7)}/${filename}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType
        });

        const url = await getSignedUrl(this.s3Client, command, { expiresIn: 300 }); // 5 minutes
        return { url, key };
    }

    async generateViewUrl(userId: string, key: string): Promise<string> {
        // Strict Path Validation: Ensure Key starts with user's prefix
        const expectedPrefix = `user_storage/${userId}/`;
        if (!key.startsWith(expectedPrefix)) {
            throw new Error('Access denied');
        }

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key
        });

        return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
    }
}
