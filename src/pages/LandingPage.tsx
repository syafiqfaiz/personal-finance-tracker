import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Zap,
    Smartphone,
    WifiOff,
    Download,
    Bot,
    Github,
    ChevronDown,
    ChevronUp,
    type LucideIcon
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import HeroChat from '../components/landing/HeroChat';

const FeatureCard = ({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) => (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold font-jakarta mb-2 text-slate-900">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden transition-all duration-200 hover:shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
                <span className="font-semibold text-slate-900">{question}</span>
                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            {isOpen && (
                <div className="px-6 pb-4 pt-1 text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                    {answer}
                </div>
            )}
        </div>
    );
};

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { setUserName } = useSettingsStore();
    const [name, setName] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);

    const handleGetStarted = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsAnimating(true);
        // Simulate a small delay for effect
        await new Promise(resolve => setTimeout(resolve, 800));
        await setUserName(name);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden relative font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none opacity-60" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[120px] pointer-events-none opacity-60" />

            <div className="container mx-auto px-6 max-w-7xl flex flex-col relative z-10">
                {/* Header */}
                <header className="py-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-md shadow-blue-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold font-jakarta text-xl tracking-tight text-slate-900">FinanceTracker</span>
                    </div>
                    <a
                        href="https://github.com/syafiqfaiz/personal-finance-tracker"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 hover:border-blue-200 shadow-sm"
                    >
                        <Github className="w-4 h-4" />
                        <span className="hidden sm:inline">Star on GitHub</span>
                    </a>
                </header>

                {/* Main Hero Section */}
                <main className="flex-1 flex flex-col lg:flex-row items-center gap-12 lg:gap-24 py-12 lg:py-20">
                    {/* Left: Text & Form */}
                    <div className="flex-1 space-y-10 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-[10px] font-bold uppercase tracking-widest text-purple-600 shadow-sm mx-auto lg:mx-0">
                            <Zap className="w-3 h-3" />
                            <span>AI Assisted Finance</span>
                        </div>

                        <div className="space-y-6">
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-jakarta leading-[1.1] tracking-tight text-slate-900">
                                Tracking expenses <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">is now a coversation.</span>
                            </h1>

                            <p className="text-slate-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Forget complex forms. Just tell our AI what you spent, and let it handle the data entry. Secure, private, and effortless.
                            </p>
                        </div>

                        {/* Onboarding Input */}
                        <form onSubmit={handleGetStarted} className="w-full max-w-md mx-auto lg:mx-0 relative group">
                            <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-slate-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300 shadow-xl shadow-slate-200/50">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="What should we call you?"
                                    className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 px-6 py-5 text-lg font-medium outline-none text-center lg:text-left"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!name.trim() || isAnimating}
                                className={`mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-xl shadow-blue-600/20 ${isAnimating ? 'scale-95 opacity-80' : 'hover:scale-[1.02]'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isAnimating ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Start Tracking
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                            <p className="mt-4 text-xs text-slate-500 flex items-center justify-center lg:justify-start gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Expenses stored locally on your device
                            </p>
                        </form>
                    </div>

                    {/* Right: Hero Chat Animation */}
                    <div className="flex-1 flex justify-center lg:justify-end relative">
                        {/* Decorative blobs behind phone */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[600px] bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />
                        <HeroChat />
                    </div>
                </main>

                {/* Feature Highlight Image Section */}
                <section className="py-20">
                    <div className="rounded-[40px] bg-slate-900 overflow-hidden shadow-2xl relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 pointer-events-none" />

                        <div className="relative z-10 p-8 md:p-12 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-widest text-white mb-6">
                                <Sparkles className="w-3 h-3" />
                                <span>See it in action</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 font-jakarta">Beautifully Intelligent.</h2>

                            <div className="mt-8 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 mx-auto max-w-4xl transform transition-transform duration-700 hover:scale-[1.01]">
                                <img
                                    src="/ai-expense-tracker.png"
                                    alt="AI Expense Tracker Interface"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 border-t border-slate-200">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold font-jakarta mb-4 text-slate-900">More than just a chatbot</h2>
                        <p className="text-slate-600">An entire financial system, simplified.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={Bot}
                            title="AI Enhanced"
                            description="Natural language processing that understands Malaysian context (Mamak, Nasi Lemak, etc)."
                        />
                        <FeatureCard
                            icon={Smartphone}
                            title="Mobile First"
                            description="A PWA that feels indistinguishable from a native app on iOS and Android."
                        />
                        <FeatureCard
                            icon={WifiOff}
                            title="Offline First"
                            description="No internet? No problem. Add expenses offline and sync when you're back."
                        />
                        <FeatureCard
                            icon={Download}
                            title="Installable"
                            description="Add to Home Screen for instant access. No app store downloads required."
                        />
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-20 border-t border-slate-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-3xl font-bold font-jakarta mb-4 text-slate-900">Frequently Asked Questions</h2>
                            <p className="text-slate-600 mb-8">
                                Common questions about how this app handles your data and privacy.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <FAQItem
                                question="Is it really private?"
                                answer="Yes. By default, all data lives in your browser's secure storage (IndexedDB). Nothing leaves your device unless you enable cloud sync."
                            />
                            <FAQItem
                                question="How does the AI work?"
                                answer="We use a secure, enterprise-grade AI model to process your text. We strip sensitive info before processing, ensuring your financial privacy."
                            />
                            <FAQItem
                                question="Is it free?"
                                answer="Currently, yes! We're fortunate to run on a zero-cost infrastructure, which allows us to provide all features—including AI—completely free. If our operating costs rise in the future, we might introduce a small plan to keep the lights on, but for now, enjoy it on the house!"
                            />
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm">
                    <p>© 2025 FinanceTracker. Version 0.2.0.</p>
                    <div className="flex items-center gap-6">
                        <a href="https://github.com/syafiqfaiz/personal-finance-tracker" className="hover:text-blue-600 transition-colors">GitHub</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
