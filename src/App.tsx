import { useState, useEffect } from 'react'
import Settings from './components/Settings'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import CategoryManager from './components/CategoryManager'
import { useFinanceStore } from './store/useFinanceStore'
import { Settings as SettingsIcon, LayoutDashboard } from 'lucide-react'
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

      <main className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full space-y-8">
        {view === 'settings' ? (
          <Settings />
        ) : (
          <>
            <ExpenseForm />
            <CategoryManager />
            <ExpenseList />
          </>
        )}
      </main>
    </div>
  )
}

export default App
