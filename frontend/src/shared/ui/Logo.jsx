import { useId, useRef } from 'react';
import { gsap, useGSAP } from '../animations/gsap.js';
import { prefersReducedMotion } from '../animations/motion.js';
import { BRAND } from '../brand.js';
import {
  MARK_BODY, MARK_EYE_RX, MARK_EYE_RY, MARK_EYES, MARK_GLINT_R, MARK_SHINE,
  MARK_TUNNEL_TOP, MARK_TUNNEL_WIDTH, MARK_TUNNEL_XS, MARK_VIEWBOX,
} from './logoGeometry.js';

/**
 * The Milo mark: a glossy golden dome whose two tunnels make a lowercase "m"
 * (a little character on three legs), with a speech-bubble corner and two eyes.
 *
 * Layers (outer → inner) so GSAP and CSS never fight over one `transform`:
 *   .mascot-bob (CSS, thinking)  →  [data-body] (GSAP pop-in)
 *   .mascot-look (CSS, thinking) →  .mascot-eyes (CSS hover blink) → [data-eyes] (GSAP blinks)
 *
 * @param {object} props
 * @param {string} [props.className] Size classes, e.g. "size-8".
 * @param {boolean} [props.animate] On mount: pops in with a little squash, then blinks.
 * @param {boolean} [props.alive] Blinks every few seconds (use on a few hero places only).
 * @param {boolean} [props.thinking] Eyes look around and the bubble bobs (while Milo works).
 * @param {number} [props.delay] Seconds before the pop-in starts.
 * @param {string} [props.title] Accessible name. Leave empty when text next to it already says "Milo".
 */
export function LogoMark({ className = 'size-8', animate = false, alive = false, thinking = false, delay = 0, title }) {
  const id = useId().replace(/:/g, '');
  const body = `milo-body-${id}`;
  const shade = `milo-shade-${id}`;
  const shine = `milo-shine-${id}`;
  const tunnels = `milo-tunnels-${id}`;
  const svg = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const eyes = svg.current.querySelector('[data-eyes]');
    const blink = (tl, at) => tl
      .to(eyes, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.07, ease: 'power2.in' }, at)
      .to(eyes, { scaleY: 1, duration: 0.14, ease: 'power2.out' });

    if (animate) {
      const intro = gsap.timeline({ delay });
      intro.from(svg.current.querySelector('[data-body]'), {
        scale: 0, svgOrigin: '24 44', duration: 0.9, ease: 'back.out(2)', clearProps: 'transform',
      });
      intro.from(svg.current, { autoAlpha: 0, duration: 0.3, clearProps: 'opacity,visibility' }, 0);
      blink(intro, '-=0.15');
    }
    if (alive) {
      const idle = gsap.timeline({ repeat: -1, repeatDelay: 2.4, delay: delay + 3 });
      blink(idle, 0);
      blink(idle, 4.2);
      blink(idle, '+=0.12');
    }
  }, { scope: svg, dependencies: [animate, alive] });

  return (
    <svg
      ref={svg}
      viewBox={MARK_VIEWBOX}
      className={`mascot shrink-0 overflow-visible ${thinking ? 'mascot-thinking' : ''} ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <radialGradient id={body} cx="0.36" cy="0.26" r="0.9">
          <stop offset="0" style={{ stopColor: 'var(--color-mascot-light)' }} />
          <stop offset="0.45" style={{ stopColor: 'var(--color-mascot-mid)' }} />
          <stop offset="1" style={{ stopColor: 'var(--color-mascot-dark)' }} />
        </radialGradient>
        <radialGradient id={shade} cx="0.72" cy="0.9" r="0.6">
          <stop offset="0" style={{ stopColor: 'var(--color-mascot-shade)', stopOpacity: 0.35 }} />
          <stop offset="1" style={{ stopColor: 'var(--color-mascot-shade)', stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--color-mascot-glint)', stopOpacity: 0.85 }} />
          <stop offset="1" style={{ stopColor: 'var(--color-mascot-glint)', stopOpacity: 0 }} />
        </linearGradient>
        <mask id={tunnels} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <rect width="48" height="48" fill="white" />
          {MARK_TUNNEL_XS.map((x) => (
            <path key={x} d={`M${x} 52V${MARK_TUNNEL_TOP}`} stroke="black" strokeWidth={MARK_TUNNEL_WIDTH} strokeLinecap="round" />
          ))}
        </mask>
      </defs>
      <g className="mascot-bob">
        <g data-body>
          <g mask={`url(#${tunnels})`}>
            <path d={MARK_BODY} fill={`url(#${body})`} />
            <path d={MARK_BODY} fill={`url(#${shade})`} />
            <ellipse
              cx={MARK_SHINE.cx} cy={MARK_SHINE.cy} rx={MARK_SHINE.rx} ry={MARK_SHINE.ry}
              transform={`rotate(${MARK_SHINE.rotate} ${MARK_SHINE.cx} ${MARK_SHINE.cy})`}
              fill={`url(#${shine})`}
            />
          </g>
          <g className="mascot-look">
            <g className="mascot-eyes">
              <g data-eyes>
                {MARK_EYES.map((eye) => (
                  <g key={eye.cx}>
                    <ellipse cx={eye.cx} cy={eye.cy} rx={MARK_EYE_RX} ry={MARK_EYE_RY} style={{ fill: 'var(--color-mascot-eye)' }} />
                    <circle cx={eye.glintX} cy={eye.glintY} r={MARK_GLINT_R} style={{ fill: 'var(--color-mascot-glint)' }} />
                  </g>
                ))}
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

/** Mark + accessible name, for places that show the logo alone. */
export function Logo(props) {
  return <LogoMark title={BRAND.name} {...props} />;
}
