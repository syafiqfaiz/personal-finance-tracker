import React from 'react';
import { useFinanceStore } from '../store/useFinanceStore';

interface BudgetProgressProps {
    showAll?: boolean;
}

const BudgetProgress: React.FC<BudgetProgressProps> = ({ showAll = false }) => {
    const { expenses, budgets, categories } = useFinanceStore();
    const currentMonth = new Date().toISOString().slice(0, 7);

    const monthlyExpenses = expenses.filter(e =>
        new Date(e.timestamp).toISOString().slice(0, 7) === currentMonth
    );

    const budgetData = categories.map(cat => {
        const spent = monthlyExpenses
            .filter(e => e.category === cat)
            .reduce((sum, e) => sum + e.amount, 0);
        const budget = budgets.find(b => b.category === cat && b.monthPeriod === currentMonth);
        const limit = budget?.limit || 0;
        return { cat, spent, limit };
    }).filter(b => b.limit > 0 || showAll);

    if (budgetData.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Monthly Budgets</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date().toLocaleString('default', { month: 'long' })}</span>
            </div>
            {budgetData.map(({ cat, spent, limit }) => {
                const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                const isOver = limit > 0 && spent > limit;

                return (
                    <div key={cat} className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{cat}</span>
                            <div className="text-right">
                                <span className="text-xs font-black text-slate-900">RM {spent.toFixed(0)}</span>
                                <span className="text-[10px] text-slate-400 font-bold ml-1">/ {limit.toFixed(0)}</span>
                            </div>
                        </div>
                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-bold uppercase tracking-tight ${isOver ? 'text-red-500' : 'text-slate-400'}`}>
                                {isOver ? 'limit exceeded' : `${percent.toFixed(0)}% used`}
                            </span>
                            {limit > 0 && (
                                <span className="text-[10px] text-slate-400 font-bold uppercase">
                                    RM {(limit - spent).toFixed(0)} left
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default BudgetProgress;
