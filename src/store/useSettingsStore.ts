import { create } from 'zustand';
import { db } from '../db/db';

interface SettingsState {
    userName: string;
    licenseKey: string;
    isLoading: boolean;
    lastBackupAt?: string;
    dataModifiedAt?: string;
    setUserName: (name: string) => Promise<void>;
    setLicenseKey: (key: string) => Promise<void>;
    setLastBackupAt: (timestamp: string) => Promise<void>; // New
    setDataModifiedAt: (timestamp: string) => Promise<void>; // New
    loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    userName: '',
    licenseKey: '',
    isLoading: true,
    lastBackupAt: undefined,
    dataModifiedAt: undefined,

    loadSettings: async () => {
        set({ isLoading: true });
        try {
            const userName = await db.settings.get('user_name');
            const licenseKey = await db.settings.get('license_key');
            const lastBackupAt = await db.settings.get('last_backup_at');
            const dataModifiedAt = await db.settings.get('data_modified_at');

            set({
                userName: userName?.value || '',
                licenseKey: licenseKey?.value || '',
                lastBackupAt: lastBackupAt?.value,
                dataModifiedAt: dataModifiedAt?.value,
                isLoading: false,
            });
        } catch (error) {
            console.error('Failed to load settings:', error);
            set({ isLoading: false });
        }
    },


    setUserName: async (value: string) => {
        await db.settings.put({ key: 'user_name', value });
        set({ userName: value });
    },

    setLicenseKey: async (value: string) => {
        await db.settings.put({ key: 'license_key', value });
        set({ licenseKey: value });
    },

    setLastBackupAt: async (value: string) => {
        await db.settings.put({ key: 'last_backup_at', value });
        set({ lastBackupAt: value });
    },

    setDataModifiedAt: async (value: string) => {
        await db.settings.put({ key: 'data_modified_at', value });
        set({ dataModifiedAt: value });
    },
}));
