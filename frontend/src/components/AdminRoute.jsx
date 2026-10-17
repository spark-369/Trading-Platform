import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SessionLoader } from './ProtectedRoute';

export default function AdminRoute({ children }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SessionLoader />;
  }

  if (!user || !hasRole('ROLE_ADMIN')) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children;
}

