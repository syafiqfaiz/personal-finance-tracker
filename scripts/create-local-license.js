#!/usr/bin/env node

/**
 * Script to manually create a license in local KV store
 * Usage: node scripts/create-local-license.js <license-id>
 */

const licenseId = process.argv[2] || 'f8156fc2-0448-40ca-b098-2c801d14263d';
const adminSecret = '2026AdminSecretKeyBelanja';
const apiUrl = 'http://localhost:8788/api/admin/licenses';

const license = {
    id: licenseId,
    email: 'local@test.dev',
    created_at: new Date().toISOString(),
    status: 'active',
    tier: 'pro',
    features: {
        ai_enabled: true,
        cloud_backup_enabled: true
    },
    limits: {
        ai_requests_per_month: 10000,
        storage_limit_mb: 10240
    },
    usage: {
        billing_cycle: new Date().toISOString().slice(0, 7),
        ai_requests_used: 0,
        storage_used_mb: 0
    }
};

console.log(`\n📝 Creating license: ${licenseId}\n`);

// Since the admin API auto-generates UUIDs, we need to use wrangler KV directly
// For now, let's create via API and note the generated ID
fetch(apiUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': adminSecret
    },
    body: JSON.stringify({
        tier: 'pro',
        email: 'local@test.dev'
    })
})
    .then(res => res.json())
    .then(data => {
        console.log('✅ License created successfully!');
        console.log(`\n🔑 License Key: ${data.key}`);
        console.log(`\nAdd this to your Settings page in the app:\nhttp://localhost:8788/settings\n`);
    })
    .catch(err => {
        console.error('❌ Failed to create license:', err.message);
        process.exit(1);
    });
