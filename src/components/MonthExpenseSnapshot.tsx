import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Expense, type Budget } from '../db/db';
import { formatCurrency } from '../utils/formatters';

interface MonthExpenseSnapshotProps {
    expenses: Expense[];
    totalAmount: number;
    budgets: Budget[];
}

const COLORS = [
    '#3B82F6', // Blue-500
    '#F97316', // Orange-500
    '#A855F7', // Purple-500
    '#64748B', // Slate-500 (Others)
];

const MonthExpenseSnapshot: React.FC<MonthExpenseSnapshotProps> = ({ expenses, totalAmount, budgets }) => {
    const navigate = useNavigate();

    // 1. Aggregate Data
    const data = useMemo(() => {
        // Create map of category -> budget limit
        const budgetMap = budgets.reduce((acc, b) => {
            acc[b.category] = b.limit;
            return acc;
        }, {} as Record<string, number>);

        const categoryMap = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);

        const sortedCategories = Object.entries(categoryMap)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value]) => ({
                name,
                value,
                budget: budgetMap[name] || 0
            }));

        if (sortedCategories.length <= 3) {
            return sortedCategories;
        }

        const top3 = sortedCategories.slice(0, 3);
        const othersExpenses = sortedCategories.slice(3);
        const othersValue = othersExpenses.reduce((sum, item) => sum + item.value, 0);
        const othersBudget = othersExpenses.reduce((sum, item) => sum + item.budget, 0);

        return [...top3, { name: 'Others', value: othersValue, budget: othersBudget }];
    }, [expenses, budgets]);

    // 2. Prepare SVG Segments
    const RADIUS = 40;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    interface ChartSegment {
        name: string;
        value: number;
        budget: number;
        color: string;
        percentage: number;
        strokeDasharray: string;
        strokeDashoffset: number;
    }

    const { segments } = data.reduce((acc, item, index) => {
        const percentage = totalAmount > 0 ? item.value / totalAmount : 0;
        const strokeDasharray = `${percentage * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
        const strokeDashoffset = -acc.offset;

        const segment: ChartSegment = {
            ...item,
            color: COLORS[index % COLORS.length],
            percentage: Math.round(percentage * 100),
            strokeDasharray,
            strokeDashoffset
        };

        return {
            offset: acc.offset + (percentage * CIRCUMFERENCE),
            segments: [...acc.segments, segment]
        };
    }, { offset: 0, segments: [] as ChartSegment[] });

    if (totalAmount === 0 && expenses.length === 0) {
        return (
            <div
                onClick={() => navigate('/budgets')}
                className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 text-center cursor-pointer hover:shadow-md transition-shadow"
            >
                <p className="text-slate-400 text-sm font-medium">No expenses to analyze yet.</p>
                <p className="text-blue-500 text-xs mt-2 font-bold">Manage Budgets</p>
            </div>
        );
    }

    return (
        <div
            onClick={() => navigate('/budgets')}
            className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
        >
            <h2 className="text-left font-serif text-base text-slate-900 mb-2 pl-1">Spending This Month</h2>

            <div className="flex items-center justify-between gap-4">
                {/* SVG Chart */}
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {segments.map((segment) => (
                            <circle
                                key={segment.name}
                                cx="50"
                                cy="50"
                                r={RADIUS}
                                fill="transparent"
                                stroke={segment.color}
                                strokeWidth="20"
                                strokeDasharray={segment.strokeDasharray}
                                strokeDashoffset={segment.strokeDashoffset}
                                className="transition-all duration-500 ease-out hover:opacity-90"
                            />
                        ))}
                    </svg>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
                        <span className="text-sm font-bold font-jakarta text-slate-900">{formatCurrency(totalAmount)}</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 flex flex-col space-y-2 max-w-[55%]">
                    {segments.map((segment) => {
                        const isBurst = segment.budget > 0 && segment.value > segment.budget;
                        return (
                            <div key={segment.name} className="flex items-center justify-between gap-2 w-full">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: segment.color }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold text-slate-900 truncate">{segment.name}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className={`text-[10px] font-medium block ${isBurst ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                        {formatCurrency(segment.value)}
                                        {segment.budget > 0 && (
                                            <span className="text-slate-300 mx-0.5">/ {segment.budget.toFixed(0)}</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MonthExpenseSnapshot;
