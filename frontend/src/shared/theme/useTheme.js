import { useCallback, useSyncExternalStore } from 'react';
import { currentTheme, setTheme, subscribeToTheme } from './theme.js';

/**
 * The current theme plus ways to change it. Re-renders when the theme
 * changes anywhere (another toggle, or the OS setting).
 *
 * @returns {{ theme: 'light' | 'dark', setTheme: (theme: 'light' | 'dark') => void, toggleTheme: () => void }}
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribeToTheme, currentTheme, () => 'light');
  const toggleTheme = useCallback(() => setTheme(currentTheme() === 'dark' ? 'light' : 'dark'), []);
  return { theme, setTheme, toggleTheme };
}
