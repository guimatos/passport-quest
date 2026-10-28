/**
 * Destinations and collectibles as data. Scene coordinates are in the
 * shared 360 x 720 viewBox (see scene.ts). Items must stay inside the
 * safe zone (x 24..336, y 150..560) so they are visible and tappable on
 * both 320x568 and 390x844 portrait screens with the HUD in place.
 */
export type DestinationId = 'brazil' | 'portugal';
export type ItemId = 'coconut' | 'football' | 'seashell' | 'azulejo' | 'tram' | 'nata';

export interface ItemDef {
  id: ItemId;
  label: string;
  x: number;
  y: number;
  /** Radius (viewBox units) of the invisible hit circle. 26 units ≈ 46 CSS px at 320 wide. */
  hitRadius: number;
  /** Visual scale of the item art (art is authored at ~48 units). */
  scale?: number;
  /** Clockwise rotation in degrees for a more natural placement. */
  rotate?: number;
}

export interface DecoyDef {
  id: string;
  label: string;
  x: number;
  y: number;
  hitRadius: number;
}

export interface DestinationDef {
  id: DestinationId;
  name: string;
  /** Short name that fits the compact HUD. */
  shortName: string;
  country: string;
  tagline: string;
  /** Accent color used for the stamp and reward card. */
  accent: string;
  stampLabel: string;
  items: ItemDef[];
  decoys: DecoyDef[];
}

export const POINTS_PER_ITEM = 25;
export const COMPLETION_BONUS = 100;

export const DESTINATIONS: DestinationDef[] = [
  {
    id: 'brazil',
    name: 'Rio de Janeiro',
    shortName: 'Rio',
    country: 'Brazil',
    tagline: 'Sun, sand and Sugarloaf',
    accent: '#1FA463',
    stampLabel: 'RIO',
    items: [
      { id: 'coconut', label: 'Coconut', x: 74, y: 356, hitRadius: 26, scale: 0.9 },
      { id: 'football', label: 'Football', x: 232, y: 520, hitRadius: 26, scale: 0.85 },
      { id: 'seashell', label: 'Seashell', x: 302, y: 486, hitRadius: 26, scale: 0.8, rotate: -20 },
    ],
    decoys: [
      { id: 'crab', label: 'Crab', x: 150, y: 472, hitRadius: 24 },
    ],
  },
  {
    id: 'portugal',
    name: 'Porto',
    shortName: 'Porto',
    country: 'Portugal',
    tagline: 'Tiles, trams and the Douro',
    accent: '#2E6FD8',
    stampLabel: 'PORTO',
    items: [
      { id: 'azulejo', label: 'Azulejo tile', x: 108, y: 300, hitRadius: 26, scale: 0.8 },
      { id: 'tram', label: 'Mini tram', x: 292, y: 406, hitRadius: 26, scale: 0.85 },
      { id: 'nata', label: 'Pastel de nata', x: 58, y: 522, hitRadius: 26, scale: 0.85 },
    ],
    decoys: [
      { id: 'gull', label: 'Seagull', x: 230, y: 250, hitRadius: 24 },
    ],
  },
];

export const TOTAL_ITEMS = DESTINATIONS.reduce((n, d) => n + d.items.length, 0);
export const MAX_POINTS = TOTAL_ITEMS * POINTS_PER_ITEM + DESTINATIONS.length * COMPLETION_BONUS;
