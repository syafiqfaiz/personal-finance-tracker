/// <reference types="@cloudflare/workers-types" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { onRequest as onUploadRequest } from './upload-url';
import { onRequest as onViewRequest } from './view-url';

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

// Hoist mocks
const mocks = vi.hoisted(() => ({
    generateUploadUrl: vi.fn(),
    generateViewUrl: vi.fn(),
    send: vi.fn()
}));

// Mock StorageService (Class Syntax)
vi.mock('../../core/storageService', () => {
    return {
        StorageService: class {
            constructor() { }
            generateUploadUrl = mocks.generateUploadUrl;
            generateViewUrl = mocks.generateViewUrl;
        }
    };
});

// Mock S3Client (Class Syntax)
vi.mock('@aws-sdk/client-s3', () => ({
    S3Client: class {
        send = mocks.send;
    }
}));

describe('Storage Endpoints', () => {
    let env: any;

    beforeEach(() => {
        env = {
            LICENSE_STORE: kvMock,
            AWS_ACCESS_KEY_ID: 'fake-id',
            AWS_SECRET_ACCESS_KEY: 'fake-secret',
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

    describe('POST /api/storage/upload-url', () => {
        it('should return upload URL for valid request', async () => {
            (kvMock.get as Mock).mockResolvedValue(activeLicense);
            mocks.generateUploadUrl.mockResolvedValue({ url: 'https://s3/upload', key: 'key/123' });

            const req = new Request('http://localhost/api/storage/upload-url', {
                method: 'POST',
                body: JSON.stringify({ filename: 'receipt.jpg', contentType: 'image/jpeg' }),
                headers: { 'X-License-Key': 'valid-key' }
            });

            const res = await onUploadRequest(createMockContext(req, env));
            expect(res.status).toBe(200);
            const body = await res.json() as any;
            expect(body.url).toBe('https://s3/upload');
            expect(body.key).toBe('key/123');
        });

        it('should return 400 for missing body fields', async () => {
            (kvMock.get as Mock).mockResolvedValue(activeLicense);
            const req = new Request('http://localhost/api/storage/upload-url', {
                method: 'POST',
                body: JSON.stringify({ filename: 'only-filename' }), // Missing contentType
                headers: { 'X-License-Key': 'valid-key' }
            });
            const res = await onUploadRequest(createMockContext(req, env));
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/storage/view-url', () => {
        it('should return view URL for valid key', async () => {
            (kvMock.get as Mock).mockResolvedValue(activeLicense);
            mocks.generateViewUrl.mockResolvedValue('https://s3/view');

            const req = new Request('http://localhost/api/storage/view-url?key=user_storage/123/file.jpg', {
                method: 'GET',
                headers: { 'X-License-Key': 'valid-key' }
            });

            const res = await onViewRequest(createMockContext(req, env));
            expect(res.status).toBe(200);
            const body = await res.json() as any;
            expect(body.url).toBe('https://s3/view');
        });

        it('should return 400 if key is missing', async () => {
            (kvMock.get as Mock).mockResolvedValue(activeLicense);
            const req = new Request('http://localhost/api/storage/view-url', { // No key param
                method: 'GET',
                headers: { 'X-License-Key': 'valid-key' }
            });

            const res = await onViewRequest(createMockContext(req, env));
            expect(res.status).toBe(400);
        });
    });
});
