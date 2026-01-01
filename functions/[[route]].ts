import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import * as Sentry from '@sentry/cloudflare';

type Bindings = {
    LICENSE_STORE: KVNamespace;
    SENTRY_DSN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.onError((err, c) => {
    if (c.env.SENTRY_DSN) {
        const sentry = new Sentry.Sentry({ dsn: c.env.SENTRY_DSN });
        sentry.captureException(err);
    }
    console.error(err);
    return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

app.get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export const onRequest = handle(app);
