import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExpenseCard from './ExpenseCard';
import MonthExpenseSnapshot from './MonthExpenseSnapshot';
import MonthlyBudgetProgress from './MonthlyBudgetProgress';


const Dashboard: React.FC = () => {
    const { expenses, budgets, categories } = useFinanceStore();
    const { userName } = useSettingsStore();
    const navigate = useNavigate();

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);


    // Get time-based greeting
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

    const monthlyExpenses = expenses.filter(e =>
        new Date(e.timestamp).toISOString().slice(0, 7) === currentMonth
    );



    const totalSpentMonth = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    // Calculate total budget and remaining balance
    const totalBudget = budgets
        .filter(b => b.monthPeriod === currentMonth)
        .reduce((sum, b) => sum + b.limit, 0);

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
                        {greeting},<br />{userName || 'User'}
                    </h1>

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

            {/* Monthly Budget Progress */}
            <MonthlyBudgetProgress totalSpent={totalSpentMonth} totalBudget={totalBudget} />

            {/* Monthly Snapshot */}
            <div className="mb-6">
                <MonthExpenseSnapshot
                    expenses={monthlyExpenses}
                    totalAmount={totalSpentMonth}
                    budgets={budgets.filter(b => b.monthPeriod === currentMonth)}
                />
            </div>

            {/* Recent Expenses */}
            <div className="pb-8">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-serif text-lg text-slate-900">Recent Expenses</h2>
                    <button
                        onClick={() => navigate('/expenses')}
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
                                onClick={() => navigate(`/expenses/${expense.id}`)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
