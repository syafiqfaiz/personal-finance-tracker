import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { authMiddleware } from '../../core/middleware';
import { License, LicenseRepository } from '../../core/licenseRepository';
import { GoogleGenerativeAI } from '@google/generative-ai';

type Bindings = {
    LICENSE_STORE: KVNamespace;
    VITE_GEMINI_API_KEY: string;
};

type Variables = {
    license: License;
};

import { corsMiddleware } from '../../core/corsMiddleware';
import { securityMiddleware } from '../../core/securityMiddleware';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api/ai/extract');

app.use('*', corsMiddleware);
app.use('*', securityMiddleware);
app.use('*', securityMiddleware);
app.use('*', authMiddleware);

app.post('/', async (c) => {
    const license = c.get('license');
    const repo = new LicenseRepository(c.env.LICENSE_STORE);

    // Check Rate Limit
    const usageCheck = await repo.incrementAIUsage(license.id);

    if (!usageCheck.allowed) {
        return c.json({
            error: 'Rate limit exceeded',
            remaining: 0,
            reset: GetNextMonthStart()
        }, 429);
    }

    // Parse Body
    let body;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'Invalid JSON body' }, 400);
    }

    if (!body || !body.text) {
        return c.json({ error: 'Missing "text" field' }, 400);
    }

    if (body.text.length > 10000) {
        return c.json({ error: 'Text too long (max 10000 chars)' }, 400);
    }

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(c.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(body.text);
    const response = result.response;
    const text = response.text();

    // Parse JSON (Optimistic parsing, assuming Gemini follows instruction)
    // Real-world: Should use JSON Mode or strict parsing.
    let data;
    try {
        // Clean markdown code blocks if present
        const cleaned = text.replace(/```json\n?|\n?```/g, '');
        data = JSON.parse(cleaned);
    } catch {
        data = { expenses: [], raw: text };
    }

    return c.json({
        data,
        usage: {
            remaining: usageCheck.remaining
        }
    });
});

function GetNextMonthStart() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

export const onRequest = handle(app);
