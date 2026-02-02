import React from 'react';
import Settings from '../components/Settings';
import { Shield, Database, Repeat } from 'lucide-react';
import { APP_VERSION } from '../constants/app';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-8 pb-10">
            <header className="px-1 pt-4 pb-4 border-b border-slate-200">
                <h1 className="text-3xl font-serif text-slate-900">Settings</h1>
            </header>

            {/* Recurring Expenses Management */}
            <section className="space-y-4">
                <div className="flex items-center space-x-2 px-1">
                    <Repeat className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-bold font-jakarta text-slate-500 uppercase tracking-widest">Recurring Expenses</h2>
                </div>
                <div className="px-1">
                    <button
                        onClick={() => navigate('/recurring-expenses')}
                        className="w-full bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                                    <Repeat className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold font-jakarta text-slate-900 uppercase tracking-widest">Manage Templates</h3>
                                    <p className="text-[10px] text-slate-500 font-bold font-jakarta uppercase">Set up monthly recurring expenses</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>
                </div>
            </section>

            {/* API Keys & Cloud */}
            <section className="space-y-4">
                <div className="flex items-center space-x-2 px-1">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-bold font-jakarta text-slate-500 uppercase tracking-widest">Connectivity & Security</h2>
                </div>
                <Settings />
            </section>

            {/* App Info / Version */}
            <footer className="pt-8 border-t border-gray-100 text-center space-y-2">
                <div className="flex items-center justify-center space-x-2 text-slate-400">
                    <Database className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Local-First Storage Active</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Version {APP_VERSION}</p>
            </footer>
        </div>
    );
};

export default SettingsPage;
