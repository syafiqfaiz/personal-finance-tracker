import React, { useState } from 'react';
import AIChat from '../components/AIChat';
import ExpenseForm from '../components/ExpenseForm';
import { Sparkles, Keyboard } from 'lucide-react';

const AddExpense: React.FC = () => {
    const [mode, setMode] = useState<'ai' | 'manual'>('ai');

    return (
        <div className="space-y-6">
            <header className="px-1 flex items-center justify-between">
                <h1 className="text-xl font-black text-blue-600 uppercase tracking-tight">Add Expense</h1>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setMode('ai')}
                        className={`p-2 rounded-lg transition-all ${mode === 'ai' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400'}`}
                    >
                        <Sparkles className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`p-2 rounded-lg transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                    >
                        <Keyboard className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="animate-in fade-in zoom-in-95 duration-300">
                {mode === 'ai' ? (
                    <div className="space-y-4">
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 italic text-xs text-purple-700">
                            "Tell me what you bought and how much it cost. I'll handle the rest."
                        </div>
                        <AIChat />
                    </div>
                ) : (
                    <ExpenseForm />
                )}
            </div>
        </div>
    );
};

export default AddExpense;
