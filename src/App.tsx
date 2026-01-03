import React, { useEffect } from 'react'
import { Toaster } from 'sonner'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import History from './pages/History'
import ExpenseDetail from './pages/ExpenseDetail'
import EditExpense from './pages/EditExpense'
import AddExpense from './pages/AddExpense'
import Budgets from './pages/Budgets'
import SettingsPage from './pages/SettingsPage'
import { useFinanceStore } from './store/useFinanceStore'
import { useSettingsStore } from './store/useSettingsStore'
import { AnalyticsService } from './services/analytics'
import './App.css'

import LandingPage from './pages/LandingPage'

// Route Tracker Component
const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    AnalyticsService.logPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

// Auth Guard
const RequireUser = ({ children }: { children: React.ReactNode }) => {
  const { userName } = useSettingsStore();
  if (!userName) {
    return <Navigate to="/welcome" replace />;
  }
  return children;
};

function App() {
  const { loadAppData, isLoading: isFinanceLoading } = useFinanceStore();
  const { loadSettings, isLoading: isSettingsLoading } = useSettingsStore();

  useEffect(() => {
    // Initialize Analytics
    AnalyticsService.init();

    loadAppData();
    loadSettings();
  }, [loadAppData, loadSettings]);

  if (isFinanceLoading || isSettingsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <RouteTracker />
      <Toaster position="top-center" richColors />
      <Routes>
        {/* Public Route */}
        <Route path="/welcome" element={<LandingPage />} />

        {/* Protected App Routes */}
        <Route element={
          <RequireUser>
            <Layout />
          </RequireUser>
        }>
          <Route path="/" element={<Home />} />
          <Route path="/expenses" element={<History />} />
          <Route path="/expenses/:id" element={<ExpenseDetail />} />
          <Route path="/expenses/:id/edit" element={<EditExpense />} />
          <Route path="/add" element={<AddExpense />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all - Redirect to root (which checks for user) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
