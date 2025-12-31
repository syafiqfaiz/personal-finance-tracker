import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('s3Service', () => {
    let s3Service: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    let PutObjectCommandMock: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    let mockSend: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    let db: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    const config = {
        bucket: 'test-bucket',
        region: 'us-east-1',
        accessKeyId: 'key',
        secretAccessKey: 'secret'
    };

    beforeEach(async () => {
        vi.resetModules();
        mockSend = vi.fn().mockResolvedValue({});

        // Use a class for constructor compatibility
        class MockS3Client {
            send = mockSend;
        }

        PutObjectCommandMock = vi.fn();

        // Mock S3
        vi.doMock('@aws-sdk/client-s3', () => ({
            S3Client: MockS3Client,
            PutObjectCommand: PutObjectCommandMock
        }));

        // Mock DB
        vi.doMock('../db/db', () => ({
            db: {
                expenses: { toArray: vi.fn(() => Promise.resolve([])) },
                budgets: { toArray: vi.fn(() => Promise.resolve([])) },
                settings: { get: vi.fn(() => Promise.resolve({ value: '[]' })) }
            }
        }));

        const module = await import('./s3Service');
        s3Service = module;
        const dbModule = await import('../db/db');
        db = dbModule.db;

    });

    describe('uploadToS3', () => {
        it('uploads file successfully', async () => {
            await s3Service.uploadToS3(config, 'file.txt', 'content');

            // Expect mockSend to be called (instance method)
            expect(mockSend).toHaveBeenCalled();
            expect(PutObjectCommandMock).toHaveBeenCalledWith(expect.objectContaining({
                Bucket: 'test-bucket',
                Key: 'file.txt',
                Body: 'content'
            }));
        });
    });

    describe('performFullBackup', () => {
        it('fetches data and uploads backup', async () => {
            // Setup DB returns
            db.expenses.toArray.mockResolvedValue([{ id: '1', amount: 10 }]);
            db.budgets.toArray.mockResolvedValue([{ id: 'b1' }]);
            db.settings.get.mockResolvedValue({ value: JSON.stringify(['Food']) });

            await s3Service.performFullBackup(config);

            expect(db.expenses.toArray).toHaveBeenCalled();
            expect(mockSend).toHaveBeenCalled();

            const callArgs = PutObjectCommandMock.mock.calls[0][0];
            const body = JSON.parse(callArgs.Body);
            expect(body.data.expenses).toHaveLength(1);
            expect(body.data.budgets).toHaveLength(1);
            expect(body.data.categories).toContain('Food');
        });
    });

    describe('uploadReceiptToS3', () => {
        it('uploads blob with correct content type', async () => {
            const blob = new Blob(['test'], { type: 'image/jpeg' });
            const key = await s3Service.uploadReceiptToS3(config, 'exp-123', blob);

            expect(key).toContain('exp-123');
            expect(PutObjectCommandMock).toHaveBeenCalledWith(expect.objectContaining({
                ContentType: 'image/jpeg'
            }));
        });
    });
});
