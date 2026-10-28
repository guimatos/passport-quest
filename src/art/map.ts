/**
 * Stylized journey map (320 x 240 viewBox): the Atlantic between Brazil and
 * Portugal with numbered destination markers and a dashed flight route.
 * Marker positions are exported so the plane animation can follow the route.
 */
export const MAP_W = 320;
export const MAP_H = 240;
export const MAP_POINTS = {
  rio: { x: 92, y: 150 },
  porto: { x: 243, y: 56 },
  routeControl: { x: 150, y: 20 },
  /** Off-screen entry point for the first flight into Rio. */
  entry: { x: -30, y: 40 },
  entryControl: { x: 20, y: 150 },
};

export function mapSvg(activeIndex: number, completed: number[]): string {
  const marker = (p: { x: number; y: number }, n: number, label: string, lx: number, ly: number) => {
    const state = completed.includes(n - 1) ? 'done' : activeIndex === n - 1 ? 'active' : 'locked';
    return `
      <g class="map-marker map-marker--${state}" transform="translate(${p.x} ${p.y})">
        <circle class="map-marker-ring" r="14"/>
        <circle class="map-marker-dot" r="9"/>
        <text class="map-marker-n" y="3.5" text-anchor="middle">${n}</text>
        <text class="map-label" x="${lx}" y="${ly}" text-anchor="middle">${label}</text>
      </g>`;
  };
  const r = MAP_POINTS.rio, p = MAP_POINTS.porto, c = MAP_POINTS.routeControl;
  return `
  <svg class="map-svg" viewBox="0 0 ${MAP_W} ${MAP_H}" aria-hidden="true">
    <defs>
      <linearGradient id="map-sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5B8EE6"/><stop offset="1" stop-color="#3D6FCB"/>
      </linearGradient>
    </defs>
    <rect width="${MAP_W}" height="${MAP_H}" rx="18" fill="url(#map-sea)"/>
    <g class="map-waves" stroke="#FFF6E8" stroke-width="1.5" stroke-linecap="round" opacity="0.25" fill="none">
      <path d="M150 120 q6 -4 12 0 t12 0"/><path d="M190 170 q6 -4 12 0 t12 0"/><path d="M60 40 q6 -4 12 0 t12 0"/><path d="M200 60 q6 -4 12 0 t12 0"/><path d="M140 200 q6 -4 12 0 t12 0"/>
    </g>
    <g class="map-land" fill="#8FD17A" stroke="#5EA850" stroke-width="2" stroke-linejoin="round">
      <!-- South America -->
      <path d="M18 72 Q40 52 68 58 Q100 62 112 92 Q120 124 100 158 Q84 192 66 218 Q50 236 38 212 Q26 180 20 140 Q12 104 18 72 Z"/>
      <!-- Iberia -->
      <path d="M236 44 Q252 34 274 36 Q292 44 290 64 Q282 84 258 86 Q238 82 234 64 Z"/>
      <!-- Europe hint -->
      <path d="M262 22 Q290 6 320 10 L320 46 Q300 40 286 40 Q276 34 262 22 Z"/>
      <!-- Africa hint -->
      <path d="M248 98 Q282 88 306 100 Q322 120 318 160 Q312 200 284 226 Q262 230 252 196 Q240 150 248 98 Z"/>
    </g>
    <path class="map-route" d="M${r.x} ${r.y} Q${c.x} ${c.y} ${p.x} ${p.y}" fill="none" stroke="#FFF6E8" stroke-width="3" stroke-dasharray="6 8" stroke-linecap="round" opacity="0.7"/>
    ${marker(r, 1, 'Rio de Janeiro', 10, 28)}
    ${marker(p, 2, 'Porto', 0, -20)}
  </svg>`;
}
