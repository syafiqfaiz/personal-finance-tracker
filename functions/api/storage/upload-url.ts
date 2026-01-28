import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authMiddleware } from '../../core/middleware';
import { corsMiddleware } from '../../core/corsMiddleware';
import { securityMiddleware } from '../../core/securityMiddleware';
import { License } from '../../core/licenseRepository';

type Bindings = {
    LICENSE_STORE: KVNamespace;
    ASSETS_BUCKET: R2Bucket;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
    R2_ENDPOINT_URL: string;
};

type Variables = {
    license: License;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
    .basePath('/api/storage/upload-url');

app.use('*', corsMiddleware);
app.use('*', securityMiddleware);
app.use('*', authMiddleware);

app.post('/', async (c) => {
    const license = c.get('license');

    // Parse Body
    let body: { filename: string; contentType: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'Invalid JSON body' }, 400);
    }

    if (!body.filename || !body.contentType) {
        return c.json({ error: 'Missing filename or contentType' }, 400);
    }

    // Generate specific key path
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    // Sanitize filename to prevent directory traversal or weird characters
    const sanitizedFilename = body.filename.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Format: user_storage/{userId}/receipts/{year}/{month}/{filename}
    const key = `user_storage/${license.id}/receipts/${year}/${month}/${Date.now()}-${sanitizedFilename}`;

    // Use AWS SDK to generate presigned URL
    const s3Client = new S3Client({
        region: 'auto',
        endpoint: c.env.R2_ENDPOINT_URL,
        credentials: {
            accessKeyId: c.env.R2_ACCESS_KEY_ID,
            secretAccessKey: c.env.R2_SECRET_ACCESS_KEY
        }
    });

    const command = new PutObjectCommand({
        Bucket: c.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: body.contentType
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return c.json({ url, key });
    } catch (error) {
        console.error('Failed to generate presigned URL:', error);
        return c.json({ error: 'Failed to generate upload URL' }, 500);
    }
});

export const onRequest = handle(app);
