import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ExpenseList from '../components/ExpenseList';
import { Search } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';

const History: React.FC = () => {
    const { categories } = useFinanceStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');

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

    return (
        <div className="space-y-6 pb-4 animate-slide-up">
            <header className="px-1 pt-4">
                <h1 className="text-3xl font-serif text-slate-900 border-b border-slate-100 pb-4">Logs</h1>
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

                <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar px-1">
                    <button
                        onClick={() => handleCategoryChange('All')}
                        className={`flex-shrink-0 px-6 py-2 rounded-full text-xs font-bold font-jakarta transition-all ${selectedCategory === 'All' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-400 border border-slate-100'
                            }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            className={`flex-shrink-0 px-6 py-2 rounded-full text-xs font-bold font-jakarta transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-400 border border-slate-100'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-1">
                <ExpenseList filterCategory={selectedCategory === 'All' ? undefined : selectedCategory} searchQuery={searchQuery} />
            </div>
        </div>
    );
};

export default History;
