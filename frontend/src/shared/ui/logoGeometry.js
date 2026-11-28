// Geometry of the Milo mark: a glossy golden dome whose two tunnels turn it
// into a lowercase "m" (three little legs), with one sharp bottom-left corner
// like a speech bubble, and two eyes above the tunnels. Kept apart from
// Logo.jsx so the static copies (public/favicon.svg, public/brand/*) are
// generated from the same numbers.

export const MARK_VIEWBOX = '0 0 48 48';

/** The dome: round top, round bottom-right, sharp bottom-left (the "bubble" corner). */
export const MARK_BODY = 'M4 24A20 20 0 0 1 44 24A20 20 0 0 1 24 44H4Z';

/** The two tunnels cut up through the base (round-topped), which make the "m". */
export const MARK_TUNNEL_XS = [17.5, 30.5];
export const MARK_TUNNEL_TOP = 27;
export const MARK_TUNNEL_WIDTH = 5;

/** Eyes: two tall ovals above the tunnels, each with a small white glint. */
export const MARK_EYES = [
  { cx: 17.5, cy: 16.5, glintX: 18.4, glintY: 15.1 },
  { cx: 30.5, cy: 16.5, glintX: 31.4, glintY: 15.1 },
];
export const MARK_EYE_RX = 2.5;
export const MARK_EYE_RY = 3.4;
export const MARK_GLINT_R = 0.95;

/** The glossy highlight on the top left of the dome. */
export const MARK_SHINE = { cx: 15, cy: 10.5, rx: 7.6, ry: 3.2, rotate: -28 };
