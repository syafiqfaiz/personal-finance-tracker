import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, API_BASE_url } from './api';
import { useSettingsStore } from '../store/useSettingsStore';

// Mock useSettingsStore
vi.mock('../store/useSettingsStore', () => ({
    useSettingsStore: {
        getState: vi.fn()
    }
}));

describe('api service', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        global.fetch = fetchMock;
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('extractExpenses', () => {
        it('should successfully extract expenses with valid license', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            const mockResponse = {
                response_text: 'Got it!',
                captured_data: {
                    name: 'KFC',
                    amount: 15,
                    category: 'Food',
                    payment_method: 'Cash',
                    date: '2026-01-26',
                    notes: '',
                    confidence: 'high' as const,
                    missing_fields: []
                },
                usage: { remaining: 99 }
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await api.extractExpenses(
                'KFC 15',
                ['Food', 'Transport'],
                '2026-01-26',
                ['Cash', 'Credit Card']
            );

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_BASE_url}/ai/extract`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-License-Key': 'valid-key'
                    },
                    body: JSON.stringify({
                        raw_text: 'KFC 15',
                        categories: ['Food', 'Transport'],
                        current_date: '2026-01-26',
                        available_payment_method: ['Cash', 'Credit Card'],
                        captured_data: undefined
                    })
                })
            );

            expect(result).toEqual(mockResponse);
        });

        it('should throw LICENSE_REQUIRED when no license key', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: '' });

            await expect(
                api.extractExpenses('test', [], '2026-01-26', [])
            ).rejects.toThrow('LICENSE_REQUIRED');

            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should throw INVALID_LICENSE on 401 response', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'invalid-key' });

            fetchMock.mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({ error: 'Unauthorized' })
            });

            await expect(
                api.extractExpenses('test', [], '2026-01-26', [])
            ).rejects.toThrow('INVALID_LICENSE');
        });

        it('should throw INVALID_LICENSE on 403 response', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'expired-key' });

            fetchMock.mockResolvedValue({
                ok: false,
                status: 403,
                json: async () => ({ error: 'Forbidden' })
            });

            await expect(
                api.extractExpenses('test', [], '2026-01-26', [])
            ).rejects.toThrow('INVALID_LICENSE');
        });

        it('should throw custom error message from API', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({ message: 'AI service unavailable' })
            });

            await expect(
                api.extractExpenses('test', [], '2026-01-26', [])
            ).rejects.toThrow('AI service unavailable');
        });

        it('should throw EXTRACTION_FAILED on error without message', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({})
            });

            await expect(
                api.extractExpenses('test', [], '2026-01-26', [])
            ).rejects.toThrow('EXTRACTION_FAILED');
        });

        it('should include captured_data when provided', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => ({ response_text: 'Updated', captured_data: {} })
            });

            const capturedData = {
                name: 'KFC',
                amount: 15,
                category: 'Food',
                payment_method: 'Cash',
                date: '2026-01-26',
                notes: '',
                confidence: 'high' as const,
                missing_fields: []
            };

            await api.extractExpenses('more details', [], '2026-01-26', [], capturedData);

            expect(fetchMock).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('"captured_data"')
                })
            );
        });
    });

    describe('getUploadUrl', () => {
        it('should successfully get upload URL', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            const mockResponse = {
                url: 'https://s3.amazonaws.com/presigned-upload-url',
                key: 'user_storage/123/receipts/2026/2026-01/receipt.jpg'
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await api.getUploadUrl('receipt.jpg', 'image/jpeg');

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_BASE_url}/storage/upload-url`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-License-Key': 'valid-key'
                    },
                    body: JSON.stringify({
                        filename: 'receipt.jpg',
                        contentType: 'image/jpeg'
                    })
                })
            );

            expect(result).toEqual(mockResponse);
        });

        it('should throw LICENSE_REQUIRED when no license key', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: null });

            await expect(
                api.getUploadUrl('file.jpg', 'image/jpeg')
            ).rejects.toThrow('LICENSE_REQUIRED');

            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should throw custom error message from API', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ message: 'Invalid filename' })
            });

            await expect(
                api.getUploadUrl('../../etc/passwd', 'image/jpeg')
            ).rejects.toThrow('Invalid filename');
        });

        it('should throw UPLOAD_URL_FAILED on error without message', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => { throw new Error('Invalid JSON'); }
            });

            await expect(
                api.getUploadUrl('file.jpg', 'image/jpeg')
            ).rejects.toThrow('UPLOAD_URL_FAILED');
        });
    });

    describe('extractFromReceipt', () => {
        it('should successfully extract from receipt', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            const mockResponse = {
                response_text: 'Receipt processed!',
                captured_data: {
                    name: 'Starbucks',
                    amount: 12.5,
                    category: 'Food',
                    payment_method: 'Credit Card',
                    date: '2026-01-26',
                    notes: 'Coffee',
                    confidence: 'high' as const,
                    missing_fields: []
                },
                receipt_metadata: {
                    storage_key: 'user_storage/123/receipts/2026/2026-01/receipt.jpg',
                    merchant_name: 'Starbucks',
                    receipt_date: '2026-01-26'
                },
                usage: { remaining: 98 }
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await api.extractFromReceipt(
                'user_storage/123/receipts/2026/2026-01/receipt.jpg',
                ['Food', 'Transport'],
                '2026-01-26',
                ['Cash', 'Credit Card']
            );

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_BASE_url}/ai/extract-from-receipt`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-License-Key': 'valid-key'
                    },
                    body: JSON.stringify({
                        storage_key: 'user_storage/123/receipts/2026/2026-01/receipt.jpg',
                        categories: ['Food', 'Transport'],
                        current_date: '2026-01-26',
                        available_payment_method: ['Cash', 'Credit Card']
                    })
                })
            );

            expect(result).toEqual(mockResponse);
        });

        it('should throw LICENSE_REQUIRED when no license key', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: undefined });

            await expect(
                api.extractFromReceipt('s3-key', [], '2026-01-26', [])
            ).rejects.toThrow('LICENSE_REQUIRED');

            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should throw INVALID_LICENSE on 401 response', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'invalid-key' });

            fetchMock.mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({ error: 'Unauthorized' })
            });

            await expect(
                api.extractFromReceipt('s3-key', [], '2026-01-26', [])
            ).rejects.toThrow('INVALID_LICENSE');
        });

        it('should throw INVALID_LICENSE on 403 response', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            fetchMock.mockResolvedValue({
                ok: false,
                status: 403,
                json: async () => ({ error: 'Access denied' })
            });

            await expect(
                api.extractFromReceipt('s3-key', [], '2026-01-26', [])
            ).rejects.toThrow('INVALID_LICENSE');
        });

        it('should throw custom error message from API', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ message: 'Invalid S3 key' })
            });

            await expect(
                api.extractFromReceipt('invalid-key', [], '2026-01-26', [])
            ).rejects.toThrow('Invalid S3 key');
        });

        it('should throw RECEIPT_EXTRACTION_FAILED on error without message', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({})
            });

            await expect(
                api.extractFromReceipt('s3-key', [], '2026-01-26', [])
            ).rejects.toThrow('RECEIPT_EXTRACTION_FAILED');
        });
    });

    describe('getViewUrl', () => {
        it('should successfully get view URL', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            const mockResponse = {
                url: 'https://s3.amazonaws.com/presigned-view-url'
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await api.getViewUrl('user_storage/123/receipts/2026/2026-01/receipt.jpg');

            expect(fetchMock).toHaveBeenCalledWith(
                `${API_BASE_url}/storage/view-url?key=${encodeURIComponent('user_storage/123/receipts/2026/2026-01/receipt.jpg')}`,
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'X-License-Key': 'valid-key'
                    })
                })
            );

            expect(result).toBe('https://s3.amazonaws.com/presigned-view-url');
        });

        it('should throw LICENSE_REQUIRED when no license key', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: '' });

            await expect(
                api.getViewUrl('s3-key')
            ).rejects.toThrow('LICENSE_REQUIRED');

            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should throw custom error message from API', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            fetchMock.mockResolvedValue({
                ok: false,
                status: 403,
                json: async () => ({ message: 'Access denied' })
            });

            await expect(
                api.getViewUrl('user_storage/other-user/file.jpg')
            ).rejects.toThrow('Access denied');
        });

        it('should throw VIEW_URL_FAILED on error without message', async () => {
            (useSettingsStore.getState as any).mockReturnValue({ licenseKey: 'valid-key' });

            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => { throw new Error('Parse error'); }
            });

            await expect(
                api.getViewUrl('s3-key')
            ).rejects.toThrow('VIEW_URL_FAILED');
        });
    });
});
