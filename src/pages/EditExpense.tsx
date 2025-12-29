import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import ExpenseForm from '../components/ExpenseForm';
import { ChevronLeft } from 'lucide-react';

const EditExpense: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { expenses } = useFinanceStore();

    const expense = expenses.find((e) => e.id === id);

    if (!expense) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500">Expense not found.</p>
                <button onClick={() => navigate('/history')} className="text-blue-600 font-bold mt-4">Go Back</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex items-center space-x-2">
                <button onClick={() => navigate(`/history/${id}`)} className="p-2 -ml-2 text-slate-500 hover:text-blue-600 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-serif text-slate-900">Edit Transaction</h1>
            </header>

            <ExpenseForm
                initialData={expense}
                onSuccess={() => navigate(`/history/${id}`)}
            />
        </div>
    );
};

export default EditExpense;
