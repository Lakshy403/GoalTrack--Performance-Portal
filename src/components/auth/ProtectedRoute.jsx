import { Navigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const redirectMap = { employee: '/employee', manager: '/manager', admin: '/admin' };
    return <Navigate to={redirectMap[user?.role] || '/login'} replace />;
  }

  return children;
}
