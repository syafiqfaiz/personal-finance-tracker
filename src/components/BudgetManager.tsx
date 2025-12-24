import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Target, Save } from 'lucide-react';

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
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-6 animate-slide-up">
            <div className="flex items-center space-x-4 border-b border-slate-50 pb-4">
                <div className="bg-red-50 p-3 rounded-2xl text-red-500">
                    <Target className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Adjust Limits</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Period: {currentMonth}</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6 pt-2">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Select Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-slate-50 rounded-2xl border border-slate-100 py-4 px-6 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-bold text-slate-700 transition-all appearance-none"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Monthly Budget (RM)</label>
                        <div className="relative">
                            <input
                                type="number"
                                placeholder={currentBudget ? `Current: ${currentBudget.limit}` : "0.00"}
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                                className="w-full bg-slate-50 rounded-2xl border border-slate-100 py-4 px-12 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-lg font-black text-slate-900 transition-all"
                            />
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">RM</span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-slate-900 text-white font-black uppercase tracking-widest py-4 rounded-full shadow-lg shadow-slate-100 hover:bg-slate-800 transition-all text-xs flex items-center justify-center space-x-2"
                >
                    <Save className="w-4 h-4" />
                    <span>Update Budget</span>
                </button>
            </form>
        </div>
    );
};

export default BudgetManager;
