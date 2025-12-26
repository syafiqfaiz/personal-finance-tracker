import React from 'react';
import CategoryBudgetManager from '../components/CategoryBudgetManager';

const Budgets: React.FC = () => {
    return (
        <div className="space-y-6 animate-slide-up pb-24">
            <header className="px-1 pt-4">
                <h1 className="text-3xl font-serif text-slate-900">Budgets</h1>
                <p className="text-sm text-slate-500 mt-1">Manage categories and spending limits</p>
            </header>

            <CategoryBudgetManager />
        </div>
    );
};

export default Budgets;
