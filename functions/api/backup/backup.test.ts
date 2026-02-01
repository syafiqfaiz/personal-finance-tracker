import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequest } from './[[route]]';

// Mock R2 and KV
const mockLicenseStore = {
    get: vi.fn(),
};

const mockAssetsBucket = {
    put: vi.fn(),
    list: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
};

const mockEnv = {
    LICENSE_STORE: mockLicenseStore,
    ASSETS_BUCKET: mockAssetsBucket,
};

// Helper: HMAC Signature Generation
async function generateSignature(data: any, secret: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(JSON.stringify(data));
    const key = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return [...new Uint8Array(signature)].map(b => b.toString(16).padStart(2, '0')).join('');
}

describe('Backup API', () => {
    const validLicense = { id: 'test-license-id', key: 'test-key', status: 'active' };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock Auth Middleware behavior (assuming it injects 'license' into context if header valid)
        // Since we are testing the handler directly via `onRequest`, we might need to mock the middleware or constructing the request such that the middleware allows it.
        // However, `onRequest` is the composed Hono handler.
        // For simplicity in unit testing Hono apps with middleware, usually we rely on integration tests or mock the context. 
        // But here we can simulate the request. 
        // Wait, `onRequest` uses `handle(app)`.

        // Mock KV for Auth Middleware
        // LicenseRepository calls kv.get(key, 'json'), so we must return the object, not string.
        mockLicenseStore.get.mockResolvedValue(validLicense);
    });

    it('POST / requires integrityHash', async () => {
        const req = new Request('http://localhost/api/backup', {
            method: 'POST',
            headers: { 'X-License-Key': 'valid-key', 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { foo: 'bar' } }) // Missing hash
        });



        // @ts-ignore
        const res = await onRequest({ request: req, env: mockEnv });
        expect(res.status).toBe(400);
    });

    it('POST / rejects invalid signature', async () => {
        const req = new Request('http://localhost/api/backup', {
            method: 'POST',
            headers: { 'X-License-Key': 'valid-key', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                integrityHash: 'deadbeef',
                data: { foo: 'bar' }
            })
        });



        // @ts-ignore
        const res = await onRequest({ request: req, env: mockEnv });
        expect(res.status).toBe(403);
    });

    it('POST / accepts valid signature and uploads to R2', async () => {
        const data = { foo: 'bar' };
        const sig = await generateSignature(data, validLicense.id); // Secret is ID? Check authMiddleware... 
        // Actually auth middleware usually looks up license by key. 
        // The implementation uses `license.id` as the secret for HMAC? 
        // Let's check `functions/api/backup/index.ts`.
        // `verifySignature(body.data, body.integrityHash, license.id)`
        // Yes, it uses license.id.

        // Wait, validLicense in mock KV should probably match what middleware expects.
        // Assuming middleware resolves X-License-Key to this license object.

        const req = new Request('http://localhost/api/backup', {
            method: 'POST',
            headers: { 'X-License-Key': 'valid-key', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                integrityHash: sig,
                data
            })
        });

        // Mock R2 list (empty)
        mockAssetsBucket.list.mockResolvedValue({ objects: [] });

        // @ts-ignore
        const res = await onRequest({ request: req, env: mockEnv });
        expect(res.status).toBe(200);

        expect(mockAssetsBucket.put).toHaveBeenCalled();
        const callArgs = mockAssetsBucket.put.mock.calls[0];
        expect(callArgs[0]).toContain(`user_storage/${validLicense.id}/backup/`);
    });

    it('POST / rotates backups if > 5', async () => {
        const data = { foo: 'bar' };
        const sig = await generateSignature(data, validLicense.id);

        const req = new Request('http://localhost/api/backup', {
            method: 'POST',
            headers: { 'X-License-Key': 'valid-key', 'Content-Type': 'application/json' },
            body: JSON.stringify({ integrityHash: sig, data })
        });

        // Mock R2 list returning 6 items
        mockAssetsBucket.list.mockResolvedValue({
            objects: [
                { key: 'backup/1.json' }, { key: 'backup/2.json' },
                { key: 'backup/3.json' }, { key: 'backup/4.json' },
                { key: 'backup/5.json' }, { key: 'backup/6.json' }
            ]
        });

        // @ts-ignore
        await onRequest({ request: req, env: mockEnv });

        expect(mockAssetsBucket.delete).toHaveBeenCalled();
        // Since we sort by key (lexical ~ timestamp), 1.json is oldest if format is timestamp.
        // Logic: `sorted.slice(0, length - 5)` -> removes items from start.
        // Expect delete called for excess items.
    });

    it('GET /latest returns 404 if no backups', async () => {
        const req = new Request('http://localhost/api/backup/latest', {
            method: 'GET',
            headers: { 'X-License-Key': 'valid-key' }
        });

        mockAssetsBucket.list.mockResolvedValue({ objects: [] });

        // @ts-ignore
        const res = await onRequest({ request: req, env: mockEnv });
        expect(res.status).toBe(404);
    });

    it('GET /latest returns newest file', async () => {
        const req = new Request('http://localhost/api/backup/latest', {
            method: 'GET',
            headers: { 'X-License-Key': 'valid-key' }
        });

        mockAssetsBucket.list.mockResolvedValue({
            objects: [
                { key: 'backup/100.json' },
                { key: 'backup/200.json' } // Newer
            ]
        });

        mockAssetsBucket.get.mockResolvedValue({
            body: JSON.stringify({ success: true })
        });

        // @ts-ignore
        const res = await onRequest({ request: req, env: mockEnv });
        expect(res.status).toBe(200);
        expect(mockAssetsBucket.get).toHaveBeenCalledWith('backup/200.json');
    });
});
