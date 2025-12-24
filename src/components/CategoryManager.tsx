import React, { useState } from 'react';
import { useFinanceStore, SYSTEM_CATEGORY } from '../store/useFinanceStore';
import { Tag, X, Plus } from 'lucide-react';

const CategoryManager: React.FC = () => {
    const { categories, addCategory, deleteCategory } = useFinanceStore();
    const [newCat, setNewCat] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCat) {
            addCategory(newCat);
            setNewCat('');
        }
    };

    return (
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-6 animate-slide-up">
            <div className="flex items-center space-x-4 border-b border-slate-50 pb-4">
                <div className="bg-purple-50 p-3 rounded-2xl text-purple-600">
                    <Tag className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Expense Categories</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Personalize your logs</p>
                </div>
            </div>

            <form onSubmit={handleAdd} className="flex space-x-3">
                <input
                    type="text"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="New category..."
                    className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 py-3.5 px-5 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium transition-all"
                />
                <button type="submit" className="bg-slate-900 text-white p-3.5 rounded-2xl hover:bg-slate-800 shadow-sm transition-all active:scale-95">
                    <Plus className="w-5 h-5" />
                </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
                {categories.map((c) => (
                    <div key={c} className="flex items-center bg-white border border-slate-100 px-4 py-2 rounded-full shadow-sm group hover:border-blue-100 transition-all">
                        <span className="text-xs font-bold text-slate-600 mr-3 font-jakarta">{c}</span>
                        {c !== SYSTEM_CATEGORY && (
                            <button
                                onClick={() => { if (confirm(`Delete "${c}"?`)) deleteCategory(c); }}
                                className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic mt-4 text-center">
                * Deleting a category moves its expenses to "{SYSTEM_CATEGORY}".
            </p>
        </div>
    );
};

export default CategoryManager;
