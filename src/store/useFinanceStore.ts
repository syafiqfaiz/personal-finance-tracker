import { create } from 'zustand';
import { db, type Expense, type Budget } from '../db/db';
export type { Expense, Budget };
import { v4 as uuidv4 } from 'uuid';
import { useSettingsStore } from './useSettingsStore';
import { CategoryService } from '../services/CategoryService';
import { ExpenseService } from '../services/ExpenseService';

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

        // MIGRATION: Backfill missing timestamps
        const expensesToUpdate: Expense[] = [];
        const migratedExpenses = expenses.map(e => {
            if (!e.createdAt) {
                const updated = {
                    ...e,
                    createdAt: e.timestamp, // Default to transaction time
                    updatedAt: e.timestamp
                };
                expensesToUpdate.push(updated);
                return updated;
            }
            return e;
        });

        if (expensesToUpdate.length > 0) {
            console.log(`Migrating ${expensesToUpdate.length} expenses with missing timestamps...`);
            // Lazy update in background
            Promise.all(expensesToUpdate.map(e => db.expenses.update(e.id, { createdAt: e.createdAt, updatedAt: e.updatedAt })))
                .catch(err => console.error('Migration failed', err));
        }

        // Sorting Logic: 
        // 1. Transaction Date (descending)
        // 2. Created At (descending) - for same day entries
        const sortExpenses = (list: Expense[]) => {
            return list.sort((a, b) => {
                const dateDiff = (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0);
                if (dateDiff !== 0) return dateDiff;
                const createdA = a.createdAt?.getTime() || 0;
                const createdB = b.createdAt?.getTime() || 0;
                return createdB - createdA;
            });
        };

        // Load settings
        const settingsArray = await db.settings.toArray();
        const settingsMap = settingsArray.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        const savedCategories = settingsMap['categories']
            ? JSON.parse(settingsMap['categories'])
            : [SYSTEM_CATEGORY, 'Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Health'];

        const savedIcons = settingsMap['categoryIcons']
            ? JSON.parse(settingsMap['categoryIcons'])
            : {};

        set({
            expenses: sortExpenses(migratedExpenses),
            budgets,
            categories: savedCategories,
            categoryIcons: savedIcons,
            isLoading: false
        });
    },

    addExpense: async (expenseData) => {
        const { s3Config } = useSettingsStore.getState();
        const newExpense = await ExpenseService.addExpense(expenseData, s3Config);

        set((state) => {
            const list = [newExpense, ...state.expenses];
            // Re-sort using same logic
            return {
                expenses: list.sort((a, b) => {
                    const dateDiff = (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0);
                    if (dateDiff !== 0) return dateDiff;
                    const createdA = a.createdAt?.getTime() || 0;
                    const createdB = b.createdAt?.getTime() || 0;
                    return createdB - createdA;
                })
            };
        });
    },

    updateExpense: async (id, updates) => {
        const { s3Config } = useSettingsStore.getState();
        const updatedFields = await ExpenseService.updateExpense(id, updates, s3Config);

        set((state) => ({
            expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updatedFields } : e))
        }));
    },

    deleteExpense: async (id) => {
        await ExpenseService.deleteExpense(id);
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
        const { categories, categoryIcons, expenses, budgets } = get();
        const result = await CategoryService.deleteCategory(name, categories, categoryIcons);

        set({
            categories: result.categories,
            categoryIcons: result.icons,
            // Optimistically update expenses and budgets in memory since service handled DB
            expenses: expenses.map((e) => e.category === name ? { ...e, category: SYSTEM_CATEGORY } : e),
            budgets: budgets.filter((b) => b.category !== name)
        });
    },

    renameCategory: async (oldName, newName) => {
        const { categories, categoryIcons, expenses, budgets } = get();
        const result = await CategoryService.renameCategory(oldName, newName, categories, categoryIcons);

        set({
            categories: result.categories,
            categoryIcons: result.icons,
            expenses: expenses.map(e => e.category === oldName ? { ...e, category: newName } : e),
            budgets: budgets.map(b => b.category === oldName ? { ...b, category: newName } : b)
        });
    },

    upsertBudget: async (budgetData) => {
        const { budgets } = get();
        const existing = budgets.find(
            (b) => b.category === budgetData.category && b.monthPeriod === budgetData.monthPeriod
        );

        const now = new Date();

        if (existing) {
            await db.budgets.update(existing.id, {
                limit: budgetData.limit,
                updatedAt: now
            });
            set({
                budgets: budgets.map((b) => b.id === existing.id ? { ...b, limit: budgetData.limit, updatedAt: now } : b)
            });
        } else {
            const id = uuidv4();
            const newBudget = {
                ...budgetData,
                id,
                createdAt: now,
                updatedAt: now
            };
            await db.budgets.add(newBudget);
            set({ budgets: [...budgets, newBudget] });
        }
    }
}));
