import { create } from 'zustand';
import { db, type Expense, type Budget } from '../db/db';
export type { Expense, Budget };
import { v4 as uuidv4 } from 'uuid';
import { useSettingsStore } from './useSettingsStore';
import { uploadReceiptToS3 } from '../services/s3Service';

interface FinanceState {
    expenses: Expense[];
    budgets: Budget[];
    categories: string[];
    categoryIcons: Record<string, string>; // Map category name -> icon name
    isLoading: boolean;

    // Actions
    loadAppData: () => Promise<void>;
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;

    addCategory: (name: string, icon?: string) => Promise<void>;
    updateCategoryIcon: (name: string, icon: string) => Promise<void>;
    deleteCategory: (name: string) => Promise<void>;
    renameCategory: (oldName: string, newName: string) => Promise<void>;
    upsertBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
}

export const DEFAULT_CATEGORIES = [
    'Food',
    'Transport',
    'Rent',
    'Groceries',
    'Entertainment',
    'Healthcare',
    'Others'
];

export const SYSTEM_CATEGORY = 'Uncategorized';
export const DEFAULT_ICON = 'Tag';

export const useFinanceStore = create<FinanceState>((set, get) => ({
    expenses: [],
    budgets: [],
    categories: [],
    categoryIcons: {},
    isLoading: true,

    loadAppData: async () => {
        set({ isLoading: true });

        // Load data
        const [expenses, budgets] = await Promise.all([
            db.expenses.toArray(),
            db.budgets.toArray()
        ]);

        // Load settings
        const settingsArray = await db.settings.toArray();
        const settingsMap = settingsArray.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, any>);

        const savedCategories = settingsMap['categories']
            ? JSON.parse(settingsMap['categories'])
            : [SYSTEM_CATEGORY, 'Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Health'];

        const savedIcons = settingsMap['categoryIcons']
            ? JSON.parse(settingsMap['categoryIcons'])
            : {};

        set({
            expenses: expenses.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
            budgets,
            categories: savedCategories,
            categoryIcons: savedIcons,
            isLoading: false
        });
    },

    addExpense: async (expenseData) => {
        const id = uuidv4();
        const newExpense = { ...expenseData, id };
        await db.expenses.add(newExpense);
        set((state) => ({
            expenses: [newExpense, ...state.expenses].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        }));

        // Handle S3 Upload if configured
        const { s3Config } = useSettingsStore.getState();
        if (s3Config.accessKeyId && expenseData.localReceipt) {
            try {
                const s3Key = await uploadReceiptToS3(s3Config, id, expenseData.localReceipt);
                await db.expenses.update(id, { receiptUrl: s3Key });
                set((state) => ({
                    expenses: state.expenses.map(e => e.id === id ? { ...e, receiptUrl: s3Key } : e)
                }));
            } catch (err) {
                console.error('S3 Receipt upload failed:', err);
            }
        }
    },

    updateExpense: async (id, updates) => {
        await db.expenses.update(id, updates);
        set((state) => ({
            expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e))
        }));

        // Handle S3 Upload if a new local receipt was added/changed
        const { s3Config } = useSettingsStore.getState();
        if (s3Config.accessKeyId && updates.localReceipt) {
            try {
                const s3Key = await uploadReceiptToS3(s3Config, id, updates.localReceipt);
                await db.expenses.update(id, { receiptUrl: s3Key });
                set((state) => ({
                    expenses: state.expenses.map(e => e.id === id ? { ...e, receiptUrl: s3Key } : e)
                }));
            } catch (err) {
                console.error('S3 Receipt upload failed:', err);
            }
        }
    },

    deleteExpense: async (id) => {
        await db.expenses.delete(id);
        set((state) => ({
            expenses: state.expenses.filter((e) => e.id !== id)
        }));
    },

    addCategory: async (name, icon = DEFAULT_ICON) => {
        const { categories, categoryIcons } = get();
        if (categories.includes(name)) return;

        const newCategories = [...categories, name];
        const newIcons = { ...categoryIcons, [name]: icon };

        await db.settings.put({ key: 'categories', value: JSON.stringify(newCategories) });
        await db.settings.put({ key: 'categoryIcons', value: JSON.stringify(newIcons) });

        set({ categories: newCategories, categoryIcons: newIcons });
    },

    updateCategoryIcon: async (name, icon) => {
        const { categoryIcons } = get();
        const newIcons = { ...categoryIcons, [name]: icon };
        await db.settings.put({ key: 'categoryIcons', value: JSON.stringify(newIcons) });
        set({ categoryIcons: newIcons });
    },

    deleteCategory: async (name) => {
        if (name === SYSTEM_CATEGORY) return;

        const { categories, expenses, budgets, categoryIcons } = get();
        const newCategories = categories.filter((c) => c !== name);

        // Remove icon
        const newIcons = { ...categoryIcons };
        delete newIcons[name];

        // Move expenses to Uncategorized
        const relatedExpenses = expenses.filter((e) => e.category === name);
        await Promise.all(
            relatedExpenses.map((e) => db.expenses.update(e.id, { category: SYSTEM_CATEGORY }))
        );

        // Delete associated budgets
        const relatedBudgets = budgets.filter((b) => b.category === name);
        await Promise.all(
            relatedBudgets.map((b) => db.budgets.delete(b.id))
        );

        await db.settings.put({ key: 'categories', value: JSON.stringify(newCategories) });
        await db.settings.put({ key: 'categoryIcons', value: JSON.stringify(newIcons) });

        set({
            categories: newCategories,
            categoryIcons: newIcons,
            expenses: expenses.map((e) => e.category === name ? { ...e, category: SYSTEM_CATEGORY } : e),
            budgets: budgets.filter((b) => b.category !== name)
        });
    },

    renameCategory: async (oldName, newName) => {
        if (!oldName || !newName || oldName === newName) return;
        const { categories, expenses, budgets, categoryIcons } = get();

        // 1. Update Categories List & Icons
        let newCategories = [...categories];
        let newIcons = { ...categoryIcons };
        const icon = newIcons[oldName] || DEFAULT_ICON;

        if (!categories.includes(newName)) {
            newCategories = categories.map(c => c === oldName ? newName : c);
            newIcons[newName] = icon;
            delete newIcons[oldName];
        } else {
            // Target exists, just remove old one (merge)
            newCategories = categories.filter(c => c !== oldName);
            // newName keeps its own icon, oldName's icon is discarded
            delete newIcons[oldName];
        }

        await db.settings.put({ key: 'categories', value: JSON.stringify(newCategories) });
        await db.settings.put({ key: 'categoryIcons', value: JSON.stringify(newIcons) });

        // 2. Migrate Expenses
        const relatedExpenses = expenses.filter(e => e.category === oldName);
        if (relatedExpenses.length > 0) {
            await Promise.all(
                relatedExpenses.map(e => db.expenses.update(e.id, { category: newName }))
            );
        }

        // 3. Migrate Budgets
        const relatedBudgets = budgets.filter(b => b.category === oldName);
        if (relatedBudgets.length > 0) {
            await Promise.all(
                relatedBudgets.map(b => db.budgets.update(b.id, { category: newName }))
            );
        }

        set({
            categories: newCategories,
            categoryIcons: newIcons,
            expenses: expenses.map(e => e.category === oldName ? { ...e, category: newName } : e),
            budgets: budgets.map(b => b.category === oldName ? { ...b, category: newName } : b)
        });
    },

    upsertBudget: async (budgetData) => {
        const { budgets } = get();
        const existing = budgets.find(
            (b) => b.category === budgetData.category && b.monthPeriod === budgetData.monthPeriod
        );

        if (existing) {
            await db.budgets.update(existing.id, { limit: budgetData.limit });
            set({
                budgets: budgets.map((b) => b.id === existing.id ? { ...b, limit: budgetData.limit } : b)
            });
        } else {
            const id = uuidv4();
            const newBudget = { ...budgetData, id };
            await db.budgets.add(newBudget);
            set({ budgets: [...budgets, newBudget] });
        }
    }
}));
