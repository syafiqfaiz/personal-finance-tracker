import React from 'react';
import Settings from '../components/Settings';
import { Shield, Database } from 'lucide-react';

const SettingsPage: React.FC = () => {
    return (
        <div className="space-y-8 pb-10">
            <header className="px-1 pt-4 pb-4 border-b border-slate-200">
                <h1 className="text-3xl font-serif text-slate-900">Settings</h1>
            </header>

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
                <p className="text-[10px] text-slate-400 font-medium">Version 1.2.0 • Build 20251224</p>
            </footer>
        </div>
    );
};

export default SettingsPage;
