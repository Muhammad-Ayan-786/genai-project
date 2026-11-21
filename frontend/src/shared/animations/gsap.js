/**
 * The one place GSAP is set up. Always import gsap and useGSAP from here,
 * never straight from 'gsap', so plugins are registered exactly once.
 *
 * useGSAP is GSAP's React hook: like useEffect, but every animation created
 * inside it is cleaned up automatically when the component unmounts.
 */
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export { gsap, useGSAP };
