/// <reference types="@cloudflare/workers-types" />
import { describe, it, expect, vi } from 'vitest';
import { onRequest as onDocsRequest } from './docs';
import { onRequest as onOpenApiRequest } from './openapi.json';

describe('Docs Endpoints', () => {
    const env = {};

    const createMockContext = (req: Request) => ({
        request: req,
        env,
        next: vi.fn(),
        functionPath: '',
        waitUntil: vi.fn(),
        passThroughOnException: vi.fn(),
        params: {},
        data: {}
    } as any);

    it('GET /api/docs should return HTML', async () => {
        const req = new Request('http://localhost/api/docs');
        const ctx = createMockContext(req);
        const res = await onDocsRequest(ctx);
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('text/html');
        const text = await res.text();
        expect(text).toContain('SwaggerUIBundle');
    });

    it('GET /api/openapi.json should return JSON spec', async () => {
        const req = new Request('http://localhost/api/openapi.json');
        const ctx = createMockContext(req);
        const res = await onOpenApiRequest(ctx);
        expect(res.status).toBe(200);
        const json = await res.json() as any;
        expect(json.openapi).toBe('3.0.0');
        expect(json.paths['/api/ai/extract']).toBeDefined();
    });
});
