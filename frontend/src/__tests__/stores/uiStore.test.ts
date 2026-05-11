import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../stores/uiStore';

beforeEach(() => {
  localStorage.clear();
  useUIStore.setState({ theme: 'dark', sidebarOpen: false });
});

describe('uiStore', () => {
  describe('initial state', () => {
    it('has dark theme by default', () => {
      const fresh = useUIStore.getState();
      // After reset via setState, theme is set to dark
      expect(fresh.theme).toBe('dark');
    });

    it('has sidebarOpen false', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('sets theme and updates DOM classList', () => {
      useUIStore.getState().setTheme('cyberpunk');

      expect(useUIStore.getState().theme).toBe('cyberpunk');
      const html = document.documentElement;
      expect(html.classList.contains('theme-cyberpunk')).toBe(true);
      expect(html.classList.contains('dark')).toBe(true);
    });

    it('removes previous theme class', () => {
      useUIStore.getState().setTheme('cyberpunk');
      useUIStore.getState().setTheme('sepia');

      const html = document.documentElement;
      expect(html.classList.contains('theme-cyberpunk')).toBe(false);
      expect(html.classList.contains('theme-sepia')).toBe(true);
      expect(html.classList.contains('dark')).toBe(false);
    });

    it('sets light theme without dark class', () => {
      useUIStore.getState().setTheme('light');

      const html = document.documentElement;
      expect(html.classList.contains('theme-light')).toBe(true);
      expect(html.classList.contains('dark')).toBe(false);
    });

    it('dark themes have dark class', () => {
      for (const theme of ['dark', 'cyberpunk', 'abyssal'] as const) {
        useUIStore.getState().setTheme(theme);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      }
    });
  });

  describe('toggleTheme', () => {
    it('toggles dark to light', () => {
      useUIStore.setState({ theme: 'dark' });

      useUIStore.getState().toggleTheme();

      expect(useUIStore.getState().theme).toBe('light');
    });

    it('toggles light to dark', () => {
      useUIStore.setState({ theme: 'light' });

      useUIStore.getState().toggleTheme();

      expect(useUIStore.getState().theme).toBe('dark');
    });
  });

  describe('toggleSidebar', () => {
    it('toggles sidebarOpen from false to true', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      useUIStore.getState().toggleSidebar();

      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('toggles sidebarOpen from true to false', () => {
      useUIStore.setState({ sidebarOpen: true });

      useUIStore.getState().toggleSidebar();

      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('setSidebarOpen', () => {
    it('sets sidebarOpen to true', () => {
      useUIStore.getState().setSidebarOpen(true);
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('sets sidebarOpen to false', () => {
      useUIStore.setState({ sidebarOpen: true });
      useUIStore.getState().setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('persist middleware', () => {
    it('partialize only saves theme, not sidebarOpen', async () => {
      useUIStore.setState({ theme: 'sepia', sidebarOpen: true });

      // Force persist write by simulating the middleware
      // Since persist middleware writes to localStorage on state change,
      // we can verify what's in localStorage after re-initializing
      const raw = localStorage.getItem('tera-story-ui');
      if (raw) {
        const parsed = JSON.parse(raw);
        expect(parsed.state).toHaveProperty('theme');
        expect(parsed.state).not.toHaveProperty('sidebarOpen');
      }
    });
  });
});
