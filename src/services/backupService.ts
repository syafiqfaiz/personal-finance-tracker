import { db } from '../db/db';
import { useSettingsStore } from '../store/useSettingsStore';
import { toast } from 'sonner';

const BACKUP_API_URL = '/api/backup';

interface BackupData {
    version: number;
    timestamp?: string; // Server adds this, but valid for export structure
    integrityHash?: string;

    data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expenses: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        receipts: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        budgets: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        settings: any[];
    };
}

export const backupService = {
    /**
     * compute HMAC-SHA256 signature
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async calculateHash(data: any, secret: string): Promise<string> {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(JSON.stringify(data));

        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            messageData
        );

        // Convert to hex string
        return Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    /**
     * Create and upload a backup
     */
    async createBackup(manual = false): Promise<boolean> {
        const { licenseKey } = useSettingsStore.getState();
        if (!licenseKey) {
            if (manual) toast.error('License key required for backup');
            return false;
        }

        try {
            // 1. Export Data
            const payloadData = {
                expenses: await db.expenses.toArray(),
                receipts: await db.receipts.toArray(),
                budgets: await db.budgets.toArray(),
                settings: await db.settings.toArray()
            };

            // 2. Sign Data
            const integrityHash = await this.calculateHash(payloadData, licenseKey);

            // 3. Upload
            const response = await fetch(BACKUP_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-License-Key': licenseKey
                },
                body: JSON.stringify({
                    integrityHash,
                    data: payloadData
                })
            });

            if (!response.ok) {
                if (manual) { // Retry logic handled by UI or simple retry here? 
                    // PRD said "retry once".
                    // Let's do a simple retry here for robustness

                    const retryResponse = await fetch(BACKUP_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-License-Key': licenseKey
                        },
                        body: JSON.stringify({ integrityHash, data: payloadData })
                    });
                    if (!retryResponse.ok) throw new Error('Upload failed');
                } else {
                    throw new Error('Upload failed');
                }
            }

            await response.json();

            // 4. Update Store
            useSettingsStore.getState().setLastBackupAt(new Date().toISOString());

            if (manual) toast.success('Backup Successful');

            return true;

        } catch (error) {
            console.error('Backup error:', error);
            if (manual) toast.error('Backup Failed');
            return false;
        }
    },

    /**
     * Check if smart backup is needed
     */
    async checkForSmartBackup(): Promise<void> {
        const { lastBackupAt, dataModifiedAt } = useSettingsStore.getState();

        // If no modifications ever recorded (fresh app), skip? Or backup once?
        // If dataModifiedAt is missing, we assume no changes since install.
        if (!dataModifiedAt) return;

        // If never backed up, run it.
        if (!lastBackupAt) {
            await this.createBackup(false);
            return;
        }

        const lastBackup = new Date(lastBackupAt).getTime();
        const lastMod = new Date(dataModifiedAt).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        // Condition 1: Time Elapsed > 24h
        if (now - lastBackup < oneDay) return;

        // Condition 2: Data Changed since last backup
        if (lastMod <= lastBackup) return;

        console.log('Triggering Smart Backup...');
        await this.createBackup(false);
    },

    /**
     * Restore from cloud
     */
    async restoreBackup(): Promise<void> {
        const { licenseKey } = useSettingsStore.getState();
        if (!licenseKey) {
            toast.error('License key required');
            return;
        }

        try {
            // 1. Fetch Latest

            const response = await fetch(`${BACKUP_API_URL}/latest`, {
                headers: { 'X-License-Key': licenseKey }
            });

            if (response.status === 404) {
                toast.error('No backup found');
                return;
            }

            if (!response.ok) {
                console.error('[RESTORE] Failed to fetch backup:', response.status, response.statusText);
                throw new Error('Failed to fetch backup');
            }

            const backup: BackupData = await response.json();


            // 2. Verify Integrity

            const computedHash = await this.calculateHash(backup.data, licenseKey);
            if (computedHash !== backup.integrityHash) {
                toast.error('Backup Corrupted! Hash mismatch.');
                console.error('[RESTORE] Hash Mismatch', { received: backup.integrityHash, computed: computedHash });
                return; // Abort
            }


            // 3. Confirm (This is usually a UI step, but if we call this function, we assume UI confirmed)
            // But PRD says "User Confirmation (Crucial)". 
            // The UI calling this function should show the dialog. 
            // We proceed with the dangerous write here.

            // 4. Wipe & Restore

            try {
                await db.transaction('rw', db.expenses, db.receipts, db.budgets, db.settings, async () => {

                    await db.expenses.clear();
                    await db.receipts.clear();
                    await db.budgets.clear();
                    await db.settings.clear();


                    // Note: Using bulkPut instead of bulkAdd to handle any keys
                    // that might have been auto-created during the restore process
                    if (backup.data.expenses.length > 0) {
                        await db.expenses.bulkPut(backup.data.expenses);
                    }
                    if (backup.data.receipts.length > 0) {
                        await db.receipts.bulkPut(backup.data.receipts);
                    }
                    if (backup.data.budgets.length > 0) {
                        await db.budgets.bulkPut(backup.data.budgets);
                    }
                    if (backup.data.settings.length > 0) {
                        await db.settings.bulkPut(backup.data.settings);
                    }

                });
            } catch (dbError) {
                console.error('[RESTORE] Database transaction failed:', dbError);
                throw dbError;
            }

            useSettingsStore.getState().setLastBackupAt(new Date().toISOString());


            toast.success('Restore Successful. Reloading...');

            // Force reload even if toast fails
            setTimeout(() => {

                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error('[RESTORE] Restore error:', error);
            toast.error('Restore Failed');
            // Don't reload on error - let user retry
        }
    }
};
