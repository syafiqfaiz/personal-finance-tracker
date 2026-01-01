/// <reference types="@cloudflare/workers-types" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest';
import { corsMiddleware } from './corsMiddleware';
import { Context } from 'hono';

describe('CORS Middleware', () => {
    let mockContext: any;
    let next: Mock;

    beforeEach(() => {
        next = vi.fn();
        mockContext = {
            req: {
                header: vi.fn(),
                method: 'POST',
            },
            header: vi.fn(), // c.header() response
            status: vi.fn(),
            json: vi.fn(),
            text: vi.fn(),
            body: vi.fn(),
            env: {},
        };
        vi.resetAllMocks();
    });

    it('should allow whitelisted origin', async () => {
        (mockContext.req.header as Mock).mockReturnValue('https://personal-finance-tracker.pages.dev'); // Origin

        await corsMiddleware(mockContext as Context, next);

        expect(next).toHaveBeenCalled();
        expect(mockContext.header).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://personal-finance-tracker.pages.dev');
    });

    it('should allow dynamic localhost ports', async () => {
        (mockContext.req.header as Mock).mockReturnValue('http://localhost:1234');

        await corsMiddleware(mockContext as Context, next);

        expect(next).toHaveBeenCalled();
        expect(mockContext.header).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:1234');
    });

    it('should block unknown origin', async () => {
        (mockContext.req.header as Mock).mockReturnValue('http://evil.com');

        await corsMiddleware(mockContext as Context, next);

        expect(next).not.toHaveBeenCalled();
        expect(mockContext.json).toHaveBeenCalledWith({ error: 'Forbidden Origin' }, 403);
    });

    it('should handle OPTIONS preflight', async () => {
        mockContext.req.method = 'OPTIONS';
        (mockContext.req.header as Mock).mockReturnValue('http://localhost:5173');

        await corsMiddleware(mockContext as Context, next);

        expect(next).not.toHaveBeenCalled();
        expect(mockContext.body).toHaveBeenCalledWith(null, 204);
        expect(mockContext.header).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    });
});
