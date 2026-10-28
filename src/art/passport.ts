/** Passport stamp artwork. Returns an <svg> string. */
export function stampSvg(label: string, accent: string, cls = ''): string {
  const landmark = label === 'RIO'
    ? `<path d="M-16 10 Q-8 -14 0 -2 Q6 -16 16 10 Z" fill="${accent}" opacity="0.9"/><path d="M-12 10 Q-4 -6 2 2" stroke="#FFF6E8" stroke-width="1.2" fill="none"/>`
    : `<path d="M-18 10 Q0 -16 18 10" stroke="${accent}" stroke-width="3.5" fill="none"/><rect x="-18" y="-4" width="36" height="3" fill="${accent}"/><g stroke="${accent}" stroke-width="1.5"><path d="M-10 -1 v11 M0 -1 v4 M10 -1 v11"/></g>`;
  return `
  <svg class="stamp ${cls}" viewBox="-50 -50 100 100" aria-label="${label} stamp">
    <g transform="rotate(-12)">
      <circle r="44" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="5 3"/>
      <circle r="36" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <g transform="translate(0 -10)">${landmark}</g>
      <text y="22" text-anchor="middle" font-size="15" font-weight="700" fill="${accent}" font-family="inherit" letter-spacing="1">${label}</text>
      <text y="31" text-anchor="middle" font-size="6.5" font-weight="600" fill="${accent}" font-family="inherit" letter-spacing="0.5">DEMO REWARD</text>
      <path id="stamp-arc-${label}" d="M-30 0 A30 30 0 0 1 30 0" fill="none"/>
      <text font-size="6" font-weight="700" fill="${accent}" font-family="inherit" letter-spacing="1.5"><textPath href="#stamp-arc-${label}" startOffset="50%" text-anchor="middle">PASSPORT QUEST</textPath></text>
    </g>
  </svg>`;
}

/** Small plane glyph used by the intro flight. */
export const PLANE_SVG = `<svg viewBox="-20 -20 40 40" class="plane" aria-hidden="true"><path d="M-16 2 L14 -2 L18 0 L14 2 L-6 8 L-10 14 L-13 13 L-10 6 L-16 2Z" fill="#FFF6E8" stroke="#201338" stroke-width="1.5" stroke-linejoin="round"/><path d="M-4 0 L-12 -8 L-9 -9 L0 -2 Z" fill="#FFF6E8" stroke="#201338" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

/** Start/final screen backdrop: sunset over both skylines. Returns an <svg> string. */
export const SKYLINE_SVG = `
  <svg class="skyline" viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="sky-sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7845D8" stop-opacity="0"/><stop offset="0.5" stop-color="#F58324" stop-opacity="0.35"/><stop offset="1" stop-color="#F58324" stop-opacity="0.75"/></linearGradient></defs>
    <rect width="360" height="200" fill="url(#sky-sunset)"/>
    <circle cx="180" cy="150" r="46" fill="#FFD966" opacity="0.9"/>
    <g fill="#150c26">
      <path d="M0 200 L0 150 Q30 90 60 140 Q80 110 100 150 L100 200 Z"/>
      <path d="M100 200 L100 160 L120 160 L120 140 L128 140 L128 160 L150 160 L150 200 Z"/>
      <path d="M150 200 L150 150 Q180 70 210 150 Z" opacity="0.9"/>
      <path d="M210 200 L210 170 L230 170 L230 120 L236 120 L236 170 L260 170 L260 200 Z"/>
      <path d="M260 200 L260 160 Q300 100 340 160 L340 200 Z"/>
      <rect x="340" y="150" width="20" height="50"/>
      <path d="M220 170 Q250 130 280 170" stroke="#150c26" stroke-width="4" fill="none"/>
    </g>
    <g fill="#FFD966" opacity="0.6"><rect x="112" y="168" width="4" height="4"/><rect x="134" y="172" width="4" height="4"/><rect x="246" y="178" width="4" height="4"/><rect x="346" y="160" width="4" height="4"/></g>
  </svg>`;
