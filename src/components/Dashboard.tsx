import React from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Wallet, TrendingUp, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { expenses, budgets, categories } = useFinanceStore();

    const currentMonth = new Date().toISOString().slice(0, 7);

    const monthlyExpenses = expenses.filter(e =>
        new Date(e.timestamp).toISOString().slice(0, 7) === currentMonth
    );

    const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryStats = categories.map(cat => {
        const spent = monthlyExpenses
            .filter(e => e.category === cat)
            .reduce((sum, e) => sum + e.amount, 0);

        const budget = budgets.find(b => b.category === cat && b.monthPeriod === currentMonth);
        const limit = budget?.limit || 0;
        const percent = limit > 0 ? (spent / limit) * 100 : 0;

        return { cat, spent, limit, percent };
    }).filter(s => s.spent > 0 || s.limit > 0);

    return (
        <div className="space-y-6">
            {/* Total Card */}
            <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Total Spent This Month</p>
                    <h2 className="text-4xl font-black">RM {totalSpent.toFixed(2)}</h2>
                    <div className="flex items-center mt-4 space-x-4">
                        <div className="flex items-center space-x-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                            <TrendingUp className="w-3 h-3" />
                            <span>{monthlyExpenses.length} Transactions</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                            <Wallet className="w-3 h-3" />
                            <span>RM only</span>
                        </div>
                    </div>
                </div>
                <Wallet className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
            </div>

            {/* Budget Progress */}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Budget Progress</h3>
                <div className="grid grid-cols-1 gap-4">
                    {categoryStats.length === 0 ? (
                        <p className="text-center text-gray-400 py-4 text-sm italic">No budget data for this month.</p>
                    ) : (
                        categoryStats.map(stat => (
                            <div key={stat.cat} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 uppercase block">{stat.cat}</span>
                                        <span className="font-bold text-gray-900">RM {stat.spent.toFixed(2)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-400 block">LIMIT: {stat.limit > 0 ? `RM ${stat.limit.toFixed(2)}` : 'N/A'}</span>
                                        {stat.limit > 0 && stat.percent > 100 && (
                                            <span className="text-[10px] text-red-500 font-bold flex items-center justify-end gap-1">
                                                <AlertTriangle className="w-2 h-2" /> OVER BUDGET
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {stat.limit > 0 && (
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${stat.percent > 100 ? 'bg-red-500' : stat.percent > 80 ? 'bg-orange-400' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(stat.percent, 100)}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
