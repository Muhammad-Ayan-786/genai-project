/**
 * Light / dark theme switching.
 *
 * - With no saved choice the app follows the operating system.
 * - Picking a theme saves it in localStorage (a display preference, not a
 *   secret, so that's fine) and sets <html data-theme="...">, which theme.css
 *   turns into `color-scheme`, which makes every light-dark() token flip.
 * - index.html runs a tiny copy of `readStoredTheme` before React loads, so
 *   the page never flashes the wrong theme.
 */

const STORAGE_KEY = 'milo-theme';
const CHANGE_EVENT = 'milo:themechange';

/** @typedef {'light' | 'dark'} Theme */

/** @returns {Theme | null} The saved choice, or null to follow the system. */
export function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/** @returns {Theme} What the operating system prefers. */
function systemTheme() {
  if (typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** @returns {Theme} The theme on screen right now. */
export function currentTheme() {
  return readStoredTheme() ?? systemTheme();
}

/**
 * Show and remember a theme. Colors cross-fade briefly unless the user
 * prefers reduced motion.
 * @param {Theme} theme
 */
export function setTheme(theme) {
  const root = document.documentElement;
  const calm = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!calm) {
    root.classList.add('theme-fading');
    window.setTimeout(() => root.classList.remove('theme-fading'), 450);
  }
  root.dataset.theme = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode or storage disabled: the theme still applies for this visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Subscribe to theme changes (our toggle or the OS setting).
 * @param {() => void} onChange
 * @returns {() => void} Unsubscribe.
 */
export function subscribeToTheme(onChange) {
  window.addEventListener(CHANGE_EVENT, onChange);
  const media = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
  media?.addEventListener?.('change', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    media?.removeEventListener?.('change', onChange);
  };
}
