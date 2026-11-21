/**
 * The Milo logo mark (speech bubble + down chevron) without the wordmark.
 * `thinking` makes the chevron drop on a loop, the chat's "I'm working on it" signal.
 * Fill comes from `currentColor`; `ink` colors the strokes.
 */
export function MiloMark({ className = 'size-7 text-forest', ink = 'var(--color-canvas)', thinking = false }) {
  return (
    <svg className={`${className} ${thinking ? 'mark-thinking' : ''}`} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="currentColor" />
      <path d="M12 12h16v13H17l-5 4V12Z" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      <path
        className="mark-chevron"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        d="m16 18 4 4 4-4"
        stroke={ink}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
