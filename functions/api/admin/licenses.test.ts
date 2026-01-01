/// <reference types="@cloudflare/workers-types" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequest } from './licenses';

// Mock KVNamespace
const kvMock = {
    get: vi.fn(),
    put: vi.fn(),
} as unknown as KVNamespace;

// Mock LicenseRepository
const mockCreate = vi.fn();
vi.mock('../../core/licenseRepository', () => {
    return {
        LicenseRepository: class {
            constructor() { }
            create = mockCreate;
        }
    };
});

describe('Admin Licenses Endpoint', () => {
    let env: any;

    beforeEach(() => {
        env = {
            LICENSE_STORE: kvMock,
            ADMIN_SECRET: 'super-secret-admin-key'
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

    it('should return 401 if admin secret is missing', async () => {
        const req = new Request('http://localhost/api/admin/licenses', {
            method: 'POST',
        });
        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(401);
    });

    it('should return 403 if admin secret is incorrect', async () => {
        const req = new Request('http://localhost/api/admin/licenses', {
            method: 'POST',
            headers: { 'X-Admin-Secret': 'wrong-key' }
        });
        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(403);
    });

    it('should create a new license with valid secret', async () => {
        mockCreate.mockResolvedValue('new-license-uuid');

        const req = new Request('http://localhost/api/admin/licenses', {
            method: 'POST',
            headers: { 'X-Admin-Secret': 'super-secret-admin-key' },
            body: JSON.stringify({ tier: 'pro' })
        });

        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(201);

        const body = await res.json() as any;
        expect(body.id).toBe('new-license-uuid');
        expect(body.key).toBe('new-license-uuid'); // Key is ID for now
        expect(mockCreate).toHaveBeenCalledWith('pro');
    });

    it('should default to pro tier if not specified', async () => {
        mockCreate.mockResolvedValue('default-license');

        const req = new Request('http://localhost/api/admin/licenses', {
            method: 'POST',
            headers: { 'X-Admin-Secret': 'super-secret-admin-key' }
        });

        const res = await onRequest(createMockContext(req, env));
        expect(res.status).toBe(201);
        expect(mockCreate).toHaveBeenCalledWith('pro');
    });
});
