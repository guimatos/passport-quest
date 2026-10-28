/**
 * Stylized journey map (320 x 240 viewBox): the Atlantic between Brazil and
 * Portugal with numbered destination markers, tiny landmarks and a dashed
 * flight route. Marker positions are exported so the plane animation can
 * follow the route.
 */
export const MAP_W = 320;
export const MAP_H = 240;
export const MAP_POINTS = {
  rio: { x: 96, y: 150 },
  porto: { x: 243, y: 58 },
  routeControl: { x: 150, y: 10 },
  /** Off-screen entry points for the first flight into each city. */
  entry: { x: -30, y: 30 },
  entryControl: { x: 10, y: 150 },
  entryRight: { x: 350, y: 230 },
  entryRightControl: { x: 330, y: 80 },
};

/** activeIndex: destination being flown to (-1 while choosing). completed: indexes already stamped. pick: markers are tappable. */
export function mapSvg(activeIndex: number, completed: number[], pick = false): string {
  const marker = (p: { x: number; y: number }, n: number, label: string, lx: number, ly: number, landmark: string) => {
    const state = completed.includes(n - 1) ? 'done' : activeIndex === n - 1 ? 'active' : pick ? 'pick' : 'locked';
    return `
      <g class="map-marker map-marker--${state}" data-index="${n - 1}" transform="translate(${p.x} ${p.y})">
        ${landmark}
        <circle class="map-marker-ring" r="14"/>
        <circle class="map-marker-dot" r="9"/>
        <text class="map-marker-n" y="3.5" text-anchor="middle">${n}</text>
        <text class="map-label" x="${lx}" y="${ly}" text-anchor="middle">${label}</text>
      </g>`;
  };
  const r = MAP_POINTS.rio, p = MAP_POINTS.porto, c = MAP_POINTS.routeControl;
  const sugarloaf = `<g transform="translate(-26 -4)"><path d="M-12 8 Q-4 -14 4 -2 Q8 -16 16 8 Z" fill="#4F8A5B"/><path d="M-8 8 Q-2 -6 4 2" stroke="#FFF6E8" stroke-width="1" fill="none"/></g>`;
  const bridge = `<g transform="translate(-30 -2)"><path d="M-14 6 Q0 -14 14 6" stroke="#4A5560" stroke-width="3" fill="none"/><rect x="-14" y="-4" width="28" height="2.5" fill="#4A5560"/></g>`;
  return `
  <svg class="map-svg" viewBox="0 0 ${MAP_W} ${MAP_H}" aria-hidden="true">
    <defs>
      <linearGradient id="map-sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5B8EE6"/><stop offset="1" stop-color="#3D6FCB"/>
      </linearGradient>
      <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0 H0 V24" fill="none" stroke="#FFF6E8" stroke-width="0.6" opacity="0.18"/></pattern>
    </defs>
    <rect width="${MAP_W}" height="${MAP_H}" rx="18" fill="url(#map-sea)"/>
    <rect width="${MAP_W}" height="${MAP_H}" rx="18" fill="url(#map-grid)"/>
    <g class="map-waves" stroke="#FFF6E8" stroke-width="1.5" stroke-linecap="round" opacity="0.3" fill="none">
      <path d="M150 120 q6 -4 12 0 t12 0"/><path d="M190 170 q6 -4 12 0 t12 0"/><path d="M60 40 q6 -4 12 0 t12 0"/><path d="M200 70 q6 -4 12 0 t12 0"/><path d="M140 200 q6 -4 12 0 t12 0"/><path d="M110 90 q6 -4 12 0 t12 0"/>
    </g>
    <g class="map-land" fill="#9ED98A" stroke="#5EA850" stroke-width="2" stroke-linejoin="round">
      <!-- South America -->
      <path d="M22 66 Q36 48 60 54 Q80 50 96 66 Q112 78 116 98 Q122 122 106 142 Q100 156 92 166 Q84 190 70 214 Q58 236 44 220 Q30 196 26 166 Q18 136 14 110 Q10 86 22 66 Z"/>
      <path d="M28 70 Q44 60 58 64" stroke="#5EA850" stroke-width="1.5" fill="none" opacity="0.6"/>
      <!-- Iberia -->
      <path d="M232 46 Q246 34 266 36 Q284 36 292 50 Q296 66 286 78 Q272 90 254 88 Q238 84 232 68 Z"/>
      <!-- Europe hint -->
      <path d="M256 20 Q286 2 320 8 L320 48 Q302 42 290 42 Q278 36 266 30 Z"/>
      <!-- Africa hint -->
      <path d="M248 100 Q280 86 306 100 Q324 122 318 162 Q312 202 286 228 Q262 234 252 198 Q238 150 248 100 Z"/>
      <!-- Caribbean specks -->
      <circle cx="40" cy="34" r="3"/><circle cx="52" cy="40" r="2"/>
    </g>
    <g fill="#7EC46C" opacity="0.6"><ellipse cx="60" cy="120" rx="22" ry="12"/><ellipse cx="280" cy="150" rx="18" ry="22"/></g>
    <path class="map-route" d="M${r.x} ${r.y} Q${c.x} ${c.y} ${p.x} ${p.y}" fill="none" stroke="#FFF6E8" stroke-width="3" stroke-dasharray="6 8" stroke-linecap="round" opacity="0.75"/>
    ${marker(r, 1, 'Rio de Janeiro', 8, 30, sugarloaf)}
    ${marker(p, 2, 'Porto', 0, -22, bridge)}
    <g transform="translate(292 212)" opacity="0.8"><circle r="12" fill="none" stroke="#FFF6E8" stroke-width="1.5"/><path d="M0 -12 L3 0 L0 12 L-3 0 Z" fill="#FFF6E8"/><text y="-15" text-anchor="middle" font-size="7" font-weight="700" fill="#FFF6E8" font-family="inherit">N</text></g>
  </svg>`;
}
