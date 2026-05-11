import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme = 'light' | 'dark' | 'cyberpunk' | 'sepia' | 'abyssal';

interface UIState {
  theme: AppTheme;
  sidebarOpen: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}



export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarOpen: false,
      toggleTheme: () => {
        // Toggle loops through themes or just light/dark if simple toggle
        const current = get().theme;
        const newTheme = current === 'dark' ? 'light' : 'dark';
        get().setTheme(newTheme);
      },
      setTheme: (theme) => {
        const html = document.documentElement;
        html.classList.remove('theme-light', 'theme-dark', 'theme-cyberpunk', 'theme-sepia', 'theme-abyssal');
        html.classList.add(`theme-${theme}`);
        html.classList.toggle('dark', ['dark', 'cyberpunk', 'abyssal'].includes(theme));
        set({ theme });
      },
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'tera-story-ui',
      partialize: (state) => ({ theme: state.theme }), // only persist theme
    }
  )
);
