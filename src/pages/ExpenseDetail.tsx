import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ChevronLeft, Edit3, Trash2, Calendar, Tag, CreditCard, FileText } from 'lucide-react';

const ExpenseDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { expenses, deleteExpense } = useFinanceStore();

    const expense = expenses.find((e) => e.id === id);

    if (!expense) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Expense not found.</p>
                <button onClick={() => navigate('/history')} className="text-blue-600 font-bold mt-4">Go Back</button>
            </div>
        );
    }

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            await deleteExpense(expense.id);
            navigate('/history');
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <button onClick={() => navigate('/history')} className="p-2 -ml-2 text-gray-400 hover:text-blue-600 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex space-x-2">
                    <Link
                        to={`/history/${expense.id}/edit`}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                        <Edit3 className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-100 border border-gray-50 space-y-8 animate-in zoom-in-95">
                <div className="text-center space-y-2">
                    <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2">
                        {expense.category}
                    </div>
                    <h2 className="text-3xl font-black text-gray-900">{expense.name}</h2>
                    <p className="text-4xl font-black text-blue-600">RM {expense.amount.toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gray-50 p-3 rounded-2xl text-gray-400">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                            <p className="font-bold text-gray-900">{new Date(expense.timestamp).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="bg-gray-50 p-3 rounded-2xl text-gray-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Method</p>
                            <p className="font-bold text-gray-900">{expense.paymentMethod}</p>
                        </div>
                    </div>

                    {expense.tags && expense.tags.length > 0 && (
                        <div className="flex items-center space-x-4">
                            <div className="bg-gray-50 p-3 rounded-2xl text-gray-400">
                                <Tag className="w-5 h-5" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {expense.tags.map(tag => (
                                    <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold">#{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {expense.notes && (
                        <div className="flex items-start space-x-4">
                            <div className="bg-gray-50 p-3 rounded-2xl text-gray-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes</p>
                                <p className="text-sm font-medium text-gray-600 italic bg-gray-50 p-3 rounded-xl mt-1 border border-gray-100">"{expense.notes}"</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpenseDetail;
