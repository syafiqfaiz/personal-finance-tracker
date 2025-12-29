import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseService } from './ExpenseService';
import { db } from '../db/db';
import { uploadReceiptToS3 } from './s3Service';

// Mock dependencies
vi.mock('./s3Service');
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid')
}));

describe('ExpenseService', () => {
  const mockS3Config = {
    bucket: 'test-bucket',
    region: 'us-east-1',
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addExpense', () => {
    it('adds expense to local DB', async () => {
      const expenseData = {
        name: 'Test Expense',
        amount: 100,
        category: 'Food',
        timestamp: new Date(),
        tags: [],
        paymentMethod: 'Cash',
        isTaxDeductible: false
      };

      const result = await ExpenseService.addExpense(expenseData, mockS3Config);

      expect(db.expenses.add).toHaveBeenCalled();
      expect(result.id).toBe('mock-uuid');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('uploads receipt to S3 if provided', async () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      const expenseData = {
        name: 'Receipt Expense',
        amount: 50,
        category: 'Food',
        timestamp: new Date(),
        tags: [],
        paymentMethod: 'Card',
        isTaxDeductible: true,
        localReceipt: blob
      };

      vi.mocked(uploadReceiptToS3).mockResolvedValue('receipts/mock-uuid.jpg');

      await ExpenseService.addExpense(expenseData, mockS3Config);

      expect(uploadReceiptToS3).toHaveBeenCalledWith(mockS3Config, 'mock-uuid', blob);
      expect(db.expenses.update).toHaveBeenCalledWith('mock-uuid', expect.objectContaining({
        receiptUrl: 'receipts/mock-uuid.jpg'
      }));
    });

    it('handles S3 upload failure gracefully', async () => {
      const expenseData = {
        name: 'Failed Upload',
        amount: 50,
        category: 'Food',
        timestamp: new Date(),
        tags: [],
        paymentMethod: 'Card',
        isTaxDeductible: true,
        localReceipt: new Blob(['test'], { type: 'image/jpeg' })
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      vi.mocked(uploadReceiptToS3).mockRejectedValue(new Error('S3 Error'));

      const result = await ExpenseService.addExpense(expenseData, mockS3Config);

      // Should still create expense locally
      expect(db.expenses.add).toHaveBeenCalled();
      expect(result.id).toBe('mock-uuid');
      // Should verify error logged
      expect(consoleSpy).toHaveBeenCalledWith('S3 Receipt upload failed:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('updateExpense', () => {
    it('updates expense and timestamp in local DB', async () => {
      const updates = { amount: 200 };
      await ExpenseService.updateExpense('test-id', updates, mockS3Config);

      expect(db.expenses.update).toHaveBeenCalledWith('test-id', expect.objectContaining({
        amount: 200,
        updatedAt: expect.any(Date)
      }));
    });

    it('uploads new receipt during update', async () => {
      const updates = {
        amount: 200,
        localReceipt: new Blob(['updated'], { type: 'image/png' })
      };
      vi.mocked(uploadReceiptToS3).mockResolvedValue('receipts/updated.png');

      const result = await ExpenseService.updateExpense('test-id', updates, mockS3Config);

      expect(uploadReceiptToS3).toHaveBeenCalledWith(mockS3Config, 'test-id', updates.localReceipt);
      expect(db.expenses.update).toHaveBeenCalledWith('test-id', expect.objectContaining({
        receiptUrl: 'receipts/updated.png'
      }));
      expect(result.receiptUrl).toBe('receipts/updated.png');
    });

    it('handles S3 upload failure during update gracefully', async () => {
      const updates = {
        localReceipt: new Blob(['fail'], { type: 'image/png' })
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      vi.mocked(uploadReceiptToS3).mockRejectedValue(new Error('Update S3 Error'));

      await ExpenseService.updateExpense('test-id', updates, mockS3Config);

      expect(consoleSpy).toHaveBeenCalledWith('S3 Receipt upload failed:', expect.any(Error));
      // Should still propagate timestamps but not receiptUrl
      expect(db.expenses.update).toHaveBeenCalledWith('test-id', expect.objectContaining({
        updatedAt: expect.any(Date)
      }));

      consoleSpy.mockRestore();
    });
  });

  describe('deleteExpense', () => {
    it('deletes expense from local DB', async () => {
      await ExpenseService.deleteExpense('delete-id');
      expect(db.expenses.delete).toHaveBeenCalledWith('delete-id');
    });
  });
});
