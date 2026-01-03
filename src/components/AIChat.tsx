import React, { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { extractExpenseWithAI, type ExtractedExpense } from '../services/aiService';
import { Send, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRandomGreeting } from '../constants/greetings';

interface AIChatProps {
    onSuccess?: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

const AIChat: React.FC<AIChatProps> = ({ onSuccess }) => {
    const { categories, addExpense } = useFinanceStore();
    const { licenseKey } = useSettingsStore();

    const [messages, setMessages] = useState<Message[]>(() => [
        { id: Date.now().toString(), role: 'assistant', text: getRandomGreeting() }
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentContext, setCurrentContext] = useState<ExtractedExpense | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isProcessing]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !licenseKey) return;

        const userText = input.trim();
        setInput('');
        setError(null);

        // Add User Message
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
        setMessages(prev => [...prev, userMsg]);

        setIsProcessing(true);
        try {
            const result = await extractExpenseWithAI(userText, categories, currentContext);

            setCurrentContext(result);

            // Add AI Message
            if (result.responseText) {
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    text: result.responseText
                };
                setMessages(prev => [...prev, aiMsg]);
            }

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('AI failed to process.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = async () => {
        if (!currentContext) return;

        await addExpense({
            name: currentContext.name,
            amount: currentContext.amount,
            category: currentContext.category,
            tags: [],
            timestamp: new Date(currentContext.date),
            notes: currentContext.notes,
            paymentMethod: currentContext.paymentMethod || 'Cash',
            isTaxDeductible: false,
        });

        toast.success('Expense added via AI');
        // Reset state but keep chat history? Or reset everything? 
        // User might want to start fresh.
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: 'Expense added! What else?' }]);
        setCurrentContext(undefined);

        if (onSuccess) {
            onSuccess();
        }
    };

    const handleDiscard = () => {
        setCurrentContext(undefined);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: 'Cancelled. What else would you like to add?' }]);
    };

    if (!licenseKey) {
        return (
            <div className="bg-purple-50 p-8 rounded-[28px] border border-purple-100 text-center space-y-4 animate-slide-up">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-purple-100">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-purple-900 uppercase tracking-widest">License Required</h3>
                    <p className="text-xs text-purple-700 font-medium mt-2 leading-relaxed px-4">Provide a License Key in your profile to enable AI expense extraction.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex flex-col">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                            ? 'bg-slate-900 text-white rounded-br-none'
                            : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                            }`}>
                            {msg.role === 'assistant' && (
                                <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-50">
                                    <Sparkles className="w-3 h-3 text-purple-500" />
                                    <span className="text-[10px] font-black text-purple-900 uppercase tracking-widest">AI Assistant</span>
                                </div>
                            )}
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-slate-50 p-4 rounded-2xl rounded-bl-none flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={scrollRef} />
            </div>

            {/* ERROR */}
            {error && (
                <div className="flex items-center space-x-3 text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-bold tracking-tight">{error}</span>
                </div>
            )}

            {/* CONFIRMATION CARD (Only when confidence is high) */}
            {currentContext && currentContext.confidence === 'high' && (
                <div className="bg-white rounded-[20px] shadow-xl shadow-purple-900/5 border border-purple-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-500 flex-shrink-0">
                    <div className="bg-slate-900 px-4 py-3 flex items-center space-x-2">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Entry Preview</span>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-baseline">
                            <div className="space-y-0.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Merchant</label>
                                <p className="text-xl font-serif text-slate-900">{currentContext.name}</p>
                            </div>
                            <div className="text-right space-y-0.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</label>
                                <p className="text-xl font-black text-slate-900 tracking-tight">RM {currentContext.amount.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</span>
                                <span className="text-xs font-semibold text-slate-900">{currentContext.category}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</span>
                                <span className="text-xs font-semibold text-slate-900">
                                    {(() => {
                                        const d = new Date(currentContext.date);
                                        return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
                                    })()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment</span>
                                <span className="text-xs font-semibold text-slate-900">{currentContext.paymentMethod}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button onClick={handleDiscard} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-[10px] text-slate-600 hover:bg-slate-50 transition-colors">
                                Discard
                            </button>
                            <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl bg-slate-900 font-bold text-[10px] text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98]">
                                Confirm Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* INPUT AREA */}
            <form onSubmit={handleSend} className="relative group flex-shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={currentContext ? "Reply to refine..." : "Type expenses naturally..."}
                    className="w-full bg-white rounded-full border border-slate-200 shadow-sm py-4 pl-6 pr-14 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 text-sm font-medium transition-all placeholder:text-slate-400"
                    disabled={isProcessing}
                />
                <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white w-10 rounded-full flex items-center justify-center hover:bg-blue-700 transition-all disabled:bg-slate-100 disabled:text-slate-300 active:scale-95"
                    disabled={!input.trim() || isProcessing}
                >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </form>
        </div>
    );
};

export default AIChat;
