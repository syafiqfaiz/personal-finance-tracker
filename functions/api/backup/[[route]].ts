import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { authMiddleware } from '../../core/middleware';
import { corsMiddleware } from '../../core/corsMiddleware';
import { securityMiddleware } from '../../core/securityMiddleware';
import { License } from '../../core/licenseRepository';

type Bindings = {
    LICENSE_STORE: KVNamespace;
    ASSETS_BUCKET: R2Bucket;
};

type Variables = {
    license: License;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
    .basePath('/api/backup');

app.use('*', corsMiddleware);
app.use('*', securityMiddleware);
app.use('*', authMiddleware);

// Helper: Verify HMAC-SHA256
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function verifySignature(data: any, signature: string, secret: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(JSON.stringify(data));

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );

    // Convert hex signature back to Uint8Array
    const signatureBytes = new Uint8Array(
        signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    return await crypto.subtle.verify(
        'HMAC',
        key,
        signatureBytes,
        messageData
    );
}

// POST / - Upload a new backup
app.post('/', async (c) => {
    const license = c.get('license');


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: { integrityHash: string; data: any };
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'Invalid JSON body' }, 400);
    }

    if (!body.integrityHash || !body.data) {
        return c.json({ error: 'Missing integrityHash or data' }, 400);
    }

    // 1. Integrity Check (HMAC Verification)
    const isValid = await verifySignature(body.data, body.integrityHash, license.id);
    if (!isValid) {
        return c.json({ error: 'Integrity check failed. Data may be tampered.' }, 403);
    }

    // 2. Generate Server-Side Timestamp & Backup Object
    const timestamp = Date.now();
    const backupObject = {
        version: 3,
        timestamp: new Date(timestamp).toISOString(),
        integrityHash: body.integrityHash,
        data: body.data
    };

    const key = `user_storage/${license.id}/backup/${timestamp}.json`;

    // 3. Save to R2
    try {
        console.log('[BACKUP] Attempting to save backup to R2:', key);
        await c.env.ASSETS_BUCKET.put(key, JSON.stringify(backupObject), {
            customMetadata: { userId: license.id, type: 'backup' }
        });
        console.log('[BACKUP] Successfully saved backup to R2:', key);
    } catch (error) {
        console.error('[BACKUP] Failed to save backup to R2:', error);
        return c.json({ error: 'Failed to upload backup' }, 500);
    }

    // 4. Rotation (Keep Max 5)
    // We do this asynchronously (fire and forget) to speed up response? 
    // Or await it to ensure consistency? The PRD said "Do NOT delete any old backups unless new one is saved".
    // We verified save above, so now we rotate.
    try {
        const prefix = `user_storage/${license.id}/backup/`;
        const listed = await c.env.ASSETS_BUCKET.list({ prefix });

        // Use R2Objects directly since we aren't paginating heavily for < 10 files
        if (listed.objects.length > 5) {
            // Sort by uploaded time (key contains timestamp, so lexical sort works too, but R2 objects have specific timestamps)
            // The key format is .../backup/{timestamp}.json. 
            // Timestamp is Date.now() which creates simple lexical ordering.
            const sorted = listed.objects.sort((a, b) => {
                return a.key.localeCompare(b.key);
            });

            const toDelete = sorted.slice(0, sorted.length - 5);
            if (toDelete.length > 0) {
                const keysToDelete = toDelete.map(obj => obj.key);
                await c.env.ASSETS_BUCKET.delete(keysToDelete);
                console.log(`Rotated backups for ${license.id}. Deleted: ${keysToDelete.join(', ')}`);
            }
        }
    } catch (error) {
        // Log but don't fail the request if rotation fails
        console.error('Failed to rotate backups:', error);
    }

    return c.json({ success: true, timestamp: backupObject.timestamp });
});

// GET /latest - Restore data
app.get('/latest', async (c) => {
    const license = c.get('license');
    const prefix = `user_storage/${license.id}/backup/`;

    try {
        const listed = await c.env.ASSETS_BUCKET.list({ prefix });
        if (listed.objects.length === 0) {
            return c.json({ error: 'No backups found' }, 404);
        }

        // Sort descending to get newest
        const sorted = listed.objects.sort((a, b) => b.key.localeCompare(a.key));
        const latestKey = sorted[0].key;

        const object = await c.env.ASSETS_BUCKET.get(latestKey);
        if (!object) {
            return c.json({ error: 'Backup file missing' }, 404);
        }

        return new Response(object.body, {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Failed to retrieve backup:', error);
        return c.json({ error: 'Failed to retrieve backup' }, 500);
    }
});

// GET /status - Check if backup exists and get timestamp
app.get('/status', async (c) => {
    const license = c.get('license');
    const prefix = `user_storage/${license.id}/backup/`;

    try {
        const listed = await c.env.ASSETS_BUCKET.list({ prefix });
        if (listed.objects.length === 0) {
            return c.json({ exists: false, timestamp: null });
        }

        // Sort descending
        const sorted = listed.objects.sort((a, b) => b.key.localeCompare(a.key));
        const latest = sorted[0];

        // Extract timestamp from filename or metadata? Filename is {timestamp}.json
        // But we put ISO string inside the file. 
        // We can just rely on uploaded property of R2 object for a rough estimate, 
        // or parse filename if we need exact Date.now() value.
        // Let's return the uploaded date of the file.
        return c.json({
            exists: true,
            timestamp: latest.uploaded.toISOString()
        });

    } catch {
        return c.json({ error: 'Failed to check status' }, 500);
    }
});

export const onRequest = handle(app);
