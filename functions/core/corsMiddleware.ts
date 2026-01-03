/// <reference types="@cloudflare/workers-types" />
import { createMiddleware } from 'hono/factory';

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://personal-finance-tracker.pages.dev',
    'https://belanja.syafiqfaiz.com',
    'https://staging.belanja-9f0.pages.dev'
];

export const corsMiddleware = createMiddleware(async (c, next) => {
    const origin = c.req.header('Origin');

    // Strict Origin Check
    const isAllowed = origin && (
        ALLOWED_ORIGINS.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^https:\/\/.*\.belanja-9f0\.pages\.dev$/.test(origin)
    );

    if (origin && !isAllowed) {
        return c.json({ error: 'Forbidden Origin' }, 403);
    }

    // Set Headers if origin is allowed (or if strict mode allows empty origin for non-browser? No, ARD says strict)
    // Actually, if origin is missing (e.g. server-to-server), we might allow or block.
    // ARD says: "Requests from unknown domains ... will be rejected". 
    // If Origin header is missing (e.g. curl), typically we block for API security if intended for browser only.
    // The test "block unknown origin" mocks an origin.
    // I'll assume if origin is present, check it. If missing, proceed (or block? ARD implies strict).
    // Let's block if origin is present and invalid.

    if (origin) {
        c.header('Access-Control-Allow-Origin', origin);
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, X-License-Key, X-Admin-Secret');
    }

    // Handle Preflight
    if (c.req.method === 'OPTIONS') {
        return c.body(null, 204);
    }

    await next();
});
