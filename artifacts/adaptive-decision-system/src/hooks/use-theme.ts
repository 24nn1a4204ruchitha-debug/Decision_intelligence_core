import { useCallback, useEffect, useState } from 'react';

export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'astra-theme';
const THEME_EVENT = 'astra-theme-change';

function readStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState<AppTheme>(readStoredTheme);

  useEffect(() => {
    const applyTheme = (nextTheme: AppTheme) => {
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      setThemeState(nextTheme);
    };

    const onThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<AppTheme>).detail;
      if (nextTheme === 'light' || nextTheme === 'dark') applyTheme(nextTheme);
    };

    applyTheme(theme);
    window.addEventListener(THEME_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_EVENT, onThemeChange);
  }, [theme]);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
    window.dispatchEvent(new CustomEvent<AppTheme>(THEME_EVENT, { detail: nextTheme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [setTheme, theme]);

  return { theme, setTheme, toggleTheme };
}