import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Target, Save, Calendar } from 'lucide-react';

const BudgetManager: React.FC = () => {
    const { categories, budgets, upsertBudget } = useFinanceStore();
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [limit, setLimit] = useState('');

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentBudget = budgets.find(b => b.category === selectedCategory && b.monthPeriod === currentMonth);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory || !limit) return;

        await upsertBudget({
            category: selectedCategory,
            limit: parseFloat(limit),
            monthPeriod: currentMonth
        });
        setLimit('');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2 mb-4">
                <Target className="w-5 h-5 text-red-600" />
                <h2 className="font-bold text-lg">Set Monthly Budgets</h2>
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2">
                <Calendar className="w-3 h-3" />
                <span>Period: {currentMonth}</span>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase">Monthly Limit (RM)</label>
                        <input
                            type="number"
                            placeholder={currentBudget ? `Current: ${currentBudget.limit}` : "0.00"}
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 bg-red-600 font-bold text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    <span>Save Budget</span>
                </button>
            </form>
        </div>
    );
};

export default BudgetManager;
