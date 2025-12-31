import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('CategoryService', () => {
    let CategoryService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    let db: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    let mockCollection: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    beforeEach(async () => {
        vi.resetModules();

        mockCollection = {
            toArray: vi.fn(() => Promise.resolve([])),
            modify: vi.fn(() => Promise.resolve(1)),
            delete: vi.fn(() => Promise.resolve(1))
        };

        const mockTable = {
            toArray: vi.fn(() => Promise.resolve([])),
            add: vi.fn(() => Promise.resolve('mock-id')),
            put: vi.fn(() => Promise.resolve('mock-id')),
            update: vi.fn(() => Promise.resolve(1)),
            delete: vi.fn(() => Promise.resolve()),
            get: vi.fn(() => Promise.resolve(undefined)),
            where: vi.fn(() => ({
                equals: vi.fn(() => mockCollection)
            })),
        };

        vi.doMock('../db/db', () => ({
            db: {
                expenses: mockTable,
                budgets: mockTable,
                settings: mockTable,
            },
            FinanceDB: vi.fn()
        }));

        const module = await import('./CategoryService');
        CategoryService = module.CategoryService;
        const dbModule = await import('../db/db');
        db = dbModule.db;
    });

    it('throws error for invalid rename parameters', async () => {
        const categories = ['Food'];
        const icons = { Food: 'U' };

        await expect(CategoryService.renameCategory('', 'New', categories, icons)).rejects.toThrow('Invalid rename parameters');
        await expect(CategoryService.renameCategory('Old', '', categories, icons)).rejects.toThrow('Invalid rename parameters');
        await expect(CategoryService.renameCategory('Same', 'Same', categories, icons)).rejects.toThrow('Invalid rename parameters');
    });

    it('merges category if new name already exists', async () => {
        // Renaming "Donuts" to "Food", where "Food" exists.
        const categories = ['Food', 'Donuts'];
        const icons = { Food: 'Utensils', Donuts: 'Circle' };

        // Expenses under 'Donuts' should move to 'Food'
        mockCollection.toArray.mockResolvedValueOnce([{ id: '1', category: 'Donuts' }]); // Expenses
        mockCollection.toArray.mockResolvedValueOnce([]); // Budgets

        const result = await CategoryService.renameCategory('Donuts', 'Food', categories, icons);

        expect(result.categories).toContain('Food');
        expect(result.categories).not.toContain('Donuts');
        expect(result.categories.length).toBe(1);

        // Should keep target icon (Food -> Utensils), discard old icon (Donuts -> Circle)
        expect(result.icons['Food']).toBe('Utensils');

        // Verify DB update uses new name
        expect(db.expenses.update).toHaveBeenCalledWith('1', expect.objectContaining({ category: 'Food' }));
    });

    it('prevents deletion of System Category', async () => {
        const categories = ['Uncategorized', 'Food'];
        const icons = { Uncategorized: 'Tag', Food: 'Utensils' };

        const result = await CategoryService.deleteCategory('Uncategorized', categories, icons);

        // Should return unchanged
        expect(result.categories).toEqual(categories);
        expect(result.icons).toEqual(icons);
        expect(db.expenses.update).not.toHaveBeenCalled();
    });

    it('deletes category and moves expenses to System Category', async () => {
        const categories = ['Food', 'Test'];
        const icons = { Food: 'Utensils', Test: 'Tag' };

        // Setup return values
        // We need to ensure that the mocked call returns what we expect
        mockCollection.toArray.mockResolvedValueOnce([{ id: '1', category: 'Test' }]); // Expenses
        mockCollection.toArray.mockResolvedValueOnce([{ id: 'b1', category: 'Test' }]); // Budgets

        const result = await CategoryService.deleteCategory('Test', categories, icons);

        expect(result.categories).not.toContain('Test');
        expect(result.icons.Test).toBeUndefined();

        // Verify DB interactions
        expect(db.expenses.update).toHaveBeenCalledWith('1', expect.objectContaining({ category: 'Uncategorized' }));
        expect(db.budgets.delete).toHaveBeenCalledWith('b1');
    });

    it('renames category and updates all related records', async () => {
        const categories = ['Food', 'OldName'];
        const icons = { Food: 'U', OldName: 'O' };

        // Setup mock
        mockCollection.toArray.mockResolvedValueOnce([{ id: '1', category: 'OldName' }]); // Expenses
        mockCollection.toArray.mockResolvedValueOnce([{ id: 'b1', category: 'OldName' }]); // Budgets

        const result = await CategoryService.renameCategory('OldName', 'NewName', categories, icons);

        expect(result.categories).toContain('NewName');
        expect(result.categories).not.toContain('OldName');

        expect(db.settings.put).toHaveBeenCalled();
        expect(db.expenses.update).toHaveBeenCalledWith('1', expect.objectContaining({ category: 'NewName' }));
        expect(db.budgets.update).toHaveBeenCalledWith('b1', expect.objectContaining({ category: 'NewName' }));
    });
});
