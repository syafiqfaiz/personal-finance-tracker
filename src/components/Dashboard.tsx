import { useFinanceStore } from '../store/useFinanceStore';
import { Bell, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExpenseCard from './ExpenseCard';

const Dashboard: React.FC = () => {
    const { expenses, budgets, categories } = useFinanceStore();
    const navigate = useNavigate();

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const today = now.toISOString().slice(0, 10);

    // Get time-based greeting
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

    const monthlyExpenses = expenses.filter(e =>
        new Date(e.timestamp).toISOString().slice(0, 7) === currentMonth
    );

    const todayExpenses = expenses.filter(e =>
        new Date(e.timestamp).toISOString().slice(0, 10) === today
    );

    const totalSpentMonth = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSpentToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate total budget and remaining balance
    const totalBudget = budgets
        .filter(b => b.monthPeriod === currentMonth)
        .reduce((sum, b) => sum + b.limit, 0);
    const balance = totalBudget - totalSpentMonth;

    // Find exceeded budgets
    const exceededBudgets = categories.map(cat => {
        const spent = monthlyExpenses
            .filter(e => e.category === cat)
            .reduce((sum, e) => sum + e.amount, 0);
        const budget = budgets.find(b => b.category === cat && b.monthPeriod === currentMonth);
        const limit = budget?.limit || 0;
        const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        return { cat, spent, limit, percent };
    }).filter(b => b.limit > 0 && b.spent > b.limit);

    // Get recent 3 expenses
    const recentExpenses = [...expenses]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3);



    return (
        <div className="animate-slide-up">
            {/* Header */}
            <div className="pt-6 pb-4">
                <div className="flex justify-between items-start">
                    <h1 className="font-serif text-3xl text-slate-900">
                        {greeting},<br />User
                    </h1>
                    <button className="text-sm font-jakarta font-medium border border-slate-200 px-3 py-1 rounded-full text-slate-900 bg-white hover:bg-slate-50 transition-colors">
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Budget Alert */}
            {exceededBudgets.length > 0 && (
                <div className="mb-4 p-4 rounded-[20px] bg-red-100 border border-red-200 shadow-sm">
                    <div className="flex gap-3">
                        <div className="text-red-500">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900">
                                Budget Alert: {exceededBudgets[0].cat} Exceeded
                            </p>
                            <p className="text-sm text-slate-500">
                                You've spent RM {exceededBudgets[0].spent.toFixed(0)} this month ({exceededBudgets[0].percent}% of your RM {exceededBudgets[0].limit.toFixed(0)} limit).
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-[20px] text-center shadow-sm">
                    <p className="text-xs text-slate-500">Today</p>
                    <p className="font-bold font-jakarta text-lg whitespace-nowrap text-slate-900">RM {totalSpentToday.toFixed(0)}</p>
                </div>
                <div className="bg-white p-4 rounded-[20px] text-center shadow-sm">
                    <p className="text-xs text-slate-500">This Month</p>
                    <p className="font-bold font-jakarta text-lg whitespace-nowrap text-slate-900">RM {totalSpentMonth.toFixed(0)}</p>
                </div>
                <div className="bg-white p-4 rounded-[20px] text-center shadow-sm">
                    <p className="text-xs text-slate-500">Balance</p>
                    <p className={`font-bold font-jakarta text-lg whitespace-nowrap ${balance < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                        RM {balance.toFixed(0)}
                    </p>
                </div>
            </div>

            {/* AI Insight */}
            <div className="mb-6 p-4 rounded-[20px] bg-purple-100 border border-purple-200 shadow-sm">
                <div className="flex gap-3">
                    <div className="text-purple-600">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">AI Financial Insight</p>
                        <p className="text-sm text-slate-500">
                            {todayExpenses.length === 0
                                ? "No expenses recorded today. Start tracking to get personalized insights!"
                                : `Based on your spending this week, you're on track. You've recorded ${todayExpenses.length} expense${todayExpenses.length > 1 ? 's' : ''} today totaling RM ${totalSpentToday.toFixed(0)}. Keep it up!`
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Expenses */}
            <div className="pb-8">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-serif text-lg text-slate-900">Recent Expenses</h2>
                    <button
                        onClick={() => navigate('/history')}
                        className="text-xs text-slate-500 hover:text-slate-700"
                    >
                        See all
                    </button>
                </div>

                <div className="space-y-3">
                    {recentExpenses.length === 0 ? (
                        <div className="bg-white p-4 rounded-[20px] shadow-sm text-center text-slate-500 text-sm">
                            No expenses yet. Add your first expense!
                        </div>
                    ) : (
                        recentExpenses.map(expense => (
                            <ExpenseCard
                                key={expense.id}
                                expense={expense}
                                onClick={() => navigate(`/history/${expense.id}`)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
