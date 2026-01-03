import { useState, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

const HeroChat = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setStep((prev) => (prev < 4 ? prev + 1 : prev));
        }, 1500); // Transitions every 1.5s

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-[320px] h-[600px] bg-slate-900 rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden flex flex-col">
            {/* Status Bar Mock */}
            <div className="h-6 w-full bg-slate-900 flex justify-between items-center px-6 pt-2">
                <div className="text-[10px] text-white font-medium">9:41</div>
                <div className="flex gap-1">
                    <div className="w-4 h-2.5 bg-white rounded-[1px]" />
                    <div className="w-0.5 h-2.5 bg-white/30 rounded-[1px]" />
                </div>
            </div>

            {/* App Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white leading-none">AI Tracker</h2>
                        <span className="text-[10px] text-slate-400">Online</span>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
                {/* Greeting */}
                <div className={`flex justify-start transition-all duration-500 transform ${step >= 0 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    <div className="max-w-[85%] bg-white p-3 rounded-2xl rounded-bl-none shadow-sm">
                        <div className="flex items-center space-x-2 mb-1">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span className="text-[10px] font-black text-purple-900 uppercase tracking-widest">AI Assistant</span>
                        </div>
                        <p className="text-xs text-slate-700">Hey! Ready to log today's expenses?</p>
                    </div>
                </div>

                {/* User Input */}
                <div className={`flex justify-end transition-all duration-500 delay-300 transform ${step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    <div className="max-w-[85%] bg-blue-600 text-white p-3 rounded-2xl rounded-br-none shadow-sm text-xs">
                        Nasi Lemak RM12.50
                    </div>
                </div>

                {/* Thinking State */}
                {step === 2 && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-white/10 p-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                            <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                            <span className="text-[10px] text-slate-400 font-medium">AI is thinking...</span>
                        </div>
                    </div>
                )}

                {/* Response & Card */}
                {step >= 3 && (
                    <div className={`flex justify-start transition-all duration-500 transform ${step >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <div className="w-full max-w-[90%] space-y-2">
                            {/* Card */}
                            <div className="bg-white rounded-2xl p-4 shadow-lg border-l-4 border-purple-500 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <Sparkles className="w-12 h-12 text-purple-600" />
                                </div>
                                <div className="relative z-10">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Entry Preview</div>
                                    <div className="flex justify-between items-baseline mb-3">
                                        <h3 className="text-lg font-bold text-slate-900">Nasi Lemak</h3>
                                        <span className="text-lg font-black text-purple-600">RM 12.50</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold uppercase">Food</span>
                                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">Cash</span>
                                    </div>
                                </div>
                            </div>

                            {/* Confirmation Text */}
                            {step >= 4 && (
                                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm animate-slide-up">
                                    <p className="text-xs text-slate-700">Tracked! Want to add anything else?</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Input Bar (Static) */}
            <div className="p-4 bg-slate-800/50 backdrop-blur-md border-t border-white/5">
                <div className="bg-slate-900/50 rounded-full h-10 flex items-center px-4 border border-white/10">
                    <span className="text-xs text-slate-500">Type expenses...</span>
                    <div className="ml-auto w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Send className="w-3 h-3 text-white" />
                    </div>
                </div>
                <div className="w-1/3 h-1 bg-white/20 mx-auto mt-4 rounded-full" />
            </div>
        </div>
    );
};

export default HeroChat;
