import React, { useState } from 'react';
import {
    Sparkles,
    ArrowLeft,
    Send,
    Loader2,
    Code,
    Terminal,
    AlertCircle,
    Key
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../store/useSettingsStore';
import { DEFAULT_CATEGORIES } from '../store/useFinanceStore';
import { extractExpenseWithAI, type ExtractedExpense } from '../services/aiService';

const Playground: React.FC = () => {
    const { geminiKey } = useSettingsStore();
    const [apiKey, setApiKey] = useState(geminiKey || '');
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<ExtractedExpense | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showJson, setShowJson] = useState(true);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input || !apiKey) return;

        setIsProcessing(true);
        setError(null);
        setResult(null);

        try {
            const data = await extractExpenseWithAI(apiKey, input, DEFAULT_CATEGORIES);
            setResult(data);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message || 'AI failed to process. Check your API key.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden relative font-sans selection:bg-blue-100 selection:text-blue-900">
             {/* Ambient Background Effects (Light Mode) */}
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none opacity-60" />
             <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[120px] pointer-events-none opacity-60" />

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                {/* Header */}
                <header className="py-6 flex justify-between items-center">
                    <Link to="/welcome" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-md shadow-blue-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold font-jakarta text-xl tracking-tight text-slate-900">AI Playground</span>
                    </div>
                    <div className="w-24"></div> {/* Spacer for centering */}
                </header>

                <main className="py-12 flex flex-col items-center">
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <h1 className="text-4xl font-bold font-jakarta mb-4 text-slate-900">
                            Experience the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI Magic</span>
                        </h1>
                        <p className="text-slate-600 text-lg">
                            Test our conversational engine. See exactly how we transform natural language into structured financial data.
                        </p>
                    </div>

                    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Controls */}
                        <div className="space-y-6">
                            {/* API Key Input */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                                    <Key className="w-4 h-4" />
                                    Gemini API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your Gemini API Key"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Your key is used locally for this session. Get one from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.
                                </p>
                            </div>

                            {/* Chat Interface */}
                            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50">
                                <div className="flex items-center gap-3 mb-6">
                                     <div className="bg-purple-100 p-2 rounded-lg">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <h3 className="font-bold text-slate-900">Expense Assistant</h3>
                                </div>

                                <form onSubmit={handleSend} className="relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="e.g., Spent 12 on dinner at KFC"
                                        disabled={isProcessing}
                                        className="w-full bg-slate-50 rounded-2xl border border-slate-200 py-4 pl-6 pr-14 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-300 transition-all placeholder:text-slate-400"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input || isProcessing || !apiKey}
                                        className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all disabled:bg-slate-200 disabled:text-slate-400"
                                    >
                                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </form>

                                {error && (
                                    <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                <div className="mt-6 flex gap-2 flex-wrap">
                                    {['Lunch at McD 25', 'Grab to airport 65', 'Netflix subscription 45'].map(suggestion => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setInput(suggestion)}
                                            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-2 rounded-lg border border-slate-200 transition-colors"
                                        >
                                            "{suggestion}"
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Output */}
                        <div className="space-y-6">
                            {/* Visual Representation */}
                            <div className="bg-white p-1 rounded-[32px] border border-slate-200 shadow-lg">
                                <div className="flex border-b border-slate-100 p-2">
                                    <button
                                        onClick={() => setShowJson(false)}
                                        className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${!showJson ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        UI Preview
                                    </button>
                                    <button
                                        onClick={() => setShowJson(true)}
                                        className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${showJson ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        JSON Response
                                    </button>
                                </div>

                                <div className="p-6 min-h-[300px] flex items-center justify-center">
                                    {!result ? (
                                        <div className="text-center text-slate-400">
                                            <Terminal className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">Response will appear here</p>
                                        </div>
                                    ) : (
                                        showJson ? (
                                            <div className="w-full h-full bg-slate-900 rounded-xl p-4 overflow-x-auto">
                                                <pre className="text-xs text-green-400 font-mono leading-relaxed">
                                                    {JSON.stringify(result, null, 2)}
                                                </pre>
                                            </div>
                                        ) : (
                                             <div className="w-full bg-white rounded-[24px] shadow-sm border border-purple-100 overflow-hidden">
                                                <div className="bg-slate-900 p-5 flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="bg-purple-500/20 p-2 rounded-lg">
                                                            <Sparkles className="w-4 h-4 text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">AI Extraction</h4>
                                                        </div>
                                                    </div>
                                                    <div className={`text-[9px] uppercase font-black px-3 py-1 rounded-full border ${result.confidence === 'high' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                                        {result.confidence} Confidence
                                                    </div>
                                                </div>

                                                <div className="p-6 space-y-6">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Merchant</label>
                                                            <p className="text-2xl font-serif text-slate-900 leading-tight">{result.name}</p>
                                                        </div>
                                                        <div className="text-right space-y-1">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mr-1">Amount</label>
                                                            <p className="text-3xl font-black text-slate-900 tracking-tighter">
                                                                <span className="text-xs text-slate-400 mr-1 font-bold italic">RM</span>
                                                                {result.amount.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Category</label>
                                                            <span className="text-xs font-bold text-slate-700 font-jakarta">{result.category}</span>
                                                        </div>
                                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Date</label>
                                                            <p className="text-xs font-bold text-slate-700 font-jakarta">{new Date(result.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start">
                                <Code className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-blue-900 text-sm">Developer Note</h4>
                                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                        The AI response is strictly typed JSON, making it easy to integrate into your application state.
                                        We handle the parsing and validation logic for you.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Playground;
