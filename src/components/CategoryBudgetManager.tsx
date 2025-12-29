import React, { useState } from 'react';
import { useFinanceStore, SYSTEM_CATEGORY, DEFAULT_ICON } from '../store/useFinanceStore';
import { Tag, Pencil, Trash2, Plus, ArrowLeft, X } from 'lucide-react';
import IconPicker from './IconPicker';
import { getIconComponent } from '../utils/iconUtils';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

interface EditingCategory {
    originalName: string;
    name: string;
    limit: string;
    icon: string;
}

const CategoryBudgetManager: React.FC = () => {
    const { categories, budgets, expenses, categoryIcons, addCategory, updateCategoryIcon, deleteCategory, renameCategory, upsertBudget } = useFinanceStore();
    const [editing, setEditing] = useState<EditingCategory | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string } | null>(null);

    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get budget data for each category
    const categoryData = categories.map(cat => {
        const monthlyExpenses = expenses.filter(e =>
            new Date(e.timestamp).toISOString().slice(0, 7) === currentMonth && e.category === cat
        );
        const spent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
        const budget = budgets.find(b => b.category === cat && b.monthPeriod === currentMonth);
        const limit = budget?.limit || 0;
        const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const isOver = limit > 0 && spent > limit;
        return { cat, spent, limit, percent, isOver };
    });

    const handleCreate = () => {
        setEditing({
            originalName: '',
            name: '',
            limit: '',
            icon: DEFAULT_ICON
        });
    };

    const handleEdit = (cat: string) => {
        const budget = budgets.find(b => b.category === cat && b.monthPeriod === currentMonth);
        setEditing({
            originalName: cat,
            name: cat,
            limit: budget?.limit?.toString() || '',
            icon: categoryIcons[cat] || DEFAULT_ICON
        });
    };

    const handleSaveEdit = async () => {
        if (!editing) return;

        const categoryName = editing.name.trim();
        if (!categoryName) return;

        // CREATE MODE
        if (!editing.originalName) {
            await addCategory(categoryName, editing.icon);
            toast.success(`Category "${categoryName}" created`);
        }
        // EDIT MODE
        else {
            if (editing.name !== editing.originalName) {
                await renameCategory(editing.originalName, categoryName);
                toast.success(`Renamed to "${categoryName}"`);
            }

            // Icon update logic
            const currentIcon = categoryIcons[categoryName] || DEFAULT_ICON;
            if (editing.icon !== currentIcon) {
                await updateCategoryIcon(categoryName, editing.icon);
                toast.success('Category icon updated');
            }
        }

        // Update budget limit (Common for both)
        if (editing.limit && parseFloat(editing.limit) > 0) {
            await upsertBudget({
                category: categoryName,
                limit: parseFloat(editing.limit),
                monthPeriod: currentMonth
            });
        }

        setEditing(null);
    };

    const handleDeleteClick = (cat: string) => {
        setDeleteConfirmation({ id: cat });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;
        const cat = deleteConfirmation.id;

        await deleteCategory(cat);
        toast.success(`Category "${cat}" deleted`);

        setDeleteConfirmation(null);
        setEditing(null);
    };

    // Full-page edit popup
    if (editing) {
        return (
            <div className="fixed inset-0 bg-slate-50 z-50 animate-slide-up">
                <div className="max-w-md mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center space-x-4 mb-8">
                        <button
                            onClick={() => setEditing(null)}
                            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-serif text-slate-900">
                            {editing.originalName ? 'Edit Category' : 'New Category'}
                        </h1>
                    </div>

                    {/* Edit Form */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                                Category Name & Icon
                            </label>
                            <div className="flex gap-3">
                                <IconPicker
                                    selectedIcon={editing.icon}
                                    onSelect={(icon) => setEditing({ ...editing, icon })}
                                />
                                <input
                                    type="text"
                                    value={editing.name}
                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                    className="flex-1 bg-white rounded-2xl border border-slate-200 py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-bold font-jakarta text-slate-900 transition-all"
                                    placeholder="Category name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                                Monthly Budget (RM)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={editing.limit}
                                    onChange={(e) => setEditing({ ...editing, limit: e.target.value })}
                                    className="w-full bg-white rounded-2xl border border-slate-200 py-4 pl-14 pr-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-bold font-jakarta text-slate-900 transition-all"
                                    placeholder="0"
                                />
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-jakarta text-sm">
                                    RM
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 ml-1">Leave empty for no budget limit</p>
                        </div>

                        <div className="pt-4 space-y-3">
                            <button
                                onClick={handleSaveEdit}
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-full shadow-lg hover:bg-slate-800 transition-all"
                            >
                                {editing.originalName ? 'Save Changes' : 'Create Category'}
                            </button>
                            <button
                                onClick={() => setEditing(null)}
                                className="w-full bg-white text-slate-600 font-bold font-jakarta py-4 rounded-full border border-slate-200 hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>

                            {editing.originalName && (
                                <button
                                    onClick={() => handleDeleteClick(editing.originalName)}
                                    className="w-full text-red-500 font-medium py-4 rounded-full hover:bg-red-50 transition-all flex items-center justify-center space-x-2"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    <span className="font-bold font-jakarta">Delete Category</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                    <div key={cat} className="bg-white rounded-[20px] border border-slate-100 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500">
                                    {getIconComponent(categoryIcons[cat] || DEFAULT_ICON, { className: 'w-5 h-5' })}
                                </div>
                                <div>
                                    <h3 className="font-bold font-jakarta text-slate-900 text-sm">{cat}</h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {limit > 0 ? `RM ${limit} / month` : 'No budget set'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                {cat !== SYSTEM_CATEGORY && (
                                    <>
                                        <button
                                            onClick={() => handleEdit(cat)}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar (only if budget exists) */}
                        {limit > 0 && (
                            <div className="space-y-2">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-blue-500'}`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className={`font-bold font-jakarta uppercase ${isOver ? 'text-red-500' : 'text-slate-400'}`}>
                                        {isOver ? 'Exceeded' : `${percent.toFixed(0)}% used`}
                                    </span>
                                    <span className="text-slate-500 font-bold font-jakarta text-[10px]">
                                        RM {spent.toFixed(0)} spent
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
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

            <ConfirmDialog
                isOpen={!!deleteConfirmation}
                title="Delete Category?"
                message={`Are you sure you want to delete "${deleteConfirmation?.id}"? usage history will be moved to "${SYSTEM_CATEGORY}".`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirmation(null)}
            />
        </div>
    );
};

export default CategoryBudgetManager;
