import { create } from 'zustand';
import { db } from '../db/db';

interface SettingsState {
    geminiKey: string;
    userName: string;
    s3Config: {
        bucket: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
    };
    isLoading: boolean;
    setGeminiKey: (key: string) => Promise<void>;
    setUserName: (name: string) => Promise<void>;
    setS3Config: (config: SettingsState['s3Config']) => Promise<void>;
    loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    geminiKey: '',
    userName: '',
    s3Config: {
        bucket: '',
        region: '',
        accessKeyId: '',
        secretAccessKey: '',
    },
    isLoading: true,

    loadSettings: async () => {
        set({ isLoading: true });
        const geminiKey = await db.settings.get('gemini_key');
        const userName = await db.settings.get('user_name');
        const s3Bucket = await db.settings.get('s3_bucket');
        const s3Region = await db.settings.get('s3_region');
        const s3AccessKey = await db.settings.get('s3_access_key');
        const s3SecretKey = await db.settings.get('s3_secret_key');

        set({
            geminiKey: geminiKey?.value || '',
            userName: userName?.value || '',
            s3Config: {
                bucket: s3Bucket?.value || '',
                region: s3Region?.value || '',
                accessKeyId: s3AccessKey?.value || '',
                secretAccessKey: s3SecretKey?.value || '',
            },
            isLoading: false,
        });
    },

    setGeminiKey: async (value: string) => {
        await db.settings.put({ key: 'gemini_key', value });
        set({ geminiKey: value });
    },

    setUserName: async (value: string) => {
        await db.settings.put({ key: 'user_name', value });
        set({ userName: value });
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
