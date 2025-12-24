import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, History, Plus, Target, Settings } from 'lucide-react';

const BottomNav: React.FC = () => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around pb-safe-area-inset-bottom h-16 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50">
            <NavLink
                to="/"
                className={({ isActive }) =>
                    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'
                    }`
                }
            >
                <Home className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
            </NavLink>

            <NavLink
                to="/history"
                className={({ isActive }) =>
                    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'
                    }`
                }
            >
                <History className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">History</span>
            </NavLink>

            {/* Primary Action Button */}
            <NavLink
                to="/add"
                className={({ isActive }) =>
                    `flex flex-col items-center justify-center -mt-8 flex-shrink-0 w-14 h-14 rounded-full shadow-lg shadow-purple-200 transition-all ${isActive ? 'bg-purple-700 scale-110' : 'bg-purple-600 hover:scale-105'
                    } text-white`
                }
            >
                <Plus className="w-8 h-8" />
            </NavLink>

            <NavLink
                to="/budgets"
                className={({ isActive }) =>
                    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'
                    }`
                }
            >
                <Target className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Budgets</span>
            </NavLink>

            <NavLink
                to="/settings"
                className={({ isActive }) =>
                    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'
                    }`
                }
            >
                <Settings className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Settings</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
