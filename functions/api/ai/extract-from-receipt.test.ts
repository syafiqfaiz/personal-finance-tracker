/// <reference types="@cloudflare/workers-types" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { onRequest } from './extract-from-receipt';

// Mock KVNamespace
const kvMock = {
    get: vi.fn(),
    put: vi.fn(),
} as unknown as KVNamespace;

const activeLicense = {
    id: 'test-user-123',
    status: 'active',
    limits: { ai_requests_per_month: 100 },
    usage: { billing_cycle: '2026-01', ai_requests_used: 10 }
};

// Hoist mocks to be available in vi.mock factory
const mocks = vi.hoisted(() => ({
    generateContent: vi.fn(),
    s3Send: vi.fn(),
    fetchImage: vi.fn()
}));

// Mock Gemini Vision API
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

// Mock S3 Client
vi.mock('@aws-sdk/client-s3', () => {
    return {
        S3Client: class {
            constructor() { }
            send = mocks.s3Send;
        },
        GetObjectCommand: vi.fn()
    };
});

// Mock s3-request-presigner
vi.mock('@aws-sdk/s3-request-presigner', () => {
    return {
        getSignedUrl: vi.fn(() => Promise.resolve('https://s3.amazonaws.com/presigned-url'))
    };
});

// Mock global fetch for image fetching
global.fetch = mocks.fetchImage as any;

describe('POST /api/ai/extract-from-receipt', () => {
    let env: any;

    beforeEach(() => {
        env = {
            LICENSE_STORE: kvMock,
            VITE_GEMINI_API_KEY: 'test-gemini-key',
            AWS_ACCESS_KEY_ID: 'test-access-key',
            AWS_SECRET_ACCESS_KEY: 'test-secret-key',
            AWS_BUCKET_NAME: 'test-bucket',
            AWS_REGION: 'us-east-1'
        };
        vi.resetAllMocks();
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

    const validPayload = {
        s3_key: 'user_storage/test-user-123/receipts/2026/2026-01/receipt.jpg',
        categories: ['Food', 'Transport', 'Shopping'],
        current_date: '2026-01-25',
        available_payment_method: ['Cash', 'Credit Card', 'QR Pay']
    };

    it('should return 400 if s3_key is missing', async () => {
        (kvMock.get as Mock).mockImplementation(() => JSON.parse(JSON.stringify(activeLicense)));

        const req = new Request('http://localhost/api/ai/extract-from-receipt', {
            method: 'POST',
            body: JSON.stringify({ ...validPayload, s3_key: undefined }),
            headers: { 'X-License-Key': 'valid-key' }
        });

        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(400);
        const json: any = await res.json();
        expect(json.error).toBe('Missing "s3_key" field');
    });

    it('should return 403 if s3_key does not belong to user', async () => {
        (kvMock.get as Mock).mockImplementation(() => JSON.parse(JSON.stringify(activeLicense)));

        const req = new Request('http://localhost/api/ai/extract-from-receipt', {
            method: 'POST',
            body: JSON.stringify({
                ...validPayload,
                s3_key: 'user_storage/other-user/receipts/2026/2026-01/receipt.jpg' // Wrong user
            }),
            headers: { 'X-License-Key': 'valid-key' }
        });

        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(403);
        const json: any = await res.json();
        expect(json.error).toContain('Access denied');
    });

    it('should return 429 if quota is exceeded', async () => {
        const limitLicense = { ...activeLicense, usage: { ...activeLicense.usage, ai_requests_used: 100 } };
        (kvMock.get as Mock).mockImplementation(() => JSON.parse(JSON.stringify(limitLicense)));

        const req = new Request('http://localhost/api/ai/extract-from-receipt', {
            method: 'POST',
            body: JSON.stringify(validPayload),
            headers: { 'X-License-Key': 'valid-key' }
        });

        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(429);
        const json: any = await res.json();
        expect(json.error).toBe('Rate limit exceeded');
    });

    it('should successfully extract receipt data with high confidence', async () => {
        (kvMock.get as Mock).mockImplementation(() => JSON.parse(JSON.stringify(activeLicense)));

        // Mock image fetch
        mocks.fetchImage.mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(100))
        });

        // Mock Gemini Vision response
        const kvResponse = `
name: Starbucks
amount: 18.50
category: Food
payment_method: Credit Card
date: 2026-01-25
notes: Coffee
confidence: high
missing_fields: 
response_text: I see a receipt from Starbucks for RM18.50. Paid with Credit Card. Should I categorize this as Food?
        `;

        mocks.generateContent.mockResolvedValue({
            response: {
                text: () => kvResponse
            }
        });

        const req = new Request('http://localhost/api/ai/extract-from-receipt', {
            method: 'POST',
            body: JSON.stringify(validPayload),
            headers: { 'X-License-Key': 'valid-key' }
        });

        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(200);

        const body: any = await res.json();
        expect(body.captured_data).toEqual({
            name: 'Starbucks',
            amount: 18.50,
            category: 'Food',
            payment_method: 'Credit Card',
            date: '2026-01-25',
            notes: 'Coffee',
            confidence: 'high',
            missing_fields: []
        });

        expect(body.receipt_metadata).toEqual({
            s3_key: validPayload.s3_key,
            merchant_name: 'Starbucks',
            receipt_date: '2026-01-25'
        });

        expect(body.usage.remaining).toBe(89);
    });

    it('should return low confidence when category is missing', async () => {
        (kvMock.get as Mock).mockImplementation(() => JSON.parse(JSON.stringify(activeLicense)));

        // Mock image fetch
        mocks.fetchImage.mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(100))
        });

        // Mock Gemini Vision response with missing category
        const kvResponse = `
name: Guardian Pharmacy
amount: 45.00
category: null
payment_method: Cash
date: 2026-01-24
notes: null
confidence: low
missing_fields: category
response_text: Got it! I see RM45.00 from Guardian Pharmacy on Jan 24. What category should this go under?
        `;

        mocks.generateContent.mockResolvedValue({
            response: {
                text: () => kvResponse
            }
        });

        const req = new Request('http://localhost/api/ai/extract-from-receipt', {
            method: 'POST',
            body: JSON.stringify(validPayload),
            headers: { 'X-License-Key': 'valid-key' }
        });

        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(200);

        const body: any = await res.json();
        expect(body.captured_data.confidence).toBe('low');
        expect(body.captured_data.missing_fields).toEqual(['category']);
        expect(body.response_text).toContain('category');
    });

    it('should return conversational fallback on Gemini Vision API failure', async () => {
        (kvMock.get as Mock).mockImplementation(() => JSON.parse(JSON.stringify(activeLicense)));

        // Mock image fetch success
        mocks.fetchImage.mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(100))
        });

        // Mock Gemini Vision API failure
        mocks.generateContent.mockRejectedValue(new Error('Vision API timeout'));

        const req = new Request('http://localhost/api/ai/extract-from-receipt', {
            method: 'POST',
            body: JSON.stringify(validPayload),
            headers: { 'X-License-Key': 'valid-key' }
        });

        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(200); // Still returns 200 with fallback

        const body: any = await res.json();
        expect(body.response_text).toContain("couldn't read the receipt");
        expect(body.captured_data.confidence).toBe('low');
        expect(body.captured_data.missing_fields).toEqual(['name', 'amount', 'category', 'payment_method']);
        expect(body.receipt_metadata.merchant_name).toBe('Unknown');
        expect(body.usage.remaining).toBe(89); // Quota still incremented
    });
});
