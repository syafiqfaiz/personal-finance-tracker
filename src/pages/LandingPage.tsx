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
            {/* Ambient Background Effects (Light Mode) */}
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
                <main className="flex-1 flex flex-col justify-center items-center text-center py-20 lg:py-24">
                    <div className="max-w-4xl mx-auto space-y-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold uppercase tracking-widest text-blue-600 shadow-sm">
                            <Zap className="w-3 h-3" />
                            <span>Public Beta</span>
                        </div>

                        <div className="space-y-6">
                            <h1 className="text-5xl md:text-7xl font-bold font-jakarta leading-[1.1] tracking-tight text-slate-900">
                                Master your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">money flow.</span>
                            </h1>

                            <p className="text-slate-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                                Experience the clarity of intelligent expense tracking.
                                Built for privacy, powered by AI, and designed for your life.
                            </p>

                            <div>
                                <button
                                    onClick={() => navigate('/playground')}
                                    className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Try AI Demo
                                </button>
                            </div>
                        </div>

                        {/* Onboarding Input */}
                        <form onSubmit={handleGetStarted} className="w-full max-w-md mx-auto relative group">
                            <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-slate-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300 shadow-xl shadow-slate-200/50">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="What should we call you?"
                                    className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 px-6 py-5 text-lg font-medium outline-none text-center"
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
                            <p className="mt-4 text-xs text-slate-500 flex items-center justify-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Data stored locally on your device
                            </p>
                        </form>
                    </div>

                    {/* Screenshots Gallery */}
                    <div className="mt-24 w-full overflow-hidden">
                        <div className="flex gap-6 overflow-x-auto pb-12 pt-4 px-6 snap-x justify-start md:justify-center">
                            {[
                                '/app-preview2.png',
                                '/app-preview.png',
                                '/app-preview3.png',
                                '/app-preview4.png'
                            ].map((src, idx) => (
                                <div
                                    key={src}
                                    className={`relative flex-none w-[280px] md:w-[320px] rounded-[2.5rem] overflow-hidden border-8 border-slate-900 shadow-2xl transform transition-transform duration-500 hover:-translate-y-4 hover:rotate-0 bg-slate-900 ${idx % 2 === 0 ? '-rotate-3 mt-8' : 'rotate-3'
                                        }`}
                                >
                                    <img
                                        src={src}
                                        alt={`App Screen ${idx + 1}`}
                                        className="w-full h-auto object-cover"
                                    />
                                    {/* Glass Reflection */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                {/* Features Section */}
                <section className="py-20 border-t border-slate-200">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold font-jakarta mb-4 text-slate-900">Everything you need</h2>
                        <p className="text-slate-600">Powerful features wrapped in a minimalist design.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={WifiOff}
                            title="Offline First"
                            description="Track expenses anywhere, anytime. No internet connection required to add or view your data."
                        />
                        <FeatureCard
                            icon={Smartphone}
                            title="Mobile First"
                            description="Designed for your thumb. A fluid, app-like experience optimized for iOS and Android."
                        />
                        <FeatureCard
                            icon={Download}
                            title="Installable PWA"
                            description="Add to your home screen for a native app feel. Performance that rivals native apps."
                        />
                        <FeatureCard
                            icon={Bot}
                            title="AI Enhanced"
                            description="Just type naturally. 'Lunch RM25' automatically categorizes and logs the expense."
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
                            <a
                                href="https://github.com/syafiqfaiz/personal-finance-tracker"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                                Read full documentation <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="space-y-4">
                            <FAQItem
                                question="Where is my data stored?"
                                answer="Your data stays 100% on your device using IndexedDB. We do not have a central server. This 'Zero Backend' architecture ensures maximum privacy."
                            />
                            <FAQItem
                                question="Can I sync across devices?"
                                answer="Yes, but it's optional and controlled by you. You can configure your own AWS S3 bucket in settings to sync data between devices securely."
                            />
                            <FAQItem
                                question="Is it free?"
                                answer="Yes, this project is open source software. There are no subscriptions. You simply bring your own keys (Gemini, AWS) if you want advanced cloud features."
                            />
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm">
                    <p>© 2025 FinanceTracker. Open-sourced under MIT License.</p>
                    <div className="flex items-center gap-6">
                        <a href="https://github.com/syafiqfaiz/personal-finance-tracker" className="hover:text-blue-600 transition-colors">GitHub</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
