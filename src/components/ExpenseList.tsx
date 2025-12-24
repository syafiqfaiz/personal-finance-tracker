import React from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Trash2, ShoppingBag } from 'lucide-react';

const ExpenseList: React.FC = () => {
    const { expenses, deleteExpense } = useFinanceStore();

    if (expenses.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No expenses yet. Add one to get started!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h2 className="font-bold text-gray-700">Recent Transactions</h2>
            <div className="space-y-2">
                {expenses.map((expense) => (
                    <div key={expense.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <ShoppingBag className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{expense.name}</p>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded">{expense.category}</span>
                                    <span>•</span>
                                    <span>{new Date(expense.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <p className="font-bold text-gray-900">RM {expense.amount.toFixed(2)}</p>
                            <button
                                onClick={() => deleteExpense(expense.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
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
