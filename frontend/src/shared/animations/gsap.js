/**
 * The one place GSAP is set up. Always import gsap and useGSAP from here,
 * never straight from 'gsap', so plugins are registered exactly once.
 *
 * useGSAP is GSAP's React hook: like useEffect, but every animation created
 * inside it is cleaned up automatically when the component unmounts.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);
// ScrollTrigger needs window.matchMedia, which jsdom (tests) lacks. Tests
// count as "reduced motion" anyway, so scroll animations never run there.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export { gsap, useGSAP, ScrollTrigger, SplitText };
