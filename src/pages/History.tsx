import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ExpenseList from '../components/ExpenseList';
import { Search, Calendar, ChevronDown } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';

const History: React.FC = () => {
    const { categories } = useFinanceStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');

    // Get current date for defaults
    const now = new Date();
    const currentYear = now.getFullYear();


    // Month/Year filter state
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null = All months
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);

    // Sync state with URL params
    const selectedCategory = searchParams.get('category') || 'All';

    const handleCategoryChange = (cat: string) => {
        if (cat === 'All') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', cat);
        }
        setSearchParams(searchParams);
    };

    // Generate year options (last 5 years)
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

    // Month names
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="space-y-6 pb-4 animate-slide-up">
            <header className="px-1 pt-4 pb-4 border-b border-slate-200">
                <h1 className="text-3xl font-serif text-slate-900">Expense</h1>
                <p className="text-sm text-slate-500 mt-1">Track and manage your spending</p>
            </header>

            {/* Search & Filter Bar */}
            <div className="space-y-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-900 transition-all"
                    />
                </div>

                {/* Month/Year Filter */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div className="relative flex-1">
                        <select
                            value={selectedMonth === null ? '' : selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value === '' ? null : parseInt(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-10 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none"
                        >
                            <option value="">All Months</option>
                            {months.map((month, index) => (
                                <option key={month} value={index}>{month}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-10 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none"
                        >
                            {yearOptions.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar px-1">
                    <button
                        onClick={() => handleCategoryChange('All')}
                        className={`flex-shrink-0 px-6 py-2 rounded-full text-xs font-bold font-jakarta transition-all ${selectedCategory === 'All' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-500 border border-slate-200'
                            }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            className={`flex-shrink-0 px-6 py-2 rounded-full text-xs font-bold font-jakarta transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-1">
                <ExpenseList
                    filterCategory={selectedCategory === 'All' ? undefined : selectedCategory}
                    searchQuery={searchQuery}
                    filterMonth={selectedMonth}
                    filterYear={selectedYear}
                />
            </div>
        </div>
    );
};

export default History;
