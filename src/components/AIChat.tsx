import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { extractExpenseWithAI, type ExtractedExpense } from '../services/aiService';
import { Send, Sparkles, Check, X, AlertCircle, Loader2, MessageSquare } from 'lucide-react';

import { toast } from 'sonner';

interface AIChatProps {
    onSuccess?: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ onSuccess }) => {
    const { categories, addExpense } = useFinanceStore();
    const { geminiKey } = useSettingsStore();

    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [suggestion, setSuggestion] = useState<ExtractedExpense | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input || !geminiKey) return;

        setIsProcessing(true);
        setError(null);
        try {
            const result = await extractExpenseWithAI(geminiKey, input, categories);
            setSuggestion(result);
            setInput('');
        } catch (err: any) {
            setError(err.message || 'AI failed to process. Check your API key.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = async () => {
        if (!suggestion) return;

        await addExpense({
            name: suggestion.name,
            amount: suggestion.amount,
            category: suggestion.category,
            tags: [],
            timestamp: new Date(suggestion.date),
            notes: suggestion.notes,
            paymentMethod: 'Cash',
            isTaxDeductible: false,
        });

        toast.success('Expense added via AI');
        setSuggestion(null);

        if (onSuccess) {
            onSuccess();
        }
    };

    if (!geminiKey) {
        return (
            <div className="bg-purple-50 p-8 rounded-[28px] border border-purple-100 text-center space-y-4 animate-slide-up">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-purple-100">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-purple-900 uppercase tracking-widest">AI Intelligence Disabled</h3>
                    <p className="text-xs text-purple-700 font-medium mt-2 leading-relaxed px-4">Provide a Google Gemini API Key in your profile to enable voice/text expense extraction.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Chat Input */}
            <form onSubmit={handleSend} className="relative group">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., Spent 12 on dinner at KFC"
                    className="w-full bg-white rounded-full border border-slate-100 shadow-lg shadow-slate-100/50 py-5 pl-8 pr-16 outline-none focus:ring-4 focus:ring-purple-500/5 focus:border-purple-200 text-sm font-medium text-slate-700 transition-all placeholder:text-slate-300"
                    disabled={isProcessing || !!suggestion}
                />
                <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 bg-slate-900 text-white w-12 rounded-full flex items-center justify-center hover:bg-slate-800 transition-all disabled:bg-slate-100 disabled:text-slate-300 active:scale-95 translate-x-0"
                    disabled={!input || isProcessing || !!suggestion}
                >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                </button>
            </form>

            {error && (
                <div className="flex items-center space-x-3 text-red-600 text-xs bg-red-50 p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-bold tracking-tight">{error}</span>
                </div>
            )}

            {/* AI Suggestion Card */}
            {suggestion && (
                <div className="bg-white rounded-[28px] shadow-xl shadow-purple-900/5 border border-purple-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-slate-900 p-5 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-purple-500/20 p-2 rounded-lg">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">AI Extraction</h4>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Ready for review</p>
                            </div>
                        </div>
                        <div className={`text-[9px] uppercase font-black px-3 py-1 rounded-full border ${suggestion.confidence === 'high' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                            {suggestion.confidence} Confidence
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Merchant</label>
                                <p className="text-2xl font-serif text-slate-900 leading-tight">{suggestion.name}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mr-1">Amount</label>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter">
                                    <span className="text-xs text-slate-400 mr-1 font-bold italic">RM</span>
                                    {suggestion.amount.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Category</label>
                                <span className="text-xs font-bold text-slate-700 font-jakarta">{suggestion.category}</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Date</label>
                                <p className="text-xs font-bold text-slate-700 font-jakarta">{new Date(suggestion.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                        </div>

                        {suggestion.missingFields.length > 0 && (
                            <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50 flex items-start space-x-3">
                                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                <div className="text-[10px] text-orange-800 font-medium leading-relaxed">
                                    <span className="font-black uppercase tracking-tight block mb-0.5">Missing Info</span>
                                    AI couldn't find: {suggestion.missingFields.join(', ')}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={() => setSuggestion(null)}
                                className="bg-white border border-slate-100 py-4 rounded-full font-black text-[10px] text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Discard</span>
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="bg-slate-900 py-4 rounded-full font-black text-[10px] text-white uppercase tracking-widest shadow-lg shadow-slate-100 hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
                            >
                                <Check className="w-3.5 h-3.5" />
                                <span>Confirm Entry</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State / Prompt */}
            {!suggestion && !isProcessing && (
                <div className="flex items-center justify-center space-x-3 text-slate-300 py-4">
                    <MessageSquare className="w-4 h-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Try "Lunch at KFC for 25 RM"</p>
                </div>
            )}
        </div>
    );
};

export default AIChat;
