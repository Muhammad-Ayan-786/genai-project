import { Check, Copy } from 'lucide-react';
import { useCopy } from '../../Hooks/useChat.js';

/** Small "Copy" action. `label` is the accessible name, e.g. "Copy reply" or "Copy code". */
export function CopyButton({ text, label = 'Copy', showText = true, className = '' }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-label={copied ? 'Copied' : label}
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted transition-colors hover:bg-sage hover:text-forest ${className}`}
    >
      {copied ? <Check size={14} className="text-forest" /> : <Copy size={14} />}
      {showText && <span aria-hidden="true">{copied ? 'Copied' : 'Copy'}</span>}
    </button>
  );
}
