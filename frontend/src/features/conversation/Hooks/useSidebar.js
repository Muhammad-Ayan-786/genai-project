import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'milo-sidebar';
const DESKTOP = '(min-width: 1024px)'; // Tailwind's `lg`

function readCollapsed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

/**
 * Desktop sidebar: expanded (full list) or collapsed (slim icon rail).
 * The choice is a display preference, so it is remembered in localStorage.
 * @returns {{ collapsed: boolean, toggleCollapsed: () => void }}
 */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((was) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, was ? 'expanded' : 'collapsed');
      } catch {
        // Storage blocked: the toggle still works for this visit.
      }
      return !was;
    });
  }, []);

  return { collapsed, toggleCollapsed };
}

/**
 * True on large screens (where the sidebar is docked instead of a drawer).
 * Environments without matchMedia (jsdom in tests) count as small screens.
 * @returns {boolean}
 */
export function useIsDesktop() {
  const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const [desktop, setDesktop] = useState(() => supported && window.matchMedia(DESKTOP).matches);

  useEffect(() => {
    if (!supported) return undefined;
    const query = window.matchMedia(DESKTOP);
    const update = () => setDesktop(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [supported]);

  return desktop;
}
