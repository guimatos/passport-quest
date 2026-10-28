/** Passport stamp artwork. Returns an <svg> string. */
export function stampSvg(label: string, accent: string, cls = ''): string {
  return `
  <svg class="stamp ${cls}" viewBox="-50 -50 100 100" aria-label="${label} stamp">
    <circle r="44" fill="none" stroke="${accent}" stroke-width="5" stroke-dasharray="6 4"/>
    <circle r="34" fill="none" stroke="${accent}" stroke-width="2"/>
    <text y="6" text-anchor="middle" font-size="18" font-weight="700" fill="${accent}" font-family="inherit">${label}</text>
    <text y="22" text-anchor="middle" font-size="8" font-weight="600" fill="${accent}" font-family="inherit">DEMO REWARD</text>
  </svg>`;
}

/** Small plane glyph used by the travel transition. */
export const PLANE_SVG = `<svg viewBox="-20 -20 40 40" class="plane" aria-hidden="true"><path d="M-16 2 L14 -2 L18 0 L14 2 L-6 8 L-10 14 L-13 13 L-10 6 L-16 2Z" fill="#FFF6E8" stroke="#201338" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
