/// <reference types="@cloudflare/workers-types" />

export interface License {
    id: string;
    email?: string; // Optional for searchability
    created_at: string;
    status: 'active' | 'revoked' | 'expired';
    tier: 'basic' | 'pro' | 'enterprise';
    features: {
        ai_enabled: boolean;
        cloud_backup_enabled: boolean;
    };
    limits: {
        ai_requests_per_month: number;
        storage_limit_mb: number;
    };
    usage: {
        billing_cycle: string; // "YYYY-MM"
        ai_requests_used: number;
        storage_used_mb: number;
    };
}

export class LicenseRepository {
    constructor(private kv: KVNamespace) { }

    async create(tier: 'basic' | 'pro' | 'enterprise' = 'pro', email?: string): Promise<string> {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const currentMonth = now.slice(0, 7); // YYYY-MM

        const defaultLicense: License = {
            id,
            email,
            created_at: now,
            status: 'active',
            tier,
            features: {
                ai_enabled: true,
                cloud_backup_enabled: true
            },
            limits: {
                ai_requests_per_month: 100,
                storage_limit_mb: 1024
            },
            usage: {
                billing_cycle: currentMonth,
                ai_requests_used: 0,
                storage_used_mb: 0
            }
        };

        await this.kv.put(`license:${id}`, JSON.stringify(defaultLicense));
        return id;
    }

    async get(key: string): Promise<License | null> {
        const uuid = key.startsWith('license:') ? key.slice(8) : key;
        const licenseData = await this.kv.get<License>(`license:${uuid}`, 'json');
        if (!licenseData) return null;
        return licenseData;
    }

    async incrementAIUsage(id: string): Promise<{ allowed: boolean; remaining: number }> {
        const key = `license:${id}`;
        const licenseData = await this.kv.get<License>(key, 'json');

        if (!licenseData) {
            return { allowed: false, remaining: 0 };
        }

        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

        // Check Billing Cycle
        if (licenseData.usage.billing_cycle !== currentMonth) {
            licenseData.usage.billing_cycle = currentMonth;
            licenseData.usage.ai_requests_used = 0;
        }

        // Check Limit
        if (licenseData.usage.ai_requests_used >= licenseData.limits.ai_requests_per_month) {
            return {
                allowed: false,
                remaining: 0
            };
        }

        // Increment
        licenseData.usage.ai_requests_used++;

        // Save
        await this.kv.put(key, JSON.stringify(licenseData));

        return {
            allowed: true,
            remaining: licenseData.limits.ai_requests_per_month - licenseData.usage.ai_requests_used
        };
    }
    async update(id: string, updates: Partial<License>): Promise<void> {
        const key = `license:${id}`;
        const existing = await this.kv.get<License>(key, 'json');

        if (!existing) {
            throw new Error('License not found');
        }

        // Merge updates carefully
        const updated: License = {
            ...existing,
            ...updates,
            features: {
                ...existing.features,
                ...(updates.features || {})
            },
            limits: {
                ...existing.limits,
                ...(updates.limits || {})
            },
            usage: {
                ...existing.usage,
                ...(updates.usage || {})
            }
        };

        // Protect immutable fields
        updated.id = existing.id;
        updated.created_at = existing.created_at;

        await this.kv.put(key, JSON.stringify(updated));
    }

    async list(filters?: { tier?: string; email?: string }): Promise<License[]> {
        const listResult = await this.kv.list({ prefix: 'license:' });
        const keys = listResult.keys.map(k => k.name);

        // Fetch all licenses in parallel
        const licenses = await Promise.all(
            keys.map(key => this.kv.get<License>(key, 'json'))
        );

        // Filter and return non-null licenses
        return licenses
            .filter((l): l is License => l !== null)
            .filter(l => {
                if (filters?.tier && l.tier !== filters.tier) return false;
                if (filters?.email && l.email !== filters.email) return false;
                return true;
            });
    }
}
