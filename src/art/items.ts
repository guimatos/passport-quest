import type { ItemId } from '../data/destinations';

/**
 * Collectible artwork. Each function returns SVG markup centered on (0,0)
 * inside a ~48x48 box. `silhouette` renders the flat dark version used by
 * the HUD before the item is discovered.
 * PHASE 2: simple placeholder shapes, replaced by real art in Phase 3.
 */
export type ItemArt = (opts?: { silhouette?: boolean }) => string;

const sil = (o?: { silhouette?: boolean }) => !!o?.silhouette;

export const ITEM_ART: Record<ItemId, ItemArt> = {
  coconut: (o) => sil(o)
    ? `<circle r="20" fill="currentColor"/>`
    : `<circle r="20" fill="#7A4B2A"/><circle cx="-5" cy="-6" r="3" fill="#3E2412"/><circle cx="5" cy="-6" r="3" fill="#3E2412"/><circle cy="4" r="3" fill="#3E2412"/>`,
  football: (o) => sil(o)
    ? `<circle r="20" fill="currentColor"/>`
    : `<circle r="20" fill="#FFF6E8" stroke="#201338" stroke-width="2"/><polygon points="0,-9 8,-3 5,7 -5,7 -8,-3" fill="#201338"/>`,
  seashell: (o) => sil(o)
    ? `<path d="M-20 8 Q0 -26 20 8 Z" fill="currentColor"/>`
    : `<path d="M-20 8 Q0 -26 20 8 Z" fill="#FFB38A" stroke="#C96A3F" stroke-width="2"/><path d="M0 8 L-8 -10 M0 8 L0 -14 M0 8 L8 -10" stroke="#C96A3F" stroke-width="2" fill="none"/>`,
  acai: (o) => sil(o)
    ? `<path d="M-20 -6 L20 -6 L12 18 L-12 18 Z" fill="currentColor"/>`
    : `<path d="M-20 -6 L20 -6 L12 18 L-12 18 Z" fill="#FFF6E8" stroke="#201338" stroke-width="2"/><ellipse rx="19" ry="7" cy="-6" fill="#5B2A86"/><circle cx="-6" cy="-9" r="3" fill="#F2C94C"/><circle cx="6" cy="-8" r="3" fill="#F2C94C"/>`,
  flipflop: (o) => sil(o)
    ? `<ellipse rx="12" ry="20" fill="currentColor"/>`
    : `<ellipse rx="12" ry="20" fill="#F2C94C" stroke="#C99A1E" stroke-width="2"/><path d="M0 -8 L-7 6 M0 -8 L7 6" stroke="#1FA463" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  azulejo: (o) => sil(o)
    ? `<rect x="-18" y="-18" width="36" height="36" rx="3" fill="currentColor"/>`
    : `<rect x="-18" y="-18" width="36" height="36" rx="3" fill="#FFF6E8" stroke="#2E6FD8" stroke-width="2"/><circle r="9" fill="none" stroke="#2E6FD8" stroke-width="3"/>`,
  tram: (o) => sil(o)
    ? `<rect x="-20" y="-12" width="40" height="26" rx="5" fill="currentColor"/>`
    : `<rect x="-20" y="-12" width="40" height="26" rx="5" fill="#F2C94C" stroke="#201338" stroke-width="2"/><rect x="-14" y="-6" width="10" height="9" fill="#9ED5F5"/><rect x="4" y="-6" width="10" height="9" fill="#9ED5F5"/>`,
  nata: (o) => sil(o)
    ? `<ellipse rx="20" ry="14" fill="currentColor"/>`
    : `<ellipse rx="20" ry="14" fill="#E8C077" stroke="#B27B2E" stroke-width="2"/><ellipse rx="13" ry="8" fill="#F6D98A"/><ellipse cx="-3" cy="-2" rx="4" ry="2" fill="#8C4F1D"/>`,
  francesinha: (o) => sil(o)
    ? `<rect x="-18" y="-14" width="36" height="30" rx="4" fill="currentColor"/>`
    : `<rect x="-18" y="-14" width="36" height="30" rx="4" fill="#E8B04B" stroke="#8C4F1D" stroke-width="2"/><rect x="-18" y="-2" width="36" height="6" fill="#D9534F"/><rect x="-18" y="6" width="36" height="5" fill="#F6D98A"/>`,
  rabelo: (o) => sil(o)
    ? `<path d="M-22 4 L22 4 L14 16 L-14 16 Z" fill="currentColor"/><rect x="-2" y="-20" width="4" height="24" fill="currentColor"/>`
    : `<path d="M-22 4 L22 4 L14 16 L-14 16 Z" fill="#7A4B2A" stroke="#3E2412" stroke-width="2"/><rect x="-2" y="-20" width="4" height="24" fill="#3E2412"/><path d="M2 -18 L18 -6 L2 -4 Z" fill="#FFF6E8"/>`,
};

/** Obstacle art keyed by obstacle id, centered on (0,0). Placeholder shapes in Phase 2. */
export const OBSTACLE_ART: Record<string, string> = {
  crab: `<ellipse rx="16" ry="10" fill="#E0533B"/><circle cx="-6" cy="-10" r="3" fill="#201338"/><circle cx="6" cy="-10" r="3" fill="#201338"/>`,
  cactus: `<rect x="-8" y="-26" width="16" height="46" rx="8" fill="#3F8F4A"/><rect x="-22" y="-12" width="12" height="20" rx="6" fill="#3F8F4A"/>`,
  gull: `<ellipse rx="14" ry="8" fill="#FFF6E8" stroke="#201338" stroke-width="1.5"/><polygon points="14,0 22,-2 14,3" fill="#F58324"/>`,
  bollard: `<rect x="-7" y="-24" width="14" height="44" rx="5" fill="#2F3B46"/><circle cy="-24" r="8" fill="#2F3B46"/>`,
};

/** Small ticket icon used for coupons. */
export const TICKET_SVG = `<svg viewBox="0 0 32 24" class="ticket" aria-hidden="true"><path d="M2 4 h28 v5 a3 3 0 0 0 0 6 v5 h-28 v-5 a3 3 0 0 0 0 -6 z" fill="currentColor"/><path d="M11 6 v12" stroke="#FFF6E8" stroke-width="2" stroke-dasharray="2 2"/></svg>`;
