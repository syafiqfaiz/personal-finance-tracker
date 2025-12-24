import React, { useState } from 'react';
import { useFinanceStore, SYSTEM_CATEGORY, type Expense } from '../store/useFinanceStore';
import { PlusCircle, Calendar as CalendarIcon, Tag, Info, Save, X } from 'lucide-react';

interface ExpenseFormProps {
    initialData?: Partial<Expense>;
    onSuccess?: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialData, onSuccess }) => {
    const { categories, addExpense, updateExpense } = useFinanceStore();

    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [category, setCategory] = useState(initialData?.category || categories[0] || SYSTEM_CATEGORY);
    const [date, setDate] = useState(initialData?.timestamp ? new Date(initialData.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState(initialData?.notes || '');

    const isEditing = !!initialData?.id;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount) return;

        const expenseData = {
            name,
            amount: parseFloat(amount),
            category,
            tags: initialData?.tags || [],
            timestamp: new Date(date),
            notes,
            paymentMethod: initialData?.paymentMethod || 'Cash',
            isTaxDeductible: initialData?.isTaxDeductible || false,
        };

        if (isEditing && initialData.id) {
            await updateExpense(initialData.id, expenseData);
        } else {
            await addExpense(expenseData);
        }

        if (onSuccess) {
            onSuccess();
        } else {
            setName('');
            setAmount('');
            setNotes('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div className="flex items-center space-x-2">
                    <PlusCircle className={`w-5 h-5 ${isEditing ? 'text-blue-600' : 'text-green-600'}`} />
                    <h2 className="font-black text-gray-800 uppercase tracking-tight">{isEditing ? 'Edit Expense' : 'Add Expense'}</h2>
                </div>
                {onSuccess && (
                    <button type="button" onClick={onSuccess} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Merchant / Item</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., KFC"
                        className="w-full rounded-xl border-gray-100 bg-gray-50 shadow-none focus:bg-white focus:ring-2 focus:ring-blue-500 py-3 px-4 font-bold text-gray-900 border"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount (RM)</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-xl border-gray-100 bg-gray-50 shadow-none focus:bg-white focus:ring-2 focus:ring-blue-500 py-3 px-4 font-black text-gray-900 border"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3 text-gray-300" /> Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full rounded-xl border-gray-100 bg-gray-50 shadow-none focus:bg-white focus:ring-2 focus:ring-blue-500 py-3 px-4 font-bold text-gray-900 border"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-gray-300" /> Category
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl border-gray-100 bg-gray-50 shadow-none focus:bg-white focus:ring-2 focus:ring-blue-500 py-3 px-4 font-bold text-gray-900 border appearance-none"
                    >
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Info className="w-3 h-3 text-gray-300" /> Notes
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                    className="w-full rounded-xl border-gray-100 bg-gray-50 shadow-none focus:bg-white focus:ring-2 focus:ring-blue-500 py-3 px-4 font-medium text-gray-600 border"
                    rows={2}
                />
            </div>

            <div className="flex gap-3">
                {onSuccess && (
                    <button
                        type="button"
                        onClick={onSuccess}
                        className="flex-1 bg-gray-100 text-gray-400 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                        <X className="w-5 h-5" />
                        <span>Cancel</span>
                    </button>
                )}
                <button
                    type="submit"
                    className={`flex-2 ${isEditing ? 'bg-blue-600' : 'bg-green-600'} text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg ${isEditing ? 'shadow-blue-100' : 'shadow-green-100'} hover:opacity-90 transition-all flex items-center justify-center space-x-2 px-8`}
                >
                    <Save className="w-5 h-5" />
                    <span>{isEditing ? 'Update Expense' : 'Save Expense'}</span>
                </button>
            </div>
        </form>
    );
};

export default ExpenseForm;
