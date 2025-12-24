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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2 mb-4">
                <Tag className="w-5 h-5 text-purple-600" />
                <h2 className="font-bold text-lg">Manage Categories</h2>
            </div>

            <form onSubmit={handleAdd} className="flex space-x-2">
                <input
                    type="text"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                />
                <button type="submit" className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700">
                    <Plus className="w-5 h-5" />
                </button>
            </form>

            <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                    <div key={c} className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm">
                        <span className="text-gray-700 mr-2">{c}</span>
                        {c !== SYSTEM_CATEGORY && (
                            <button
                                onClick={() => deleteCategory(c)}
                                className="text-gray-400 hover:text-red-500"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-gray-400 italic mt-2">
                * Deleting a category moves its expenses to "{SYSTEM_CATEGORY}".
            </p>
        </div>
    );
};

export default CategoryManager;
