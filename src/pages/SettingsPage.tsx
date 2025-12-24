import React from 'react';
import Settings from '../components/Settings';
import CategoryManager from '../components/CategoryManager';
import { Shield, BookOpen, Database } from 'lucide-react';

const SettingsPage: React.FC = () => {
    return (
        <div className="space-y-8 pb-10">
            <header className="px-1 font-black text-blue-600 uppercase tracking-tight">
                <h1 className="text-xl">Settings</h1>
            </header>

            {/* API Keys & Cloud */}
            <section className="space-y-4">
                <div className="flex items-center space-x-2 px-1">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Connectivity & Security</h2>
                </div>
                <Settings />
            </section>

            {/* Category Management */}
            <section className="space-y-4">
                <div className="flex items-center space-x-2 px-1">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Organization</h2>
                </div>
                <CategoryManager />
            </section>

            {/* App Info / Version */}
            <footer className="pt-8 border-t border-gray-100 text-center space-y-2">
                <div className="flex items-center justify-center space-x-2 text-gray-300">
                    <Database className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Local-First Storage Active</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Version 1.2.0 • Build 20251224</p>
            </footer>
        </div>
    );
};

export default SettingsPage;
