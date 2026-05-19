import { create } from 'zustand';

const useThemeStore = create((set) => ({
  theme: 'light',
  sidebarCollapsed: false,

  toggleTheme: () =>
    set((state) => {
      // Force light theme
      document.documentElement.classList.remove('dark');
      return { theme: 'light' };
    }),

  setTheme: (theme) => {
      document.documentElement.classList.remove('dark');
      set({ theme: 'light' });
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

export default useThemeStore;
