import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeModeProvider } from './theme/ThemeModeContext';
import Layout from './components/Layout';
import ProtectedRoute, { SessionLoader } from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Trade from './pages/Trade';
import Portfolio from './pages/Portfolio';
import Watchlist from './pages/Watchlist';
import Wallet from './pages/Wallet';
import History from './pages/History';
import Users from './pages/Users';
import { routeMeta } from './components/navigation';

/** Keeps the browser tab title in sync with the active route. */
function DocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const meta = routeMeta[pathname];
    document.title = meta ? `${meta.title} · Trading Platform` : 'Trading Platform';
  }, [pathname]);
  return null;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SessionLoader />;
  }

  return (
    <>
      <DocumentTitle />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="market" element={<Market />} />
          <Route path="trade" element={<Trade />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="history" element={<History />} />
          <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={4000}
        preventDuplicate
      >
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeModeProvider>
  );
}

