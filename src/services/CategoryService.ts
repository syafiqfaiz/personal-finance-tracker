import { db } from '../db/db';
import { SYSTEM_CATEGORY, DEFAULT_ICON } from '../store/useFinanceStore';

export interface CategoryData {
    name: string;
    icon: string;
}

export const CategoryService = {
    // Renames a category across Settings, Expenses, and Budgets
    async renameCategory(oldName: string, newName: string, currentCategories: string[], currentIcons: Record<string, string>): Promise<{ categories: string[], icons: Record<string, string> }> {
        if (!oldName || !newName || oldName === newName) {
            throw new Error('Invalid rename parameters');
        }

        // 1. Update Categories List & Icons
        let newCategories = [...currentCategories];
        const newIcons = { ...currentIcons };
        const icon = newIcons[oldName] || DEFAULT_ICON;

        // Optimistically calculate new state
        if (!currentCategories.includes(newName)) {
            // Rename logic
            newCategories = currentCategories.map(c => c === oldName ? newName : c);
            newIcons[newName] = icon;
            delete newIcons[oldName];
        } else {
            // Merge logic (Target exists)
            newCategories = currentCategories.filter(c => c !== oldName);
            // newName keeps its own icon, oldName's icon is discarded
            delete newIcons[oldName];
        }

        // Persist Settings
        await db.settings.put({ key: 'categories', value: JSON.stringify(newCategories) });
        await db.settings.put({ key: 'categoryIcons', value: JSON.stringify(newIcons) });

        // 2. Migrate Expenses (Find & Update)
        const relatedExpenses = await db.expenses.where('category').equals(oldName).toArray();
        if (relatedExpenses.length > 0) {
            await Promise.all(
                relatedExpenses.map(e => db.expenses.update(e.id, { category: newName }))
            );
        }

        // 3. Migrate Budgets
        const relatedBudgets = await db.budgets.where('category').equals(oldName).toArray();
        if (relatedBudgets.length > 0) {
            await Promise.all(
                relatedBudgets.map(b => db.budgets.update(b.id, { category: newName }))
            );
        }

        return { categories: newCategories, icons: newIcons };
    },

    async deleteCategory(name: string, currentCategories: string[], currentIcons: Record<string, string>): Promise<{ categories: string[], icons: Record<string, string> }> {
        if (name === SYSTEM_CATEGORY) return { categories: currentCategories, icons: currentIcons };

        const newCategories = currentCategories.filter(c => c !== name);
        const newIcons = { ...currentIcons };
        delete newIcons[name];

        // 1. Move expenses to Uncategorized
        const relatedExpenses = await db.expenses.where('category').equals(name).toArray();
        await Promise.all(
            relatedExpenses.map(e => db.expenses.update(e.id, { category: SYSTEM_CATEGORY }))
        );

        // 2. Delete associated budgets
        const relatedBudgets = await db.budgets.where('category').equals(name).toArray();
        await Promise.all(
            relatedBudgets.map(b => db.budgets.delete(b.id))
        );

        // 3. Persist Settings
        await db.settings.put({ key: 'categories', value: JSON.stringify(newCategories) });
        await db.settings.put({ key: 'categoryIcons', value: JSON.stringify(newIcons) });

        return { categories: newCategories, icons: newIcons };
    }
};
