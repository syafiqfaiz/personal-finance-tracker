import { useState, useEffect } from 'react'
import Settings from './components/Settings'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import CategoryManager from './components/CategoryManager'
import BudgetManager from './components/BudgetManager'
import Dashboard from './components/Dashboard'
import AIChat from './components/AIChat'
import { useFinanceStore } from './store/useFinanceStore'
import { Settings as SettingsIcon, LayoutDashboard, Sparkles } from 'lucide-react'
import './App.css'

function App() {
  const [view, setView] = useState<'main' | 'settings'>('main');
  const { loadAppData, isLoading } = useFinanceStore();

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Tab Navigation */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black text-blue-600 uppercase tracking-tight">Finance Tracker</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setView('main')}
            className={`p-2 rounded-lg transition-colors ${view === 'main' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button
            onClick={() => setView('settings')}
            className={`p-2 rounded-lg transition-colors ${view === 'settings' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full space-y-8 pb-10">
        {view === 'settings' ? (
          <Settings />
        ) : (
          <>
            <Dashboard />

            <section className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Quick Entry</h2>
              </div>
              <AIChat />
            </section>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold">
                <span className="bg-gray-50 px-2 text-gray-400">or manual entry</span>
              </div>
            </div>

            <ExpenseForm />
            <CategoryManager />
            <BudgetManager />
            <ExpenseList />
          </>
        )}
      </main>
    </div>
  )
}

export default App
