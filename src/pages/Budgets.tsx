import React from 'react';
import BudgetManager from '../components/BudgetManager';
import Dashboard from '../components/Dashboard';

const Budgets: React.FC = () => {
    return (
        <div className="space-y-8">
            <header className="px-1">
                <h1 className="text-xl font-black text-blue-600 uppercase tracking-tight">Budgets</h1>
            </header>

            {/* Re-use the budget progress part of Dashboard */}
            <section className="animate-in slide-in-from-left-4 duration-300">
                <Dashboard />
            </section>

            <section className="animate-in slide-in-from-right-4 duration-300">
                <BudgetManager />
            </section>
        </div>
    );
};

export default Budgets;
