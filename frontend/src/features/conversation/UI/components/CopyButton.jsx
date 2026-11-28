import { Check, Copy } from 'lucide-react';
import { useCopy } from '../../Hooks/useChat.js';

/**
 * Small "Copy" action. `label` is the accessible name, e.g. "Copy reply" or "Copy code".
 * `tone="code"` is for the dark code-block header.
 */
export function CopyButton({ text, label = 'Copy', showText = true, tone = 'page', className = '' }) {
  const { copied, copy } = useCopy();
  const colors = tone === 'code'
    ? 'text-code-ink/60 hover:bg-code-line hover:text-code-ink'
    : 'text-faint hover:bg-raised hover:text-ink';
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-label={copied ? 'Copied' : label}
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-[opacity,background-color,color] duration-200 ${colors} ${className}`}
    >
      {copied
        ? <Check size={14} className="theme-icon text-honey" />
        : <Copy size={14} strokeWidth={1.7} />}
      {showText && <span aria-hidden="true">{copied ? 'Copied' : 'Copy'}</span>}
    </button>
  );
}
