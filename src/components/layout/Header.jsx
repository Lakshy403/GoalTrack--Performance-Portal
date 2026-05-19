import { useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import useThemeStore from '@/store/themeStore';
import useAuthStore from '@/store/authStore';
import { Switch } from '@/components/ui/switch';
import { Bell, Search, Moon, Sun, CheckCircle2, AlertTriangle, Info, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { masterService } from '@/services/api';

const pageTitles = {
  '/employee': 'Employee Dashboard',
  '/employee/goals': 'My Goals',
  '/employee/goal-sheet': 'Goal Sheet',
  '/employee/check-in': 'Quarterly Check-in',
  '/employee/profile': 'Employee Profile',
  '/manager': 'Team Dashboard',
  '/manager/team': 'My Team',
  '/manager/reviews': 'Goal Reviews',
  '/manager/check-ins': 'Team Check-ins',
  '/manager/analytics': 'Analytics',
  '/admin': 'Admin Dashboard',
  '/admin/departments': 'Department Overview',
  '/admin/unlock': 'Unlock Goal Sheets',
  '/admin/shared-goals': 'Shared Goals',
  '/admin/escalations': 'Escalation Tracking',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/reports': 'Reports',
  '/admin/analytics': 'Analytics & Reporting',
};

export default function Header() {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const popupRef = useRef(null);

  const title = pageTitles[location.pathname] || 'Dashboard';
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    let active = true;
    masterService.getNotifications()
      .then(({ data }) => { if (active) setNotifications(data); })
      .catch(() => {});
    return () => { active = false; };
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const markRead = async (id) => {
    await masterService.markNotificationRead(id);
    setNotifications((items) => items.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const getIcon = (type) => {
    if (type === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    return <Info className="w-5 h-5 text-teal-600 dark:text-indigo-400" />;
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[hsl(var(--color-border))] bg-gradient-to-r from-white/60 via-emerald-50/30 to-violet-50/20 dark:from-[#090E1A] dark:via-[#090E1A] dark:to-[#090E1A] backdrop-blur-xl flex items-center justify-between px-6 shadow-sm">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{title}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5 font-medium">
          {user?.department} · {user?.designation}
        </p>
      </div>

      <div className="flex items-center gap-5">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 border border-teal-100/60 dark:border-slate-800 rounded-xl px-3 py-2 w-64 focus-within:ring-2 focus-within:ring-teal-500/20 dark:focus-within:ring-indigo-500/20 transition-all">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search goals, employees..."
            className="bg-transparent text-sm border-none outline-none w-full placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
          />
        </div>



        {/* Notifications */}
        <div className="relative" ref={popupRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className={cn("relative p-2 rounded-xl transition-colors cursor-pointer", open ? "bg-teal-50 dark:bg-indigo-900/20" : "hover:bg-white/60 dark:hover:bg-slate-900/50")}
            aria-label="Notifications"
          >
            <Bell className={cn("h-5 w-5", open ? "text-teal-700 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400")} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-gradient-to-r from-rose-500 to-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center shadow-sm">{unreadCount}</span>}
          </button>
          
          {open && (
            <div className="absolute right-0 top-12 w-96 rounded-2xl border border-teal-100 dark:border-slate-800 bg-gradient-to-br from-white/95 via-emerald-50/30 to-violet-50/20 dark:from-slate-900/95 dark:via-slate-900/95 dark:to-slate-900/95 backdrop-blur-xl shadow-2xl shadow-teal-200/20 dark:shadow-black/50 z-50 overflow-hidden animate-scale-in origin-top-right">
              <div className="p-4 border-b border-teal-100/60 dark:border-slate-800 flex justify-between items-center bg-white/30 dark:bg-slate-900/50">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Activity & Notifications</p>
                {unreadCount > 0 && <button onClick={() => notifications.forEach(n => !n.is_read && markRead(n.id))} className="text-xs text-teal-700 dark:text-indigo-400 hover:underline font-medium">Mark all read</button>}
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length ? notifications.slice(0, 8).map(n => (
                  <div key={n.id} onClick={() => markRead(n.id)} className={cn('w-full text-left p-4 border-b border-teal-50/60 dark:border-slate-800/50 transition-colors cursor-pointer group flex gap-3 items-start', !n.is_read ? 'bg-teal-50/40 dark:bg-indigo-900/10' : 'hover:bg-white/50 dark:hover:bg-slate-900/50')}>
                    <div className="shrink-0 mt-0.5">
                      {getIcon(n.type || 'info')}
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium", !n.is_read ? "text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-300")}>{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] flex items-center gap-1 text-slate-400"><Clock className="w-3 h-3" /> {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!n.is_read && (
                          <button className="text-[10px] font-semibold text-teal-700 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                            View Action
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-slate-800 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-teal-400 dark:text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-2">You're all caught up</p>
                    <p className="text-xs text-slate-500">No new notifications to review.</p>
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-teal-100/60 dark:border-slate-800 bg-white/30 dark:bg-slate-900/50 text-center">
                <button className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors py-1">View all activity</button>
              </div>
            </div>
          )}
        </div>
        
        {/* Profile Avatar */}
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 dark:from-indigo-500 dark:to-violet-500 flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:shadow-lg transition-shadow">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
      </div>
    </header>
  );
}
