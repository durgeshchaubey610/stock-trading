import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Screener from './pages/Screener';
import CentralDashboard from './pages/CentralDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Baskets from './pages/Baskets';
import Profile from './pages/Profile';
import StockDetail from './pages/StockDetail';
import FinanceLayout from './pages/finance/FinanceLayout';
import SavingsGoals from './pages/finance/SavingsGoals';
import InsurancePolicies from './pages/finance/InsurancePolicies';
import EmergencyFund from './pages/finance/EmergencyFund';
import FirePlanner from './pages/finance/FirePlanner';
import AlternativeProtection from './pages/finance/AlternativeProtection';
import NetWorthManager from './pages/finance/NetWorthManager';
import Backtester from './pages/Backtester';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<CentralDashboard />} />
                  <Route path="screener" element={<Screener />} />
                  <Route path="baskets" element={<Baskets />} />
                  <Route path="backtest" element={<Backtester />} />
                  <Route path="finance" element={<FinanceLayout />}>
                    <Route index element={<Navigate to="goals" replace />} />
                    <Route path="goals" element={<SavingsGoals />} />
                    <Route path="insurance" element={<InsurancePolicies />} />
                    <Route path="emergency-fund" element={<EmergencyFund />} />
                    <Route path="fire-planner" element={<FirePlanner />} />
                    <Route path="alternatives" element={<AlternativeProtection />} />
                    <Route path="networth" element={<NetWorthManager />} />
                  </Route>
                  <Route path="profile" element={<Profile />} />
                  <Route path="stock/:symbol" element={<StockDetail />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
