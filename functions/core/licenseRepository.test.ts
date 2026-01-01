/// <reference types="@cloudflare/workers-types" />
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { LicenseRepository, License } from './licenseRepository';

const kvMock = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
} as unknown as KVNamespace;

const defaultLicense: License = {
    id: '123',
    created_at: '2025-01-01T00:00:00Z',
    status: 'active',
    tier: 'pro',
    features: { ai_enabled: true, cloud_backup_enabled: true },
    limits: { ai_requests_per_month: 100, storage_limit_mb: 1024 },
    usage: { billing_cycle: '2025-01', ai_requests_used: 10, storage_used_mb: 0 }
};

describe('LicenseRepository', () => {
    let repo: LicenseRepository;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-15T10:00:00Z')); // Mid-month
        repo = new LicenseRepository(kvMock);
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should create a new license with default values', async () => {
        const key = await repo.create('pro');
        expect(key).toBeDefined();
        expect(kvMock.put).toHaveBeenCalledTimes(1);

        const [calledKey, calledValue] = (kvMock.put as Mock).mock.calls[0];
        expect(calledKey).toBe(`license:${key}`);

        const license = JSON.parse(calledValue);
        expect(license.tier).toBe('pro');
    });

    it('should get an existing license', async () => {
        (kvMock.get as Mock).mockResolvedValue(defaultLicense);
        const result = await repo.get('uuid-123');
        expect(result).toEqual(defaultLicense);
    });

    describe('incrementAIUsage', () => {
        it('should increment usage if within limit', async () => {
            (kvMock.get as Mock).mockResolvedValue(defaultLicense);

            const result = await repo.incrementAIUsage('123');

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(89); // 100 - 11

            const [, calledValue] = (kvMock.put as Mock).mock.lastCall || [];
            if (!calledValue) throw new Error('put not called');

            const saved = JSON.parse(calledValue as string);
            expect(saved.usage.ai_requests_used).toBe(11);
        });

        it('should reset usage on new billing cycle', async () => {
            const oldMonthLicense = {
                ...defaultLicense,
                usage: { billing_cycle: '2024-12', ai_requests_used: 99, storage_used_mb: 0 }
            };
            (kvMock.get as Mock).mockResolvedValue(oldMonthLicense);

            // System time is 2025-01-15, which is new month vs 2024-12
            const result = await repo.incrementAIUsage('123');

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(99); // 100 - 1

            const [, calledValue] = (kvMock.put as Mock).mock.lastCall || [];
            if (!calledValue) throw new Error('put not called');

            const saved = JSON.parse(calledValue as string);
            expect(saved.usage.billing_cycle).toBe('2025-01');
            expect(saved.usage.ai_requests_used).toBe(1);
        });

        it('should deny if limit exceeded', async () => {
            const limitLicense = {
                ...defaultLicense,
                usage: { billing_cycle: '2025-01', ai_requests_used: 100, storage_used_mb: 0 }
            };
            (kvMock.get as Mock).mockResolvedValue(limitLicense);

            const result = await repo.incrementAIUsage('123');

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
            expect(kvMock.put).not.toHaveBeenCalled();
        });
    });
});
