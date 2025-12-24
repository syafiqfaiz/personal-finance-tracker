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

    if (filteredExpenses.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No matching expenses found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <header className="flex items-center justify-between px-1">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Transactions</h2>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{filteredExpenses.length} total</span>
            </header>
            <div className="space-y-3">
                {filteredExpenses.map((expense) => (
                    <div
                        key={expense.id}
                        onClick={() => navigate(`/history/${expense.id}`)}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 active:scale-[0.98] transition-all cursor-pointer group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                <ShoppingBag className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{expense.name}</p>
                                <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold mt-1">
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{expense.category}</span>
                                    <span>•</span>
                                    <span className="uppercase">{new Date(expense.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <p className="font-black text-gray-900 text-right">RM {expense.amount.toFixed(2)}</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteExpense(expense.id);
                                }}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExpenseList;
