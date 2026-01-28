/// <reference types="@cloudflare/workers-types" />
import { createMiddleware } from 'hono/factory';
import { LicenseRepository, License } from './licenseRepository';

type Bindings = {
    LICENSE_STORE: KVNamespace;
};

type Variables = {
    license: License;
};

export const authMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(async (c, next) => {
    const apiKey = c.req.header('X-License-Key');

    // Debug logging
    if (!apiKey) {
        return c.json({ error: 'Missing License Key' }, 401);
    }

    const repo = new LicenseRepository(c.env.LICENSE_STORE);
    const license = await repo.get(apiKey);

    if (!license || license.status !== 'active') {
        return c.json({ error: 'Invalid License Key' }, 403);
    }

    c.set('license', license);
    await next();
});
