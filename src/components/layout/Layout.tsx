import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
            {/* Scrollable Main Content */}
            <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
                <Outlet />
            </main>

            {/* Persistent Bottom Navigation */}
            <BottomNav />
        </div>
    );
};

export default Layout;
