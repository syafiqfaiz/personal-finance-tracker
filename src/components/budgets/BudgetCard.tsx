import React from 'react';
import { Pencil } from 'lucide-react';
import { getIconComponent } from '../../utils/iconUtils';
import { formatCurrency, formatCurrencyPrecise } from '../../utils/formatters';
import { SYSTEM_CATEGORY, DEFAULT_ICON } from '../../store/useFinanceStore';

interface BudgetCardProps {
    category: string;
    icon: string;
    spent: number;
    limit: number;
    percent: number;
    isOver: boolean;
    onEdit: (category: string) => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({
    category,
    icon,
    spent,
    limit,
    percent,
    isOver,
    onEdit
}) => {
    return (
        <div className="bg-white rounded-[20px] border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500">
                        {getIconComponent(icon || DEFAULT_ICON, { className: 'w-5 h-5' })}
                    </div>
                    <div>
                        <h3 className="font-bold font-jakarta text-slate-900 text-sm">{category}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                            {limit > 0 ? `${formatCurrency(limit)} / month` : 'No budget set'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-1">
                    {category !== SYSTEM_CATEGORY && (
                        <button
                            onClick={() => onEdit(category)}
                            aria-label="Edit budget"
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar (only if budget exists) */}
            {limit > 0 && (
                <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px]">
                        <span className={`font-bold font-jakarta uppercase ${isOver ? 'text-red-500' : 'text-slate-400'}`}>
                            {isOver ? 'Exceeded' : `${percent.toFixed(0)}% used`}
                        </span>
                        <span className="text-slate-500 font-bold font-jakarta text-[10px]">
                            {formatCurrencyPrecise(spent)} spent
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetCard;
