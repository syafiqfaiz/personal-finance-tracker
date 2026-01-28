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
            licenseKey: '',
            isLoading: true
        });
        vi.clearAllMocks();
    });

    describe('setLicenseKey', () => {
        it('updates state and persisted setting', async () => {
            await useSettingsStore.getState().setLicenseKey('new-key');

            expect(useSettingsStore.getState().licenseKey).toBe('new-key');
            expect(db.settings.put).toHaveBeenCalledWith({ key: 'license_key', value: 'new-key' });
        });
    });

    describe('loadSettings', () => {
        it('loads settings from DB correctly', async () => {
            // Setup mock returns
            (db.settings.get as any).mockImplementation((key: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                const values: Record<string, any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
                    'license_key': { value: 'saved-license' },
                };
                return Promise.resolve(values[key]);
            });

            await useSettingsStore.getState().loadSettings();

            const state = useSettingsStore.getState();
            expect(state.isLoading).toBe(false);
            expect(state.licenseKey).toBe('saved-license');
        });

        it('handles missing settings gracefully', async () => {
            (db.settings.get as any).mockResolvedValue(undefined); // eslint-disable-line @typescript-eslint/no-explicit-any

            await useSettingsStore.getState().loadSettings();

            const state = useSettingsStore.getState();
            expect(state.licenseKey).toBe('');
        });
    });
});
