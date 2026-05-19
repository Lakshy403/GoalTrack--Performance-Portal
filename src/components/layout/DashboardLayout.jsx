import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useThemeStore from '@/store/themeStore';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
  const { sidebarCollapsed } = useThemeStore();

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300 ease-out',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px] max-md:ml-[72px]'
        )}
      >
        <Header />
        <main className="p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
