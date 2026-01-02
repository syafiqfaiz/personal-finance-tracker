import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { LicenseRepository } from '../../../core/licenseRepository';
import { corsMiddleware } from '../../../core/corsMiddleware';
import { securityMiddleware } from '../../../core/securityMiddleware';

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

    const email = body.email;

    const repo = new LicenseRepository(c.env.LICENSE_STORE);
    const id = await repo.create(tier as 'basic' | 'pro' | 'enterprise', email);

    return c.json({ id, key: id }, 201); // Key is ID for now
});

app.get('/', async (c) => {
    const tier = c.req.query('tier');
    const email = c.req.query('email');

    const repo = new LicenseRepository(c.env.LICENSE_STORE);
    const licenses = await repo.list({ tier, email });

    return c.json({ data: licenses });
});

app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const repo = new LicenseRepository(c.env.LICENSE_STORE);
    const license = await repo.get(id);

    if (!license) {
        return c.json({ error: 'License not found' }, 404);
    }

    return c.json({ data: { ...license, key: license.id } });
});

app.put('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const repo = new LicenseRepository(c.env.LICENSE_STORE);

    try {
        await repo.update(id, body);
        const updated = await repo.get(id);
        return c.json({ data: { ...updated, key: updated?.id } });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ error: message }, 404);
    }
});

export const onRequest = handle(app);
