/// <reference types="@cloudflare/workers-types" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from './storageService';

// Use vi.hoisted to prevent ReferenceError
const mocks = vi.hoisted(() => ({
    send: vi.fn(),
    getSignedUrl: vi.fn()
}));

vi.mock('@aws-sdk/client-s3', () => ({
    S3Client: class {
        send = mocks.send;
    },
    PutObjectCommand: class { },
    GetObjectCommand: class { }
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: mocks.getSignedUrl
}));

describe('StorageService', () => {
    let service: StorageService;
    let mockS3: any;

    beforeEach(async () => {
        const { S3Client } = await import('@aws-sdk/client-s3');
        mockS3 = new (vi.mocked(S3Client))({});
        service = new StorageService(mockS3, 'test-bucket');
        vi.resetAllMocks();
    });

    it('should generate upload URL and return key', async () => {
        mocks.getSignedUrl.mockResolvedValue('https://s3.aws.com/presigned-upload');

        const result = await service.generateUploadUrl('user-123', 'receipt.jpg', 'image/jpeg');

        expect(result.url).toBe('https://s3.aws.com/presigned-upload');
        expect(result.key).toMatch(/user_storage\/user-123\/receipts\/\d{4}\/\d{4}-\d{2}\/receipt\.jpg/);
        expect(mocks.getSignedUrl).toHaveBeenCalled();
    });

    it('should reject invalid file types', async () => {
        await expect(service.generateUploadUrl('user-123', 'malware.exe', 'application/x-msdownload'))
            .rejects.toThrow('Invalid file type');
    });

    it('should sanitize filename path traversal', async () => {
        // Prevent ../../etc/passwd
        await expect(service.generateUploadUrl('user-123', '../../secret.txt', 'text/plain'))
            .rejects.toThrow('Invalid filename');
    });

    it('should generate view URL for valid key', async () => {
        mocks.getSignedUrl.mockResolvedValue('https://s3.aws.com/presigned-view');

        const key = 'user_storage/user-123/receipts/2026/01/receipt.jpg';
        const url = await service.generateViewUrl('user-123', key);

        expect(url).toBe('https://s3.aws.com/presigned-view');
        expect(mocks.getSignedUrl).toHaveBeenCalled();
    });

    it('should reject view URL for different user key', async () => {
        const key = 'user_storage/other-user/receipts/2026/01/receipt.jpg';
        await expect(service.generateViewUrl('user-123', key))
            .rejects.toThrow('Access denied');
    });
});
