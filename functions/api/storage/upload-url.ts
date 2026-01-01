import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { authMiddleware } from '../../core/middleware';
import { StorageService } from '../../core/storageService';
import { S3Client } from '@aws-sdk/client-s3';
import { corsMiddleware } from '../../core/corsMiddleware';
import { securityMiddleware } from '../../core/securityMiddleware';
import { License } from '../../core/licenseRepository';

type Bindings = {
    LICENSE_STORE: KVNamespace;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_BUCKET_NAME: string;
    AWS_REGION: string;
};

type Variables = {
    license: License;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api/storage/upload-url');

app.use('*', corsMiddleware);
app.use('*', securityMiddleware);
app.use('*', authMiddleware);

app.post('/', async (c) => {
    const license = c.get('license');
    const body = await c.req.json().catch(() => null);

    if (!body || !body.filename || !body.contentType) {
        return c.json({ error: 'Missing filename or contentType' }, 400);
    }

    const s3Client = new S3Client({
        region: c.env.AWS_REGION,
        credentials: {
            accessKeyId: c.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: c.env.AWS_SECRET_ACCESS_KEY
        }
    });

    const storage = new StorageService(s3Client, c.env.AWS_BUCKET_NAME);

    try {
        const result = await storage.generateUploadUrl(license.id, body.filename, body.contentType);
        return c.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return c.json({ error: message }, 400);
    }
});

export const onRequest = handle(app);
