import { Moon, Sun } from 'lucide-react';
import { useTheme } from './useTheme.js';

/**
 * Round sun/moon button. The icon shows the theme you'd switch TO.
 * @param {{ className?: string }} props
 */
export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const Icon = next === 'dark' ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={`group inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface/70 text-muted transition-colors hover:border-line-strong hover:text-ink ${className}`}
    >
      <Icon key={theme} className="theme-icon size-[17px]" strokeWidth={1.6} aria-hidden="true" />
    </button>
  );
}
