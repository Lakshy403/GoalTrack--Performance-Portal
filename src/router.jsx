import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/auth/LoginPage';
import EmployeeDashboard from '@/pages/employee/EmployeeDashboard';
import MyGoals from '@/pages/employee/MyGoals';
import GoalSheet from '@/pages/employee/GoalSheet';
import CheckIn from '@/pages/employee/CheckIn';
import Profile from '@/pages/employee/Profile';
import ManagerDashboard from '@/pages/manager/ManagerDashboard';
import TeamPage from '@/pages/manager/TeamPage';
import ReviewsPage from '@/pages/manager/ReviewsPage';
import TeamCheckIns from '@/pages/manager/TeamCheckIns';
import ManagerAnalytics from '@/pages/manager/ManagerAnalytics';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import DepartmentsPage from '@/pages/admin/DepartmentsPage';
import UnlockPage from '@/pages/admin/UnlockPage';
import SharedGoalsPage from '@/pages/admin/SharedGoalsPage';
import EscalationsPage from '@/pages/admin/EscalationsPage';
import AuditLogsPage from '@/pages/admin/AuditLogsPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import useAuthStore from '@/store/authStore';

export default function AppRouter() {
  const { isAuthenticated, user } = useAuthStore();

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    const map = { employee: '/employee', manager: '/manager', admin: '/admin' };
    return map[user?.role] || '/login';
  };

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />} />

        {/* Employee Routes */}
        <Route path="/employee" element={<ProtectedRoute allowedRoles={['employee']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="goals" element={<MyGoals />} />
          <Route path="goal-sheet" element={<GoalSheet />} />
          <Route path="check-in" element={<CheckIn />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Manager Routes */}
        <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<ManagerDashboard />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="check-ins" element={<TeamCheckIns />} />
          <Route path="analytics" element={<ManagerAnalytics />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="unlock" element={<UnlockPage />} />
          <Route path="shared-goals" element={<SharedGoalsPage />} />
          <Route path="escalations" element={<EscalationsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>

        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
