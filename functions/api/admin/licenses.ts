import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { LicenseRepository } from '../../core/licenseRepository';
import { corsMiddleware } from '../../core/corsMiddleware';
import { securityMiddleware } from '../../core/securityMiddleware';

const app = new Hono<{ Bindings: { ADMIN_SECRET: string; LICENSE_STORE: KVNamespace } }>().basePath('/api/admin/licenses');

app.use('*', corsMiddleware);
app.use('*', securityMiddleware);

// Admin Auth Middleware (Inline for simplicity as it's the only admin endpoint for now)
app.use('*', async (c, next) => {
    const secret = c.req.header('X-Admin-Secret');
    if (!secret) {
        return c.text('Unauthorized', 401);
    }
    if (secret !== c.env.ADMIN_SECRET) {
        return c.text('Forbidden', 403);
    }
    await next();
});

app.post('/', async (c) => {
    const body = await c.req.json().catch(() => ({})); // Optional body
    const tier = body.tier || 'pro';

    // Validate Tier
    if (!['basic', 'pro', 'enterprise'].includes(tier)) {
        return c.json({ error: 'Invalid tier' }, 400);
    }

    const repo = new LicenseRepository(c.env.LICENSE_STORE);
    const id = await repo.create(tier as 'basic' | 'pro' | 'enterprise');

    return c.json({ id, key: id }, 201); // Key is ID for now
});

export const onRequest = handle(app);
