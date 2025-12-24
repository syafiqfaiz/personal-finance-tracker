import React from 'react';
import BudgetManager from '../components/BudgetManager';
import BudgetProgress from '../components/BudgetProgress';

const Budgets: React.FC = () => {
    return (
        <div className="space-y-10 animate-slide-up pb-10">
            <header className="px-1 pt-4">
                <h1 className="text-4xl font-serif text-slate-900">Budgets</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Manage your limits</p>
            </header>

            <section className="space-y-8">
                <BudgetProgress showAll />
                <div className="border-t border-slate-100 pt-8 mt-8">
                    <BudgetManager />
                </div>
            </section>
        </div>
    );
};

export default Budgets;
