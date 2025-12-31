import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSettingsStore } from './useSettingsStore';
import { db } from '../db/db';

// Mock DB - relied on setup.ts or manual mock here?
// Since setup.ts generally mocks db, we can spy on it.
// Or we explicitly mock it here to be safe and clear.
// But useFinanceStore.test.ts uses global db mock. Let's see if we need to mock it again.
// Based on useFinanceStore work, db is imported and we can spy on methods.

describe('useSettingsStore', () => {
    beforeEach(() => {
        useSettingsStore.setState({
            geminiKey: '',
            s3Config: { bucket: '', region: '', accessKeyId: '', secretAccessKey: '' },
            isLoading: true
        });
        vi.clearAllMocks();
    });

    describe('setGeminiKey', () => {
        it('updates state and persisted setting', async () => {
            await useSettingsStore.getState().setGeminiKey('new-key');

            expect(useSettingsStore.getState().geminiKey).toBe('new-key');
            expect(db.settings.put).toHaveBeenCalledWith({ key: 'gemini_key', value: 'new-key' });
        });
    });

    describe('setS3Config', () => {
        it('updates state and persisted settings', async () => {
            const newConfig = {
                bucket: 'my-bucket',
                region: 'us-west-1',
                accessKeyId: 'key',
                secretAccessKey: 'secret'
            };

            await useSettingsStore.getState().setS3Config(newConfig);

            expect(useSettingsStore.getState().s3Config).toEqual(newConfig);
            expect(db.settings.put).toHaveBeenCalledWith({ key: 's3_bucket', value: 'my-bucket' });
            expect(db.settings.put).toHaveBeenCalledWith({ key: 's3_region', value: 'us-west-1' });
            expect(db.settings.put).toHaveBeenCalledWith({ key: 's3_access_key', value: 'key' });
            expect(db.settings.put).toHaveBeenCalledWith({ key: 's3_secret_key', value: 'secret' });
        });
    });

    describe('loadSettings', () => {
        it('loads settings from DB correctly', async () => {
            // Setup mock returns
            (db.settings.get as any).mockImplementation((key: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                const values: Record<string, any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
                    'gemini_key': { value: 'saved-gemini' },
                    's3_bucket': { value: 'saved-bucket' },
                    's3_region': { value: 'saved-region' },
                    's3_access_key': { value: 'saved-access' },
                    's3_secret_key': { value: 'saved-secret' }
                };
                return Promise.resolve(values[key]);
            });

            await useSettingsStore.getState().loadSettings();

            const state = useSettingsStore.getState();
            expect(state.isLoading).toBe(false);
            expect(state.geminiKey).toBe('saved-gemini');
            expect(state.s3Config).toEqual({
                bucket: 'saved-bucket',
                region: 'saved-region',
                accessKeyId: 'saved-access',
                secretAccessKey: 'saved-secret'
            });
        });

        it('handles missing settings gracefully', async () => {
            (db.settings.get as any).mockResolvedValue(undefined); // eslint-disable-line @typescript-eslint/no-explicit-any

            await useSettingsStore.getState().loadSettings();

            const state = useSettingsStore.getState();
            expect(state.geminiKey).toBe('');
            expect(state.s3Config.bucket).toBe('');
        });
    });
});
