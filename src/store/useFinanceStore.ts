import { create } from 'zustand';
import { db, type Expense, type Budget } from '../db/db';
export type { Expense, Budget };
import { v4 as uuidv4 } from 'uuid';

interface FinanceState {
    expenses: Expense[];
    budgets: Budget[];
    categories: string[];
    isLoading: boolean;

    // Actions
    loadAppData: () => Promise<void>;
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;

    addCategory: (name: string) => Promise<void>;
    deleteCategory: (name: string) => Promise<void>;

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

export const useFinanceStore = create<FinanceState>((set, get) => ({
    expenses: [],
    budgets: [],
    categories: [],
    isLoading: true,

    loadAppData: async () => {
        set({ isLoading: true });

        // Load categories from unique expenses + defaults
        const allExpenses = await db.expenses.toArray();
        const storedCategories = await db.settings.get('categories');
        let categories = storedCategories?.value ? JSON.parse(storedCategories.value) : DEFAULT_CATEGORIES;

        if (!categories.includes(SYSTEM_CATEGORY)) {
            categories.push(SYSTEM_CATEGORY);
        }

        const budgets = await db.budgets.toArray();

        set({
            expenses: allExpenses.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
            budgets,
            categories,
            isLoading: false,
        });
    },

    addExpense: async (expenseData) => {
        const id = uuidv4();
        const newExpense = { ...expenseData, id };
        await db.expenses.add(newExpense);
        set((state) => ({
            expenses: [newExpense, ...state.expenses].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        }));
    },

    updateExpense: async (id, updates) => {
        await db.expenses.update(id, updates);
        set((state) => ({
            expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e))
        }));
    },

    deleteExpense: async (id) => {
        await db.expenses.delete(id);
        set((state) => ({
            expenses: state.expenses.filter((e) => e.id !== id)
        }));
    },

    addCategory: async (name) => {
        const { categories } = get();
        if (categories.includes(name)) return;

        const newCategories = [...categories, name];
        await db.settings.put({ key: 'categories', value: JSON.stringify(newCategories) });
        set({ categories: newCategories });
    },

    deleteCategory: async (name) => {
        if (name === SYSTEM_CATEGORY) return;

        const { categories, expenses } = get();
        const newCategories = categories.filter((c) => c !== name);

        // Move expenses to Uncategorized
        const relatedExpenses = expenses.filter((e) => e.category === name);
        await Promise.all(
            relatedExpenses.map((e) => db.expenses.update(e.id, { category: SYSTEM_CATEGORY }))
        );

        await db.settings.put({ key: 'categories', value: JSON.stringify(newCategories) });

        set({
            categories: newCategories,
            expenses: expenses.map((e) => e.category === name ? { ...e, category: SYSTEM_CATEGORY } : e)
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
