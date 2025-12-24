import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ExpenseList from '../components/ExpenseList';
import { Search, Filter } from 'lucide-react';
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
        <div className="space-y-6 pb-4">
            <header className="px-1">
                <h1 className="text-xl font-black text-blue-600 uppercase tracking-tight">History</h1>
            </header>

            {/* Search & Filter Bar */}
            <div className="space-y-3">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search merchant or notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white rounded-2xl border-none shadow-sm py-4 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-900 border"
                    />
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar px-1">
                    <div className="flex-shrink-0 bg-white p-2.5 rounded-xl shadow-sm border border-gray-100">
                        <Filter className="w-4 h-4 text-gray-400" />
                    </div>
                    <button
                        onClick={() => handleCategoryChange('All')}
                        className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === 'All' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-gray-400 shadow-sm border border-gray-50 hover:text-gray-600'
                            }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-gray-400 shadow-sm border border-gray-50 hover:text-gray-600'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <ExpenseList filterCategory={selectedCategory === 'All' ? undefined : selectedCategory} searchQuery={searchQuery} />
        </div>
    );
};

export default History;
