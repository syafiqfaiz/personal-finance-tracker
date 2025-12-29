import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFinanceStore } from './useFinanceStore';
import { resetDb } from '../test/setup';
import { db } from '../db/db';
import { ExpenseService } from '../services/ExpenseService';
import { CategoryService } from '../services/CategoryService';

// Mock services - keep these to isolate side effects like S3 or calculation complexity if needed
// However, for correctness, we might want to test the full flow if possible.
// But ExpenseService and CategoryService are unit tested separately.
// Let's keep mocks for Service calls to ensure Store properly delegates.
vi.mock('../services/ExpenseService', () => ({
    ExpenseService: {
        addExpense: vi.fn(async (data) => ({ ...data, id: 'mock-service-id', createdAt: new Date(), updatedAt: new Date() })),
        updateExpense: vi.fn(async (id, data) => data),
        deleteExpense: vi.fn(async () => { })
    }
}));

vi.mock('../services/CategoryService', () => ({
    CategoryService: {
        deleteCategory: vi.fn(async () => ({ categories: [], icons: {} })),
        renameCategory: vi.fn(async () => ({ categories: ['New'], icons: { New: 'Icon' } }))
    }
}));

describe('useFinanceStore', () => {
    beforeEach(() => {
        resetDb(); // Clear in-memory DB
        useFinanceStore.setState({
            expenses: [],
            budgets: [],
            categories: [],
            categoryIcons: {},
            isLoading: false
        });
        vi.clearAllMocks();
    });

    it('loads and sorts expenses correctly', async () => {
        const baseExpense = { amount: 100, category: 'Food', name: 'Test', paymentMethod: 'Card', tags: [], isTaxDeductible: false };
        const expense1 = { ...baseExpense, id: '1', timestamp: new Date('2023-01-01'), createdAt: new Date('2023-01-01T10:00:00') };
        const expense2 = { ...baseExpense, id: '2', timestamp: new Date('2023-01-02'), createdAt: new Date('2023-01-02T10:00:00') };
        const expense3 = { ...baseExpense, id: '3', timestamp: new Date('2023-01-01'), createdAt: new Date('2023-01-01T12:00:00') };

        await db.expenses.add(expense1);
        await db.expenses.add(expense2);
        await db.expenses.add(expense3);

        await useFinanceStore.getState().loadAppData();

        const { expenses } = useFinanceStore.getState();
        expect(expenses).toHaveLength(3);
        expect(expenses[0].id).toBe('2');
        expect(expenses[1].id).toBe('3');
        expect(expenses[2].id).toBe('1');
    });

    it('migrates missing timestamps', async () => {
        const legacyExpense = { id: 'old', timestamp: new Date('2023-01-01'), amount: 100, category: 'Food', name: 'Old', paymentMethod: 'Card', tags: [], isTaxDeductible: false };
        await db.expenses.add(legacyExpense);

        await useFinanceStore.getState().loadAppData();

        const { expenses } = useFinanceStore.getState();
        expect(expenses[0].createdAt).toBeDefined();
        // Verify persistence
        const saved = await db.expenses.get('old');
        expect(saved).toBeDefined();
        expect(saved?.createdAt).toBeDefined();
    });

    it('loads categories from settings', async () => {
        await db.settings.put({ key: 'categories', value: JSON.stringify(['CustomCat']) });
        await db.settings.put({ key: 'categoryIcons', value: JSON.stringify({ CustomCat: 'Icon' }) });

        await useFinanceStore.getState().loadAppData();

        expect(useFinanceStore.getState().categories).toContain('CustomCat');
        expect(useFinanceStore.getState().categoryIcons.CustomCat).toBe('Icon');
    });
});

describe('Expense Actions', () => {
    it('adds expense and updates state', async () => {
        const newExpense = { amount: 100, category: 'Food', timestamp: new Date(), name: 'Test' };

        await useFinanceStore.getState().addExpense(newExpense as any);

        const { expenses } = useFinanceStore.getState();
        expect(expenses).toHaveLength(1);
        expect(ExpenseService.addExpense).toHaveBeenCalled();
    });

    it('updates expense in place', async () => {
        const initial = { id: '1', amount: 100, timestamp: new Date() };
        useFinanceStore.setState({ expenses: [initial] as any });

        await useFinanceStore.getState().updateExpense('1', { amount: 200 });

        expect(useFinanceStore.getState().expenses[0].amount).toBe(200);
        expect(ExpenseService.updateExpense).toHaveBeenCalled();
    });

    it('deletes expense from state', async () => {
        useFinanceStore.setState({ expenses: [{ id: '1' }] as any });
        await useFinanceStore.getState().deleteExpense('1');
        expect(useFinanceStore.getState().expenses).toHaveLength(0);
        expect(ExpenseService.deleteExpense).toHaveBeenCalledWith('1');
    });
});

describe('Category Actions', () => {
    it('adds new category and persists', async () => {
        await useFinanceStore.getState().addCategory('NewCat', 'NewIcon');

        expect(useFinanceStore.getState().categories).toContain('NewCat');

        // Verify DB persistence
        const savedCats = await db.settings.get('categories');
        expect(savedCats).toBeDefined();
        expect(JSON.parse(savedCats!.value)).toContain('NewCat');
    });

    it('updates category icon and persists', async () => {
        useFinanceStore.setState({
            categories: ['Food'],
            categoryIcons: { Food: 'OldIcon' }
        });

        await useFinanceStore.getState().updateCategoryIcon('Food', 'NewIcon');

        expect(useFinanceStore.getState().categoryIcons['Food']).toBe('NewIcon');
        const savedIcons = await db.settings.get('categoryIcons');
        expect(savedIcons).toBeDefined();
        expect(JSON.parse(savedIcons!.value)['Food']).toBe('NewIcon');
    });
});

describe('Budget Actions', () => {
    it('creates new budget if not exists', async () => {
        await useFinanceStore.getState().upsertBudget({
            category: 'Food',
            limit: 500,
            monthPeriod: '2023-01'
        });

        const { budgets } = useFinanceStore.getState();
        expect(budgets).toHaveLength(1);
        expect(budgets[0].limit).toBe(500);

        // DB check
        const saved = await db.budgets.toArray();
        expect(saved).toHaveLength(1);
        expect(saved[0].limit).toBe(500);
    });

    it('updates existing budget', async () => {
        const existing = { id: '1', category: 'Food', limit: 100, monthPeriod: '2023-01' };
        await db.budgets.add(existing);
        useFinanceStore.setState({ budgets: [existing] as any });

        await useFinanceStore.getState().upsertBudget({
            category: 'Food',
            limit: 1000,
            monthPeriod: '2023-01'
        });

        const { budgets } = useFinanceStore.getState();
        expect(budgets).toHaveLength(1);
        expect(budgets[0].limit).toBe(1000); // Updated in memory

        // DB check
        const saved = await db.budgets.get('1');
        expect(saved).toBeDefined();
        expect(saved!.limit).toBe(1000); // Persisted
    });
});

