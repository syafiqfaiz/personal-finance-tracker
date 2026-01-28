import { useSettingsStore } from '../store/useSettingsStore';

interface ExtractionResult {
    response_text: string;
    captured_data: {
        name: string | null;
        amount: number | null;
        category: string | null;
        payment_method: string | null;
        date: string | null;
        notes: string | null;
        confidence: 'high' | 'low' | null;
        missing_fields: string[] | null;
    };
    usage?: {
        remaining: number;
    };
}

export const API_BASE_url = import.meta.env.VITE_API_BASE_URL || '/api';


export const api = {
    extractExpenses: async (
        rawText: string,
        categories: string[],
        currentDate: string,
        availablePaymentMethods: string[],
        capturedData?: ExtractionResult['captured_data']
    ): Promise<ExtractionResult> => {
        const { licenseKey } = useSettingsStore.getState();

        if (!licenseKey) {
            throw new Error('LICENSE_REQUIRED');
        }

        const response = await fetch(`${API_BASE_url}/ai/extract`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-License-Key': licenseKey,
            },
            body: JSON.stringify({
                raw_text: rawText,
                categories,
                current_date: currentDate,
                available_payment_method: availablePaymentMethods,
                captured_data: capturedData,
            }),
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('INVALID_LICENSE'); // Could be missing or invalid/expired
            }
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'EXTRACTION_FAILED');
        }

        return response.json();
    },

    getUploadUrl: async (filename: string, contentType: string): Promise<{ url: string; key: string }> => {
        const { licenseKey } = useSettingsStore.getState();

        if (!licenseKey) {
            throw new Error('LICENSE_REQUIRED');
        }

        const response = await fetch(`${API_BASE_url}/storage/upload-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-License-Key': licenseKey,
            },
            body: JSON.stringify({
                filename,
                contentType: contentType
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'UPLOAD_URL_FAILED');
        }

        return response.json();
    },

    extractFromReceipt: async (
        storageKey: string,
        categories: string[],
        currentDate: string,
        availablePaymentMethods: string[]
    ): Promise<{
        response_text: string;
        captured_data: ExtractionResult['captured_data'];
        receipt_metadata: {
            storage_key: string;
            merchant_name: string;
            receipt_date: string;
        };
        usage: {
            remaining: number;
        };
    }> => {
        const { licenseKey } = useSettingsStore.getState();

        if (!licenseKey) {
            throw new Error('LICENSE_REQUIRED');
        }

        const response = await fetch(`${API_BASE_url}/ai/extract-from-receipt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-License-Key': licenseKey,
            },
            body: JSON.stringify({
                storage_key: storageKey,
                categories,
                current_date: currentDate,
                available_payment_method: availablePaymentMethods,
            }),
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('INVALID_LICENSE');
            }
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'RECEIPT_EXTRACTION_FAILED');
        }

        return response.json();
    },

    getViewUrl: async (storageKey: string): Promise<string> => { // Changed s3Key to storageKey
        const { licenseKey } = useSettingsStore.getState();

        if (!licenseKey) {
            throw new Error('LICENSE_REQUIRED');
        }

        const response = await fetch(`${API_BASE_url}/storage/view-url?key=${encodeURIComponent(storageKey)}`, {
            method: 'GET',
            headers: {
                'X-License-Key': licenseKey,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'VIEW_URL_FAILED');
        }

        const data = await response.json();
        return data.url;
    },
};
