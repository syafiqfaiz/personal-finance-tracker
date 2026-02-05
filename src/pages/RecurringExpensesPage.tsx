import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RecurringExpenseService } from '../services/RecurringExpenseService';
import { type RecurringExpense } from '../db/db';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Power, PowerOff, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { PAYMENT_METHODS, DEFAULT_PAYMENT_METHOD } from '../constants/app';

interface TemplateFormData {
    name: string;
    amount: number;
    categoryId: string;
    dayOfMonth: number;
    startDate: string;
    defaultPaymentMethod: string;
}

interface TemplateDialogProps {
    template?: RecurringExpense;
    categories: string[];
    paymentMethods: string[];
    onClose: () => void;
    onSave: (data: TemplateFormData) => void;
}

function TemplateDialog({ template, categories, paymentMethods, onClose, onSave }: TemplateDialogProps) {
    const [formData, setFormData] = useState<TemplateFormData>({
        name: template?.name || '',
        amount: template?.amount || 0,
        categoryId: template?.categoryId || categories[0] || '',
        dayOfMonth: template?.dayOfMonth || 1,
        startDate: template?.startDate || format(new Date(), 'yyyy-MM-dd'),
        defaultPaymentMethod: template?.defaultPaymentMethod || paymentMethods[0] || DEFAULT_PAYMENT_METHOD
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return createPortal(
        <div className="fixed inset-0 bg-white z-50 animate-slide-up overflow-y-auto">
            <div className="max-w-md mx-auto px-6 py-6 min-h-full">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-serif text-slate-900">
                        {template ? 'Edit' : 'New'} Recurring Expense
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white rounded-2xl border border-slate-200 py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-bold font-jakarta text-slate-900 transition-all"
                            required
                            placeholder="e.g., Rent, Netflix"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                            Amount (RM)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.amount === 0 ? '' : formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) || 0 })}
                                className="w-full bg-slate-50 rounded-2xl border border-slate-200 py-4 pl-14 pr-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-bold font-jakarta text-slate-900 transition-all"
                                min="0"
                                step="0.01"
                                placeholder="0"
                            />
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-jakarta text-sm">
                                RM
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 ml-1">Enter 0 for variable amount</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                            Category
                        </label>
                        <select
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            className="w-full bg-white rounded-2xl border border-slate-200 py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-bold font-jakarta text-slate-900 transition-all"
                            required
                        >
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                            Payment Method
                        </label>
                        <select
                            value={formData.defaultPaymentMethod}
                            onChange={(e) => setFormData({ ...formData, defaultPaymentMethod: e.target.value })}
                            className="w-full bg-white rounded-2xl border border-slate-200 py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-bold font-jakarta text-slate-900 transition-all"
                            required
                        >
                            {paymentMethods.map((method) => (
                                <option key={method} value={method}>
                                    {method}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                            Day of Month (1-31)
                        </label>
                        <input
                            type="number"
                            value={formData.dayOfMonth}
                            onChange={(e) => setFormData({ ...formData, dayOfMonth: Number(e.target.value) })}
                            className="w-full bg-white rounded-2xl border border-slate-200 py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-bold font-jakarta text-slate-900 transition-all"
                            min="1"
                            max="31"
                            required
                        />
                    </div>

                    {!template && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full bg-white rounded-2xl border border-slate-200 py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-bold font-jakarta text-slate-900 transition-all"
                                required
                            />
                        </div>
                    )}

                    <div className="pt-4 space-y-3">
                        <button
                            type="submit"
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-full shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
                        >
                            {template ? 'Save Changes' : 'Create Template'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full bg-white text-slate-600 font-bold font-jakarta py-4 rounded-full border border-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default function RecurringExpensesPage() {
    const [templates, setTemplates] = useState<RecurringExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogTemplate, setDialogTemplate] = useState<RecurringExpense | null | 'new'>(null);
    const { categories } = useFinanceStore();

    const loadTemplates = async () => {
        try {
            const allTemplates = await RecurringExpenseService.getAllTemplates();
            setTemplates(allTemplates);
        } catch (error) {
            console.error('Failed to load templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const handleSave = async (data: TemplateFormData) => {
        try {
            if (dialogTemplate === 'new') {
                await RecurringExpenseService.createTemplate(data);
                toast.success('Template created');
            } else if (dialogTemplate) {
                await RecurringExpenseService.updateTemplate(dialogTemplate.id, data);
                toast.success('Template updated');
            }
            setDialogTemplate(null);
            await loadTemplates();
        } catch (error) {
            console.error('Failed to save template:', error);
            toast.error('Failed to save template');
        }
    };

    const handleToggleActive = async (template: RecurringExpense) => {
        try {
            await RecurringExpenseService.updateTemplate(template.id, {
                isActive: !template.isActive
            });
            toast.success(template.isActive ? 'Template paused' : 'Template activated');
            await loadTemplates();
        } catch (error) {
            console.error('Failed to toggle template:', error);
            toast.error('Failed to update template');
        }
    };

    const handleDelete = async (template: RecurringExpense) => {
        if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) {
            return;
        }

        try {
            await RecurringExpenseService.deleteTemplate(template.id);
            toast.success('Template deleted');
            await loadTemplates();
        } catch (error) {
            console.error('Failed to delete template:', error);
            toast.error('Failed to delete template');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up pb-24">
            <header className="px-1 pt-4 pb-4 border-b border-slate-200">
                <h1 className="text-3xl font-serif text-slate-900">Recurring Expenses</h1>
                <p className="text-sm text-slate-500 mt-1">Manage your monthly recurring expenses</p>
            </header>

            {templates.length === 0 ? (
                <div className="px-1">
                    <div className="bg-white rounded-[28px] border border-slate-100 p-8 text-center shadow-sm">
                        <p className="text-sm text-slate-500 mb-4 font-jakarta">No recurring expenses yet</p>
                        <button
                            onClick={() => setDialogTemplate('new')}
                            className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-slate-900 text-white text-sm font-bold font-jakarta hover:bg-slate-800 transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Create Your First Template
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="px-1">
                        <button
                            onClick={() => setDialogTemplate('new')}
                            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white text-sm font-bold font-jakarta hover:bg-slate-800 transition-all shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Add New Template
                        </button>
                    </div>

                    <div className="space-y-3 px-1">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className={`bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm ${!template.isActive ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-bold font-jakarta text-slate-900 truncate">{template.name}</h3>
                                            {!template.isActive && (
                                                <span className="px-2 py-1 text-[10px] bg-slate-100 text-slate-600 rounded-lg font-bold font-jakarta uppercase tracking-wider">
                                                    Paused
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-600 space-y-1 font-jakarta">
                                            <p className="font-medium">
                                                {template.amount === 0 ? 'Variable Amount' : formatCurrency(template.amount)}
                                            </p>
                                            <p className="text-slate-500">{template.categoryId} · Day {template.dayOfMonth}</p>
                                            <p className="text-slate-500">Next: {formatDate(template.nextDueDate)}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggleActive(template)}
                                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                                            title={template.isActive ? 'Pause' : 'Activate'}
                                        >
                                            {template.isActive ? (
                                                <PowerOff className="w-5 h-5" />
                                            ) : (
                                                <Power className="w-5 h-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setDialogTemplate(template)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {dialogTemplate && (
                <TemplateDialog
                    template={dialogTemplate === 'new' ? undefined : dialogTemplate}
                    categories={categories}
                    paymentMethods={[...PAYMENT_METHODS]}
                    onClose={() => setDialogTemplate(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
