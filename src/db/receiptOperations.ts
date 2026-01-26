import { db, type Receipt } from './db';
import { v4 as uuidv4 } from 'uuid';

export const receiptOperations = {
    /**
     * Create a new receipt record
     */
    async create(receipt: Omit<Receipt, 'id' | 'uploadedAt'>): Promise<string> {
        const id = uuidv4();
        await db.receipts.add({
            ...receipt,
            id,
            uploadedAt: new Date()
        });
        return id;
    },

    /**
     * Get receipt by ID
     */
    async getById(id: string): Promise<Receipt | undefined> {
        return await db.receipts.get(id);
    },

    /**
     * Get receipt by expense ID
     */
    async getByExpenseId(expenseId: string): Promise<Receipt | undefined> {
        return await db.receipts.where('expenseId').equals(expenseId).first();
    },

    /**
     * Link receipt to an expense
     */
    async linkToExpense(receiptId: string, expenseId: string): Promise<void> {
        await db.receipts.update(receiptId, { expenseId });
    },

    /**
     * Get all orphaned receipts (uploaded but not linked to any expense)
     */
    async getOrphanedReceipts(userId: string): Promise<Receipt[]> {
        return await db.receipts
            .where('userId').equals(userId)
            .and(r => !r.expenseId)
            .toArray();
    },

    /**
     * Delete a receipt
     */
    async delete(id: string): Promise<void> {
        await db.receipts.delete(id);
    },

    /**
     * Get all receipts for a user
     */
    async getAllByUser(userId: string): Promise<Receipt[]> {
        return await db.receipts.where('userId').equals(userId).toArray();
    }
};
