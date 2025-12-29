import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIChat from '../components/AIChat';
import ExpenseForm from '../components/ExpenseForm';
import { Sparkles, Keyboard } from 'lucide-react';

import { useSettingsStore } from '../store/useSettingsStore';

const AddExpense: React.FC = () => {
    const { geminiKey } = useSettingsStore();
    const navigate = useNavigate();
    const [mode, setMode] = useState<'ai' | 'manual'>(geminiKey ? 'ai' : 'manual');

    const handleSuccess = () => {
        navigate('/history');
    };

    return (
        <div className="space-y-8 animate-slide-up pb-10">
            <header className="px-1 pt-4 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-serif text-slate-900">Add Entry</h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Record your spending</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
                    <button
                        onClick={() => setMode('ai')}
                        className={`p-2.5 rounded-full transition-all flex items-center justify-center ${mode === 'ai' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-600'}`}
                        title="AI Mode"
                    >
                        <Sparkles className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`p-2.5 rounded-full transition-all flex items-center justify-center ${mode === 'manual' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-600'}`}
                        title="Manual Mode"
                    >
                        <Keyboard className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {mode === 'ai' ? (
                    <div className="space-y-6">
                        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-700" />
                            <div className="relative z-10 space-y-3">
                                <div className="bg-purple-50 w-10 h-10 rounded-xl flex items-center justify-center text-purple-600">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                                    "I'm ready! Just tell me what you spent on, and I'll extract all the details for you instantly."
                                </p>
                            </div>
                        </div>
                        <AIChat onSuccess={handleSuccess} />
                    </div>
                ) : (
                    <ExpenseForm onSuccess={handleSuccess} />
                )}
            </div>
        </div>
    );
};

export default AddExpense;
