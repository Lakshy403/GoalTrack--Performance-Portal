import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import useAuthStore from '@/store/authStore';
import useThemeStore from '@/store/themeStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/lib/utils';
import {
  LayoutDashboard, Target, ClipboardCheck, FileText, Users, CheckSquare,
  BarChart3, Shield, Unlock, Send, AlertTriangle, FileDown, Activity,
  ChevronLeft, ChevronRight, LogOut, Settings,
} from 'lucide-react';

const employeeNav = [
  { to: '/employee', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/employee/goals', icon: Target, label: 'My Goals' },
  { to: '/employee/goal-sheet', icon: FileText, label: 'Goal Sheet' },
  { to: '/employee/check-in', icon: ClipboardCheck, label: 'Check-in' },
  { to: '/employee/profile', icon: Settings, label: 'Profile' },
];

const managerNav = [
  { to: '/manager', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/manager/team', icon: Users, label: 'My Team' },
  { to: '/manager/reviews', icon: CheckSquare, label: 'Reviews' },
  { to: '/manager/check-ins', icon: ClipboardCheck, label: 'Team Check-ins' },
  { to: '/manager/analytics', icon: BarChart3, label: 'Analytics' },
];

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/departments', icon: Activity, label: 'Departments' },
  { to: '/admin/unlock', icon: Unlock, label: 'Unlock Sheets' },
  { to: '/admin/shared-goals', icon: Send, label: 'Shared Goals' },
  { to: '/admin/escalations', icon: AlertTriangle, label: 'Escalations' },
  { to: '/admin/audit-logs', icon: Shield, label: 'Audit Logs' },
  { to: '/admin/reports', icon: FileDown, label: 'Reports' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

const navMap = { employee: employeeNav, manager: managerNav, admin: adminNav };

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();
  const location = useLocation();

  if (!user) return null;

  const navItems = navMap[user.role] || employeeNav;
  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-white/80 via-emerald-50/30 to-violet-50/20 dark:from-[#090E1A] dark:via-[#090E1A] dark:to-[#090E1A] border-r border-[hsl(var(--color-border))] flex flex-col transition-all duration-300 ease-out backdrop-blur-xl',
        collapsed ? 'w-[72px]' : 'w-[260px] max-md:w-[72px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[hsl(var(--color-border))]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 dark:bg-none dark:bg-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-teal-200/50 dark:shadow-blue-900/50">
            <Target className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in max-md:hidden">
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-teal-700 to-emerald-700 dark:from-blue-400 dark:to-blue-400 bg-clip-text text-transparent">
                GoalTrack
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5">
                Performance Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-teal-500/15 to-emerald-500/10 dark:from-blue-600/20 dark:to-blue-600/20 text-teal-800 dark:text-blue-300 shadow-sm border border-teal-200/60 dark:border-blue-800/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-[#131B2F]',
                (collapsed || !collapsed) && 'max-md:justify-center max-md:px-0',
                collapsed && 'justify-center px-0'
              )
            }
          >
            <item.icon className={cn('h-5 w-5 shrink-0 transition-transform group-hover:scale-110', collapsed && 'h-5 w-5')} />
            {!collapsed && <span className="animate-fade-in truncate max-md:hidden">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* User Profile & Actions */}
      <div className="p-3 space-y-2">
        <div className={cn('flex items-center gap-3 px-2 py-2', collapsed && 'justify-center px-0', 'max-md:justify-center max-md:px-0')}>
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-teal-200/50 dark:ring-blue-800/50">
            <AvatarFallback className="text-xs bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-slate-700 dark:to-slate-800 text-teal-800 dark:text-slate-200">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="overflow-hidden animate-fade-in max-md:hidden">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{user.role}</p>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50/80 dark:hover:bg-red-950/20 transition-colors cursor-pointer',
            collapsed && 'justify-center px-0',
            'max-md:justify-center max-md:px-0'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="max-md:hidden">Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-gradient-to-br from-white to-emerald-50 dark:from-slate-800 dark:to-slate-900 border border-[hsl(var(--color-border))] rounded-full p-1 shadow-md hover:shadow-lg transition-all cursor-pointer z-50"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" /> : <ChevronLeft className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />}
      </button>
    </aside>
  );
}
