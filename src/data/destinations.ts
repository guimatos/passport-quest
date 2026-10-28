/**
 * Destinations, collectibles, coupons, obstacles and level tuning as data.
 * Scene coordinates are in the shared 360 x 720 viewBox (see runner.ts).
 * The play band (where the fox and entities move) must stay inside the
 * region visible on both 320x568 and 390x844 screens with the HUD in place.
 */
export type DestinationId = 'brazil' | 'portugal';
export type ItemId =
  | 'coconut' | 'football' | 'seashell' | 'acai' | 'flipflop'
  | 'azulejo' | 'tram' | 'nata' | 'francesinha' | 'rabelo';
export type ObstacleId = 'crab' | 'cactus' | 'gull' | 'bollard';

export interface ItemDef {
  id: ItemId;
  label: string;
  /** One or two sentences of real local history shown in the travel journal. */
  blurb: string;
  /** Visual scale of the item art (art is authored at ~48 units). */
  scale?: number;
  /** Relative spawn weight (default 1). */
  weight?: number;
}

export interface ObstacleDef {
  id: ObstacleId;
  label: string;
  scale?: number;
}

export interface CouponDef {
  id: string;
  /** Item to collect and how many. */
  itemId: ItemId;
  need: number;
  title: string;
  /** Fictional demo venue. Never a real business: no real-reward claims. */
  venue: string;
}

export interface LevelTuning {
  /** Items needed to fill the passport progress bar. */
  goal: number;
  /** Scroll speed in scene units per second at the start and end of the ramp. */
  speedStart: number;
  speedEnd: number;
  /** Milliseconds between spawns at the start and end of the ramp. */
  spawnGapStart: number;
  spawnGapEnd: number;
  /** Probability that a spawn is an obstacle at the start and end of the ramp. */
  obstacleStart: number;
  obstacleEnd: number;
  /** Time (ms) over which the difficulty ramps from start to end values. */
  rampMs: number;
  /** Progress lost when hitting an obstacle. */
  penalty: number;
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
  coupon: CouponDef;
  obstacles: ObstacleDef[];
  level: LevelTuning;
}

export const POINTS_PER_ITEM = 10;
export const COMPLETION_BONUS = 100;
export const COUPON_BONUS = 50;

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
      { id: 'coconut', label: 'Coconut', weight: 1.7, scale: 0.9,
        blurb: 'Chilled green coconuts are sold at nearly every kiosk along Copacabana and Ipanema. Água de coco has been the beach drink of Rio for generations.' },
      { id: 'football', label: 'Football', scale: 0.85,
        blurb: 'Rio is home to the Maracanã, built for the 1950 World Cup. On the sand, locals play footvolley, invented on Copacabana beach in the 1960s.' },
      { id: 'seashell', label: 'Seashell', scale: 0.8,
        blurb: 'Shells wash up along Copacabana\'s 4 km arc. Its famous wave-patterned promenade, designed by Roberto Burle Marx in 1970, echoes Portuguese calçada paving.' },
      { id: 'acai', label: 'Açaí bowl', scale: 0.85,
        blurb: 'Açaí comes from palms in the Amazon. Blended frozen and topped with granola and banana, it became a Rio beach and surf staple in the 1990s.' },
      { id: 'flipflop', label: 'Flip-flop', scale: 0.85,
        blurb: 'Brazil\'s rubber sandals were launched in 1962, inspired by Japanese zori straw sandals. They are now a symbol of beach life across the country.' },
    ],
    coupon: { id: 'coco', itemId: 'coconut', need: 6, title: 'Free coconut water', venue: 'Quiosque da Raposa, Copacabana (demo)' },
    obstacles: [
      { id: 'crab', label: 'Crab' },
      { id: 'cactus', label: 'Beach cactus' },
    ],
    level: {
      goal: 16,
      speedStart: 170, speedEnd: 300,
      spawnGapStart: 1050, spawnGapEnd: 680,
      obstacleStart: 0.2, obstacleEnd: 0.4,
      rampMs: 32000,
      penalty: 1,
    },
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
      { id: 'azulejo', label: 'Azulejo tile', scale: 0.8,
        blurb: 'Porto\'s São Bento station is lined with about 20,000 blue-and-white azulejo tiles, painted by Jorge Colaço between 1905 and 1916.' },
      { id: 'tram', label: 'Mini tram', scale: 0.85,
        blurb: 'Porto ran the first electric tram on the Iberian Peninsula in 1895. Heritage line 1 still rattles along the Douro riverside today.' },
      { id: 'nata', label: 'Pastel de nata', weight: 1.7, scale: 0.85,
        blurb: 'The custard tart was created by monks in Lisbon before 1834, using leftover egg yolks. Porto bakeries serve them warm with cinnamon.' },
      { id: 'francesinha', label: 'Francesinha', scale: 0.85,
        blurb: 'Porto\'s layered sandwich of meats, melted cheese and spicy beer sauce was created in the 1950s, inspired by the French croque-monsieur.' },
      { id: 'rabelo', label: 'Rabelo boat', scale: 0.85,
        blurb: 'Flat-bottomed rabelo boats once carried port wine barrels down the Douro to the cellars of Vila Nova de Gaia. Today they line the Ribeira quay.' },
    ],
    coupon: { id: 'nata', itemId: 'nata', need: 6, title: 'Free pastel de nata', venue: 'Pastelaria da Raposa, Ribeira (demo)' },
    obstacles: [
      { id: 'gull', label: 'Seagull' },
      { id: 'bollard', label: 'Bollard' },
    ],
    level: {
      goal: 18,
      speedStart: 260, speedEnd: 430,
      spawnGapStart: 820, spawnGapEnd: 500,
      obstacleStart: 0.32, obstacleEnd: 0.5,
      rampMs: 30000,
      penalty: 1,
    },
  },
];
