/// <reference types="@cloudflare/workers-types" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { onRequest } from './extract';

// Mock KVNamespace
const kvMock = {
    get: vi.fn(),
    put: vi.fn(),
} as unknown as KVNamespace;

const activeLicense = {
    id: '123',
    status: 'active',
    limits: { ai_requests_per_month: 100 },
    usage: { billing_cycle: '2026-01', ai_requests_used: 10 }
};

// Hoist mocks to be available in vi.mock factory
const mocks = vi.hoisted(() => ({
    generateContent: vi.fn()
}));

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: class {
            constructor() { }
            getGenerativeModel() {
                return {
                    generateContent: mocks.generateContent
                };
            }
        }
    };
});

describe('AI Extract Endpoint', () => {
    let env: any;

    beforeEach(() => {
        env = {
            LICENSE_STORE: kvMock,
            VITE_GEMINI_API_KEY: 'fake-api-key'
        };
        vi.resetAllMocks();

        // Setup default success response
        mocks.generateContent.mockResolvedValue({
            response: {
                text: () => JSON.stringify({ expenses: [] })
            }
        });
    });

    const createMockContext = (req: Request, environment: any) => ({
        request: req,
        env: environment,
        next: vi.fn(),
        functionPath: '',
        waitUntil: vi.fn(),
        passThroughOnException: vi.fn(),
        params: {},
        data: {}
    } as any);

    it('should return 400 if body is missing', async () => {
        const req = new Request('http://localhost/api/ai/extract', {
            method: 'POST',
            headers: { 'X-License-Key': 'valid-key' }
        });

        (kvMock.get as Mock).mockImplementation(() => JSON.parse(JSON.stringify(activeLicense)));

        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(400);
    });

    it('should return 400 if text is too long', async () => {
        (kvMock.get as Mock).mockImplementation(() => JSON.parse(JSON.stringify(activeLicense)));
        const req = new Request('http://localhost/api/ai/extract', {
            method: 'POST',
            body: JSON.stringify({ text: 'a'.repeat(10001) }),
            headers: { 'X-License-Key': 'valid-key' }
        });
        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(400);
    });

    it('should return 429 if rate limit exceeded', async () => {
        const limitLicense = { ...activeLicense, usage: { ...activeLicense.usage, ai_requests_used: 100 } };
        (kvMock.get as Mock).mockImplementation(() => JSON.parse(JSON.stringify(limitLicense)));

        const req = new Request('http://localhost/api/ai/extract', {
            method: 'POST',
            body: JSON.stringify({ text: 'receipt' }),
            headers: { 'X-License-Key': 'valid-key' }
        });

        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(429);
    });

    it('should extract data from gemini', async () => {
        (kvMock.get as Mock).mockImplementation(() => JSON.parse(JSON.stringify(activeLicense)));

        const req = new Request('http://localhost/api/ai/extract', {
            method: 'POST',
            body: JSON.stringify({ text: 'receipt content' }),
            headers: { 'X-License-Key': 'valid-key' }
        });

        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(200);

        const body: any = await res.json();
        expect(body.data).toBeDefined();
        expect(body.usage.remaining).toBe(89); // 100 - 11
        expect(mocks.generateContent).toHaveBeenCalled();
    });
});
