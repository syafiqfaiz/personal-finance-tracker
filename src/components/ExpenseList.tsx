import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { Trash2, ShoppingBag } from 'lucide-react';

interface ExpenseListProps {
    filterCategory?: string;
    searchQuery?: string;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ filterCategory, searchQuery }) => {
    const { expenses, deleteExpense } = useFinanceStore();
    const navigate = useNavigate();

    const filteredExpenses = expenses
        .filter(e => !filterCategory || e.category === filterCategory)
        .filter(e => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return e.name.toLowerCase().includes(query) || (e.notes?.toLowerCase().includes(query));
        });

    // Group expenses by month
    const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
        const date = new Date(expense.timestamp);
        const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[month]) groups[month] = [];
        groups[month].push(expense);
        return groups;
    }, {} as Record<string, typeof expenses>);

    if (filteredExpenses.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm italic font-serif">Empty logs.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-slide-up">
            {Object.entries(groupedExpenses).map(([month, items]) => (
                <div key={month} className="space-y-4">
                    <h3 className="text-xl font-serif text-slate-900 border-b border-slate-100 pb-2 ml-1">{month}</h3>
                    <div className="divide-y divide-slate-50">
                        {items.map((expense) => (
                            <div
                                key={expense.id}
                                onClick={() => navigate(`/history/${expense.id}`)}
                                className="py-4 px-1 flex items-center justify-between active:bg-slate-50 transition-colors cursor-pointer group"
                            >
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-900 text-[15px] group-hover:text-blue-600 transition-colors">
                                        {expense.name} <span className="text-slate-400 font-medium text-xs ml-1">({expense.category})</span>
                                    </p>
                                    <div className="flex items-center space-x-3 text-[12px] text-slate-400 font-medium">
                                        <span>RM {expense.amount.toFixed(0)}</span>
                                        <span>•</span>
                                        <span>{new Date(expense.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this record?')) deleteExpense(expense.id);
                                        }}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ExpenseList;
