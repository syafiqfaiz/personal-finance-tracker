import { describe, it, expect, beforeEach } from 'vitest';
import { receiptOperations } from './receiptOperations';
import { db } from './db';

describe('receiptOperations', () => {
    const testUserId = 'test-user-123';
    const testS3Key = 'user_storage/test-user-123/receipts/2026/2026-01/receipt.jpg';

    beforeEach(async () => {
        // Clear receipts table before each test
        try {
            await db.receipts.clear();
        } catch (error) {
            // Table might not exist yet, that's okay
            console.log('Receipts table not yet initialized');
        }
    });

    it('should create a receipt', async () => {
        const receiptId = await receiptOperations.create({
            userId: testUserId,
            s3Key: testS3Key,
            merchantName: 'Starbucks',
            receiptDate: '2026-01-25'
        });

        expect(receiptId).toBeDefined();
        expect(typeof receiptId).toBe('string');

        const receipt = await receiptOperations.getById(receiptId);
        expect(receipt).toBeDefined();
        expect(receipt?.userId).toBe(testUserId);
        expect(receipt?.merchantName).toBe('Starbucks');
    });

    it('should get receipt by ID', async () => {
        const receiptId = await receiptOperations.create({
            userId: testUserId,
            s3Key: testS3Key,
            merchantName: 'KFC',
            receiptDate: '2026-01-24'
        });

        const receipt = await receiptOperations.getById(receiptId);
        expect(receipt).toBeDefined();
        expect(receipt?.id).toBe(receiptId);
        expect(receipt?.merchantName).toBe('KFC');
    });

    it('should link receipt to expense', async () => {
        const receiptId = await receiptOperations.create({
            userId: testUserId,
            s3Key: testS3Key,
            merchantName: 'Guardian',
            receiptDate: '2026-01-23'
        });

        const expenseId = 'expense-123';
        await receiptOperations.linkToExpense(receiptId, expenseId);

        const receipt = await receiptOperations.getById(receiptId);
        expect(receipt?.expenseId).toBe(expenseId);
    });

    it('should get receipt by expense ID', async () => {
        const receiptId = await receiptOperations.create({
            userId: testUserId,
            s3Key: testS3Key,
            merchantName: 'Mamak Corner',
            receiptDate: '2026-01-22'
        });

        const expenseId = 'expense-456';
        await receiptOperations.linkToExpense(receiptId, expenseId);

        const receipt = await receiptOperations.getByExpenseId(expenseId);
        expect(receipt).toBeDefined();
        expect(receipt?.id).toBe(receiptId);
        expect(receipt?.merchantName).toBe('Mamak Corner');
    });

    it('should get orphaned receipts', async () => {
        // Create linked receipt
        const linkedId = await receiptOperations.create({
            userId: testUserId,
            s3Key: testS3Key,
            merchantName: 'Linked Receipt',
            receiptDate: '2026-01-21'
        });
        await receiptOperations.linkToExpense(linkedId, 'expense-789');

        // Create orphaned receipt
        await receiptOperations.create({
            userId: testUserId,
            s3Key: testS3Key + '2',
            merchantName: 'Orphaned Receipt',
            receiptDate: '2026-01-20'
        });

        const orphaned = await receiptOperations.getOrphanedReceipts(testUserId);
        expect(orphaned.length).toBe(1);
        expect(orphaned[0].merchantName).toBe('Orphaned Receipt');
    });

    it('should delete a receipt', async () => {
        const receiptId = await receiptOperations.create({
            userId: testUserId,
            s3Key: testS3Key,
            merchantName: 'To Delete',
            receiptDate: '2026-01-19'
        });

        await receiptOperations.delete(receiptId);

        const receipt = await receiptOperations.getById(receiptId);
        expect(receipt).toBeUndefined();
    });

    it('should get all receipts by user', async () => {
        await receiptOperations.create({
            userId: testUserId,
            s3Key: testS3Key + '1',
            merchantName: 'Receipt 1',
            receiptDate: '2026-01-18'
        });

        await receiptOperations.create({
            userId: testUserId,
            s3Key: testS3Key + '2',
            merchantName: 'Receipt 2',
            receiptDate: '2026-01-17'
        });

        await receiptOperations.create({
            userId: 'other-user',
            s3Key: 'other-key',
            merchantName: 'Other User Receipt',
            receiptDate: '2026-01-16'
        });

        const userReceipts = await receiptOperations.getAllByUser(testUserId);
        expect(userReceipts.length).toBe(2);
    });

    it('should only match the specified field in where() queries', async () => {
        // Create a receipt where merchantName contains a userId-like value
        await receiptOperations.create({
            userId: 'real-user-id',
            s3Key: testS3Key,
            merchantName: 'test-user-123', // This matches testUserId but in wrong field
            receiptDate: '2026-01-15'
        });

        // Create a receipt with correct userId
        await receiptOperations.create({
            userId: testUserId, // 'test-user-123'
            s3Key: testS3Key + '2',
            merchantName: 'Correct Receipt',
            receiptDate: '2026-01-14'
        });

        // Should only return the receipt where userId field matches
        const userReceipts = await receiptOperations.getAllByUser(testUserId);
        expect(userReceipts.length).toBe(1);
        expect(userReceipts[0].merchantName).toBe('Correct Receipt');
        expect(userReceipts[0].userId).toBe(testUserId);
    });
});
