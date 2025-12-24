import React from 'react';
import Dashboard from '../components/Dashboard';

const Home: React.FC = () => {
    return (
        <div className="space-y-6">
            <header className="px-1">
                <h1 className="text-xl font-black text-blue-600 uppercase tracking-tight">Overview</h1>
            </header>
            <Dashboard />
        </div>
    );
};

export default Home;
