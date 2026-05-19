import { useEffect } from 'react';
import AppRouter from './router';
import { ToastProvider } from '@/components/ui/toast';
import useThemeStore from '@/store/themeStore';

export default function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}
