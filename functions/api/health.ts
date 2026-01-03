import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono().basePath('/api/health');

app.get('/', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export const onRequest = handle(app);
