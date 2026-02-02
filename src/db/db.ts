import Dexie, { type Table } from 'dexie';

export interface Expense {
    id: string;
    name: string;
    amount: number;
    category: string;
    tags: string[];
    timestamp: Date;
    createdAt?: Date;
    updatedAt?: Date;
    notes?: string;
    paymentMethod: string;
    isTaxDeductible: boolean;
    receiptUrl?: string;
    localReceipt?: Blob;
    recurringExpenseId?: string;  // Foreign Key to RecurringExpense
    isRecurringInstance?: boolean; // Flag for UI logic
}

export interface Budget {
    id: string;
    category: string;
    limit: number;
    monthPeriod: string; // YYYY-MM
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Setting {
    key: string;
    value: string;
}

export interface Receipt {
    id: string;              // UUID
    userId: string;          // License ID
    storageKey: string;           // Storage key
    merchantName: string;    // Extracted merchant name
    receiptDate: string;     // ISO date from receipt
    uploadedAt: Date;        // Upload timestamp
    expenseId?: string;      // Linked expense (null if not confirmed)
}

export interface RecurringExpense {
    id: string;                    // UUID
    userId?: string;               // Optional for multi-user support
    name: string;
    amount: number;                // Can be 0 for variable inputs
    categoryId: string;
    frequency: 'MONTHLY' | 'WEEKLY' | 'YEARLY'; // MVP: UI restricted to MONTHLY
    dayOfMonth: number;            // 1-31
    startDate: string;             // ISO Date (YYYY-MM-DD)
    nextDueDate: string;           // ISO Date (Pre-calculated next occurrence)
    lastActionedDate?: string;     // ISO Date (The DUE DATE of last action)
    lastActionType?: 'PAID' | 'SKIPPED' | 'MISSED';
    snoozedUntil?: string;         // ISO Date. If present AND > Today, hide reminder
    isActive: boolean;
    createdAt: string;             // ISO Date
    updatedAt: string;             // ISO Date
}

export class FinanceDB extends Dexie {
    expenses!: Table<Expense>;
    budgets!: Table<Budget>;
    settings!: Table<Setting>;
    receipts!: Table<Receipt>;
    recurringExpenses!: Table<RecurringExpense>;

    constructor() {
        super('FinanceDB');
        this.version(1).stores({
            expenses: 'id, name, amount, category, *tags, timestamp',
            budgets: 'id, category, monthPeriod',
            settings: 'key'
        });

        // Version 2: Add createdAt/updatedAt
        // Note: New fields don't strictly require a schema change in Dexie if not indexed,
        // but we might want to index them later. For now, we just declare the version.
        this.version(2).stores({
            expenses: 'id, name, amount, category, *tags, timestamp, createdAt',
            budgets: 'id, category, monthPeriod'
        });

        // Version 3: Add receipts table
        this.version(3).stores({
            expenses: 'id, name, amount, category, *tags, timestamp, createdAt',
            budgets: 'id, category, monthPeriod',
            settings: 'key',
            receipts: 'id, userId, uploadedAt, expenseId'
        });

        // Version 4: Add recurring_expenses table
        this.version(4).stores({
            expenses: 'id, name, amount, category, *tags, timestamp, createdAt',
            budgets: 'id, category, monthPeriod',
            settings: 'key',
            receipts: 'id, userId, uploadedAt, expenseId',
            recurringExpenses: 'id, isActive, nextDueDate, snoozedUntil'
        });

        // Add hooks to track data modification
        this.expenses.hook('creating', () => this.updateModificationTime());
        this.expenses.hook('updating', () => this.updateModificationTime());
        this.expenses.hook('deleting', () => this.updateModificationTime());

        this.receipts.hook('creating', () => this.updateModificationTime());
        this.receipts.hook('updating', () => this.updateModificationTime());
        this.receipts.hook('deleting', () => this.updateModificationTime());

        this.budgets.hook('creating', () => this.updateModificationTime());
        this.budgets.hook('updating', () => this.updateModificationTime());
        this.budgets.hook('deleting', () => this.updateModificationTime());

        this.recurringExpenses.hook('creating', () => this.updateModificationTime());
        this.recurringExpenses.hook('updating', () => this.updateModificationTime());
        this.recurringExpenses.hook('deleting', () => this.updateModificationTime());
    }

    private updateModificationTime() {
        // We use a debounce or just fire-and-forget?
        // Dexie hooks are sync/async. We can just fire a put to settings.
        // Needs to avoid infinite loop if we track settings too.
        // Luckily we don't hook settings.
        this.settings.put({ key: 'data_modified_at', value: new Date().toISOString() });
    }
}


export const db = new FinanceDB();
