import { ArrowDown, Sparkles } from 'lucide-react';
import { PageShell } from './PageShell.jsx';
import { useReveal } from '../../../../shared/animations/useReveal.js';
import { useFloat } from '../../../../shared/animations/useFloat.js';

function ConversationArtwork() {
  const floating = useFloat({ delay: 1.2 });
  return (
    <div ref={floating} aria-hidden="true" className="relative mx-auto mt-12 w-full max-w-[390px] px-3 pb-3 pt-7">
      <div data-reveal className="absolute inset-x-10 top-0 h-28 rounded-2xl border border-art-line bg-art-back" />
      <div data-reveal className="absolute inset-x-6 top-3 h-28 rounded-2xl border border-art-line bg-art-mid" />
      <div data-reveal className="relative rounded-2xl border border-art-line bg-art-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-forest">
            <Sparkles size={16} /> A fresh perspective
          </div>
          <span className="size-6 rounded-full bg-sage p-1 text-forest"><ArrowDown size={16} /></span>
        </div>
        <div className="space-y-2.5">
          <div className="h-2 w-[88%] rounded-full bg-bar-strong" />
          <div className="h-2 w-[96%] rounded-full bg-bar-soft" />
          <div className="h-2 w-[62%] rounded-full bg-bar-soft" />
        </div>
        <div className="mt-7 flex gap-2">
          {['Explore', 'Reflect', 'Create'].map((label) => (
            <span key={label} className="rounded-full border border-line px-3 py-1 text-[10px] text-muted">{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuthLayout({ children }) {
  // Left panel: elements marked data-reveal rise in one by one.
  const panel = useReveal({ delay: 0.15 });
  // Right column: page text and each form field, in reading order (no markup changes needed in pages).
  const content = useReveal({ targets: ':scope > *:not(form), :scope form > fieldset > *' });
  return (
    <PageShell>
      <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_1fr] lg:gap-16 xl:gap-24">
        <section ref={panel} className="hidden min-h-[610px] flex-col justify-between rounded-[24px] bg-sage p-10 lg:flex xl:p-12">
          <div>
            <p data-reveal className="eyebrow flex items-center gap-2"><span className="size-1.5 rounded-full bg-forest" /> Your space to think</p>
            <h1 data-reveal className="mt-8 max-w-[400px] font-display text-[46px] leading-[1.16] font-semibold tracking-[-2px] xl:text-[52px]">
              Good ideas start with a little space.
            </h1>
            <p data-reveal className="mt-6 max-w-sm text-sm leading-7 text-muted">
              A quieter home for curious minds. We&apos;re building a place to explore ideas with your favorite AI models, all together.
            </p>
          </div>
          <ConversationArtwork />
          <div data-reveal className="mt-9 flex items-center gap-3 text-[11px] text-muted">
            <span className="h-px w-8 bg-bar-strong" />
            A little room for what comes next.
          </div>
        </section>
        <section ref={content} className="mx-auto w-full max-w-[400px] py-5 lg:py-10">
          {children}
        </section>
      </div>
    </PageShell>
  );
}
