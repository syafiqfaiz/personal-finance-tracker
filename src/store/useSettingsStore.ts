import { create } from 'zustand';
import { db } from '../db/db';

interface SettingsState {
    userName: string;
    licenseKey: string;
    isLoading: boolean;
    setUserName: (name: string) => Promise<void>;
    setLicenseKey: (key: string) => Promise<void>;
    loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    userName: '',
    licenseKey: '',
    isLoading: true,

    loadSettings: async () => {
        set({ isLoading: true });
        try {
            const userName = await db.settings.get('user_name');
            const licenseKey = await db.settings.get('license_key');

            set({
                userName: userName?.value || '',
                licenseKey: licenseKey?.value || '',
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
}));
