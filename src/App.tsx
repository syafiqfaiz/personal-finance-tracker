import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import History from './pages/History'
import ExpenseDetail from './pages/ExpenseDetail'
import EditExpense from './pages/EditExpense'
import AddExpense from './pages/AddExpense'
import Budgets from './pages/Budgets'
import SettingsPage from './pages/SettingsPage'
import { useFinanceStore } from './store/useFinanceStore'
import './App.css'

function App() {
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
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<ExpenseDetail />} />
          <Route path="/history/:id/edit" element={<EditExpense />} />
          <Route path="/add" element={<AddExpense />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
