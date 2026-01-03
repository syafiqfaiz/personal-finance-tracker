import { create } from 'zustand';
import { db } from '../db/db';

interface SettingsState {
    userName: string;
    licenseKey: string;
    s3Config: {
        bucket: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
    };
    isLoading: boolean;
    setUserName: (name: string) => Promise<void>;
    setLicenseKey: (key: string) => Promise<void>;
    setS3Config: (config: SettingsState['s3Config']) => Promise<void>;
    loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    userName: '',
    licenseKey: '',
    s3Config: {
        bucket: '',
        region: '',
        accessKeyId: '',
        secretAccessKey: '',
    },
    isLoading: true,

    loadSettings: async () => {
        set({ isLoading: true });
        try {
            const userName = await db.settings.get('user_name');
            const licenseKey = await db.settings.get('license_key');
            const s3Bucket = await db.settings.get('s3_bucket');
            const s3Region = await db.settings.get('s3_region');
            const s3AccessKey = await db.settings.get('s3_access_key');
            const s3SecretKey = await db.settings.get('s3_secret_key');

            set({
                userName: userName?.value || '',
                licenseKey: licenseKey?.value || '',
                s3Config: {
                    bucket: s3Bucket?.value || '',
                    region: s3Region?.value || '',
                    accessKeyId: s3AccessKey?.value || '',
                    secretAccessKey: s3SecretKey?.value || '',
                },
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

    setS3Config: async (config) => {
        await Promise.all([
            db.settings.put({ key: 's3_bucket', value: config.bucket }),
            db.settings.put({ key: 's3_region', value: config.region }),
            db.settings.put({ key: 's3_access_key', value: config.accessKeyId }),
            db.settings.put({ key: 's3_secret_key', value: config.secretAccessKey }),
        ]);
        set({ s3Config: config });
    },
}));
