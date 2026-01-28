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
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
    R2_ENDPOINT_URL: string;
};

type Variables = {
    license: License;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api/storage/view-url');

app.use('*', corsMiddleware);
app.use('*', securityMiddleware);
app.use('*', authMiddleware);

app.get('/', async (c) => {
    const license = c.get('license');
    const key = c.req.query('key');

    if (!key) {
        return c.json({ error: 'Missing key parameter' }, 400);
    }

    const s3Client = new S3Client({
        region: 'auto',
        endpoint: c.env.R2_ENDPOINT_URL,
        credentials: {
            accessKeyId: c.env.R2_ACCESS_KEY_ID,
            secretAccessKey: c.env.R2_SECRET_ACCESS_KEY
        }
    });

    const storage = new StorageService(s3Client, c.env.R2_BUCKET_NAME);

    try {
        const url = await storage.generateViewUrl(license.id, key);
        return c.json({ url });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return c.json({ error: message }, 403);
    }
});

export const onRequest = handle(app);
