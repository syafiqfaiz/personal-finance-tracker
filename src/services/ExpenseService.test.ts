import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseService } from './ExpenseService';
import { db } from '../db/db';
// Mock dependencies
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid')
}));

describe('ExpenseService', () => {
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

      const result = await ExpenseService.addExpense(expenseData);

      expect(db.expenses.add).toHaveBeenCalled();
      expect(result.id).toBe('mock-uuid');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('updateExpense', () => {
    it('updates expense and timestamp in local DB', async () => {
      const updates = { amount: 200 };
      await ExpenseService.updateExpense('test-id', updates);

      expect(db.expenses.update).toHaveBeenCalledWith('test-id', expect.objectContaining({
        amount: 200,
        updatedAt: expect.any(Date)
      }));
    });
  });

  describe('deleteExpense', () => {
    it('deletes expense from local DB', async () => {
      await ExpenseService.deleteExpense('delete-id');
      expect(db.expenses.delete).toHaveBeenCalledWith('delete-id');
    });
  });
});
