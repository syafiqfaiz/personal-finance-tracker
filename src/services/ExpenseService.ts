import { db, type Expense } from '../db/db';
import { v4 as uuidv4 } from 'uuid';


export const ExpenseService = {
    async addExpense(expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
        const id = uuidv4();
        const now = new Date();
        const newExpense: Expense = {
            ...expenseData,
            id,
            createdAt: now,
            updatedAt: now
        };

        // 1. Add to Local DB
        await db.expenses.add(newExpense);

        return newExpense;
    },

    async updateExpense(id: string, updates: Partial<Expense>): Promise<Partial<Expense>> {
        const timestampUpdates = {
            ...updates,
            updatedAt: new Date()
        };

        // 1. Update Local DB
        await db.expenses.update(id, timestampUpdates);

        return timestampUpdates;
    },

    async deleteExpense(id: string): Promise<void> {
        await db.expenses.delete(id);
        // Note: We might want to delete the storage object here too in the future
    }
};
