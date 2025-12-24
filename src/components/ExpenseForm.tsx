import React, { useState } from 'react';
import { useFinanceStore, SYSTEM_CATEGORY } from '../store/useFinanceStore';
import { PlusCircle, Calendar as CalendarIcon, Tag, Info } from 'lucide-react';

const ExpenseForm: React.FC = () => {
    const { categories, addExpense } = useFinanceStore();

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories[0] || SYSTEM_CATEGORY);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount) return;

        await addExpense({
            name,
            amount: parseFloat(amount),
            category,
            tags: [],
            timestamp: new Date(date),
            notes,
            paymentMethod: 'Cash',
            isTaxDeductible: false,
        });

        setName('');
        setAmount('');
        setNotes('');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2 mb-4">
                <PlusCircle className="w-5 h-5 text-green-600" />
                <h2 className="font-bold text-lg">Add Expense</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Merchant / Item</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Starbucks"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Amount (RM)</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Category
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    >
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" /> Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Notes
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    rows={2}
                />
            </div>

            <button
                type="submit"
                className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
                Save Expense
            </button>
        </form>
    );
};

export default ExpenseForm;
