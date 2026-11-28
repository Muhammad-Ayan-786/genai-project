import { Link } from 'react-router';
import { BRAND } from '../brand.js';
import { LogoMark } from './Logo.jsx';

/**
 * The full Milo logo: the mark + the lowercase wordmark in the serif.
 * @param {{ to?: string, size?: 'sm' | 'md' | 'lg', animate?: boolean, className?: string }} props
 */
export function Wordmark({ to = '/', size = 'md', animate = false, className = '' }) {
  const text = { sm: 'text-[22px]', md: 'text-[26px]', lg: 'text-[32px]' }[size];
  const mark = { sm: 'size-[22px]', md: 'size-7', lg: 'size-9' }[size];

  return (
    <Link
      to={to}
      aria-label={`${BRAND.name} home`}
      className={`mascot-host inline-flex items-center gap-2 rounded-full text-ink ${className}`}
    >
      <LogoMark className={mark} animate={animate} alive={animate} delay={0.15} />
      <span className={`font-serif ${text} leading-none font-normal tracking-[-0.02em]`}>{BRAND.wordmark}</span>
    </Link>
  );
}
