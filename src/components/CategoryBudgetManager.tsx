import React, { useState, useMemo } from 'react';
import { useFinanceStore, SYSTEM_CATEGORY, DEFAULT_ICON } from '../store/useFinanceStore';
import { Tag, Plus } from 'lucide-react';
import { toast } from 'sonner';
import BudgetCard from './budgets/BudgetCard';
import EditCategoryDialog, { type CategoryFormData } from './budgets/EditCategoryDialog';
import { getLocalMonthPeriod } from '../utils/dateUtils';

const CategoryBudgetManager: React.FC = () => {
    const { categories, budgets, expenses, categoryIcons, addCategory, updateCategoryIcon, deleteCategory, renameCategory, upsertBudget } = useFinanceStore();
    const [editingData, setEditingData] = useState<CategoryFormData | null>(null);

    const currentMonth = getLocalMonthPeriod();

    // Performance Optimization: Memoize stats calculation
    // Complexity reduces from O(N*M) per render to only when dependencies change
    const categoryData = useMemo(() => {
        return categories.map(cat => {
            const monthlyExpenses = expenses.filter(e =>
                getLocalMonthPeriod(new Date(e.timestamp)) === currentMonth && e.category === cat
            );
            const spent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
            const budget = budgets.find(b => b.category === cat && b.monthPeriod === currentMonth);
            const limit = budget?.limit || 0;
            const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const isOver = limit > 0 && spent > limit;
            return { cat, spent, limit, percent, isOver };
        });
    }, [categories, expenses, budgets, currentMonth]);

    const handleCreate = () => {
        setEditingData({
            originalName: '',
            name: '',
            limit: '',
            icon: DEFAULT_ICON
        });
    };

    const handleEdit = (cat: string) => {
        const budget = budgets.find(b => b.category === cat && b.monthPeriod === currentMonth);
        setEditingData({
            originalName: cat,
            name: cat,
            limit: budget?.limit?.toString() || '',
            icon: categoryIcons[cat] || DEFAULT_ICON
        });
    };

    const handleSave = async (data: CategoryFormData) => {
        const categoryName = data.name.trim();
        if (!categoryName) return;

        // CREATE MODE
        if (!data.originalName) {
            await addCategory(categoryName, data.icon);
            toast.success(`Category "${categoryName}" created`);
        }
        // EDIT MODE
        else {
            if (data.name !== data.originalName) {
                await renameCategory(data.originalName, categoryName);
                toast.success(`Renamed to "${categoryName}"`);
            }

            // Icon update logic
            const currentIcon = categoryIcons[categoryName] || DEFAULT_ICON;
            if (data.icon !== currentIcon) {
                await updateCategoryIcon(categoryName, data.icon);
                toast.success('Category icon updated');
            }
        }

        // Update budget limit (Common for both)
        if (data.limit && parseFloat(data.limit) > 0) {
            await upsertBudget({
                category: categoryName,
                limit: parseFloat(data.limit),
                monthPeriod: currentMonth
            });
        }

        setEditingData(null);
    };

    const handleDelete = async (cat: string) => {
        await deleteCategory(cat);
        toast.success(`Category "${cat}" deleted`);
        setEditingData(null);
    };

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Header */}
            <div className="flex items-center space-x-4 bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm">
                <div className="bg-purple-50 p-3 rounded-2xl text-purple-600">
                    <Tag className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-sm font-bold font-jakarta text-slate-900 uppercase tracking-widest">Categories & Budgets</h2>
                    <p className="text-[10px] text-slate-500 font-bold font-jakarta uppercase">Manage your spending categories</p>
                </div>
            </div>

            {/* Category Cards */}
            <div className="space-y-3">
                {categoryData.map(({ cat, spent, limit, percent, isOver }) => (
                    <BudgetCard
                        key={cat}
                        category={cat}
                        icon={categoryIcons[cat]}
                        spent={spent}
                        limit={limit}
                        percent={percent}
                        isOver={isOver}
                        onEdit={handleEdit}
                    />
                ))}
            </div>

            {/* Add New Category Button (Full Width) */}
            <div className="pt-4">
                <button
                    onClick={handleCreate}
                    className="w-full bg-slate-900 text-white font-bold font-jakarta py-4 rounded-[20px] shadow-sm hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Category</span>
                </button>
            </div>

            <p className="text-[10px] text-slate-500 font-medium italic text-center px-4">
                * Deleting a category moves its expenses to "{SYSTEM_CATEGORY}".
            </p>

            {editingData && (
                <EditCategoryDialog
                    initialData={editingData}
                    onSave={handleSave}
                    onCancel={() => setEditingData(null)}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
};

export default CategoryBudgetManager;
