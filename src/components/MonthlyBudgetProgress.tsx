import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';

interface MonthlyBudgetProgressProps {
    totalSpent: number;
    totalBudget: number;
}

const MonthlyBudgetProgress: React.FC<MonthlyBudgetProgressProps> = ({ totalSpent, totalBudget }) => {
    const navigate = useNavigate();
    const currentDate = new Date();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    const percentage = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 100; // 100% if no budget (burst)
    const isOverBudget = totalSpent > totalBudget; // Strictly greater
    const remaining = Math.max(0, totalBudget - totalSpent);
    const isNoBudget = totalBudget === 0;

    return (
        <div className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 mb-6">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="font-jakarta text-sm text-slate-500 font-medium">
                        You've spent <span className="text-slate-900 font-bold">{formatCurrency(totalSpent)}</span>
                    </h2>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {monthName}, {year}
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative flex items-center">
                    <div
                        className={`h-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 ${isOverBudget || isNoBudget ? 'bg-red-500' : 'bg-blue-600'}`}
                        style={{ width: `${percentage}%` }}
                    >
                        {percentage > 10 && (
                            <span className="text-white/90 font-bold text-[10px] font-jakarta leading-none">
                                {percentage.toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    {isNoBudget ? (
                        <button
                            onClick={() => navigate('/budgets')}
                            className="text-[10px] text-red-500 font-bold hover:underline"
                        >
                            No Budget Set (Tap to fix)
                        </button>
                    ) : (
                        <div />
                    )}

                    <p className={`text-xs font-bold font-jakarta ${remaining === 0 ? 'text-red-500' : 'text-slate-900'}`}>
                        {formatCurrency(remaining)} <span className="text-slate-400 font-medium text-[10px]">remaining</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MonthlyBudgetProgress;
