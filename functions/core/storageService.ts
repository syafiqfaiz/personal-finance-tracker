import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class StorageService {
    constructor(private s3Client: S3Client, private bucket: string) { }



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
