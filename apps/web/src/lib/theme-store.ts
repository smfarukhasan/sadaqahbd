'use client';

import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',

  initTheme: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sadaqahbd_theme') as ThemeMode | null;
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.setAttribute('data-theme', saved);
        set({ theme: saved });
      } else {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        const initial = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', initial);
        set({ theme: initial });
      }
    }
  },

  setTheme: (theme: ThemeMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sadaqahbd_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme: ThemeMode = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('sadaqahbd_theme', nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
      }
      return { theme: nextTheme };
    });
  },
}));
