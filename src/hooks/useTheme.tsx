import React from 'react';
import { useThemeStore } from '../store/useThemeStore.ts';
import type { ThemeContextValue, ThemeMode } from '../types/common.ts';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Theme state and DOM synchronization are maintained in useThemeStore
  return <>{children}</>;
}

export function useTheme(): ThemeContextValue {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
