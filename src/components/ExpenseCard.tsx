import React from 'react';
import { useFinanceStore, DEFAULT_ICON } from '../store/useFinanceStore';
import { getIconComponent } from '../utils/iconUtils';
import { Trash2 } from 'lucide-react';

interface ExpenseCardProps {
    expense: {
        id: string;
        name: string;
        amount: number;
        category: string;
        timestamp: string | Date;
        notes?: string;
    };
    onClick: () => void;
    onDelete?: (e: React.MouseEvent) => void;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onClick, onDelete }) => {
    const { categoryIcons } = useFinanceStore();

    // Category icon helper
    const getCategoryIcon = (category: string) => {
        const iconName = categoryIcons[category] || DEFAULT_ICON;
        return getIconComponent(iconName, { className: 'w-5 h-5 text-slate-500' });
    };

    return (
        <div
            onClick={onClick}
            className="flex justify-between items-center bg-white p-4 rounded-[20px] shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] group"
        >
            <div className="flex gap-3 items-center min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 bg-slate-50 flex items-center justify-center`}>
                    {getCategoryIcon(expense.category)}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate pr-2">{expense.name}</p>
                    <p className="text-xs text-slate-500">
                        {new Date(expense.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} · {expense.category}
                    </p>
                    {expense.notes && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                            {expense.notes}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <p className="font-bold font-jakarta text-slate-900 whitespace-nowrap">
                    RM {expense.amount.toFixed(0)}
                </p>

                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete record"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ExpenseCard;
