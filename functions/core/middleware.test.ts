/// <reference types="@cloudflare/workers-types" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest';
import { authMiddleware } from './middleware';
import { Context } from 'hono';

// Mock KVNamespace
const kvMock = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
} as unknown as KVNamespace;

describe('Authentication Middleware', () => {
    let mockContext: any;
    let next: Mock;

    beforeEach(() => {
        next = vi.fn();
        mockContext = {
            req: {
                header: vi.fn(),
            },
            env: {
                LICENSE_STORE: kvMock
            },
            json: vi.fn(),
            set: vi.fn(), // for c.set if used
        };
        vi.resetAllMocks();
    });

    it('should return 401 if X-License-Key header is missing', async () => {
        (mockContext.req.header as Mock).mockReturnValue(undefined);

        await authMiddleware(mockContext as Context, next);

        expect(mockContext.json).toHaveBeenCalledWith({ error: 'Missing License Key' }, 401);
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if License Key is invalid', async () => {
        (mockContext.req.header as Mock).mockReturnValue('invalid-key');
        (kvMock.get as Mock).mockResolvedValue(null);

        await authMiddleware(mockContext as Context, next);

        expect(mockContext.json).toHaveBeenCalledWith({ error: 'Invalid License Key' }, 403);
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if License Key is valid', async () => {
        const validLicense = { id: 'uuid-123', status: 'active' };
        (mockContext.req.header as Mock).mockReturnValue('valid-key');
        (kvMock.get as Mock).mockResolvedValue(validLicense);

        await authMiddleware(mockContext as Context, next);

        expect(next).toHaveBeenCalled();
        expect(mockContext.set).toHaveBeenCalledWith('license', validLicense);
    });
});
