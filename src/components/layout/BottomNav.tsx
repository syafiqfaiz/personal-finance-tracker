import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, History, Plus, Target, Settings } from 'lucide-react';

const BottomNav: React.FC = () => {
    return (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 pointer-events-none">
            <nav className="max-w-[360px] mx-auto bg-white/90 backdrop-blur-xl border border-white/50 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center justify-between px-2 py-2 pointer-events-auto">
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center flex-1 py-2 transition-all ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`
                    }
                >
                    <Home className="w-5 h-5" />
                </NavLink>

                <NavLink
                    to="/expenses"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center flex-1 py-2 transition-all ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`
                    }
                >
                    <History className="w-5 h-5" />
                </NavLink>

                {/* Primary Action Button */}
                <NavLink
                    to="/add"
                    className={({ isActive }) =>
                        `flex items-center justify-center w-14 h-14 -mt-10 rounded-full bg-slate-900 shadow-[0_8px_20px_rgba(30,41,59,0.3)] transition-all ${isActive ? 'scale-110 bg-blue-600' : 'hover:scale-105 active:scale-95'
                        } text-white`
                    }
                >
                    <Plus className="w-7 h-7" />
                </NavLink>

                <NavLink
                    to="/budgets"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center flex-1 py-2 transition-all ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`
                    }
                >
                    <Target className="w-5 h-5" />
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center flex-1 py-2 transition-all ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`
                    }
                >
                    <Settings className="w-5 h-5" />
                </NavLink>
            </nav>
        </div>
    );
};

export default BottomNav;
