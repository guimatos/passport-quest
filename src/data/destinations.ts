/**
 * Destinations, themes, collectibles, coupons, obstacles and level tuning
 * as data. Before each city the player picks one theme (what they want to
 * see there). The run then streams that theme's three items, and the
 * theme's coupon unlocks by catching enough of its signature item.
 * Scene coordinates are in the shared 360 x 720 viewBox (see runner.ts).
 */
export type DestinationId = 'brazil' | 'portugal';
export type ThemeId = 'food' | 'beach' | 'party' | 'culture' | 'festa';
export type ItemId =
  | 'coconut' | 'acai' | 'brigadeiro'
  | 'football' | 'flipflop' | 'seashell'
  | 'pandeiro' | 'mask' | 'apito'
  | 'nata' | 'francesinha' | 'sardine'
  | 'azulejo' | 'tram' | 'rabelo'
  | 'martelinho' | 'balloon' | 'manjerico';
export type ObstacleId = 'crab' | 'urchin' | 'gull' | 'crate';

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

export interface CouponDef {
  /** Signature item to collect and how many. */
  itemId: ItemId;
  need: number;
  title: string;
  /** Fictional demo venue. Never a real business: no real-reward claims. */
  venue: string;
}

export interface ThemeDef {
  id: ThemeId;
  label: string;
  /** Short label for chips and the passport. */
  short: string;
  /** One line shown on the choice card. */
  pitch: string;
  items: ItemDef[];
  coupon: CouponDef;
}

export interface ObstacleDef {
  id: ObstacleId;
  label: string;
  scale?: number;
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
  themes: ThemeDef[];
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
    tagline: 'Sun, samba and Sugarloaf',
    accent: '#1FA463',
    stampLabel: 'RIO',
    themes: [
      {
        id: 'food', label: 'Eat & drink', short: 'Food', pitch: 'Kiosk snacks and beach treats',
        items: [
          { id: 'coconut', label: 'Coconut', weight: 1.6, scale: 0.9,
            blurb: 'Chilled green coconuts are sold at nearly every kiosk along Copacabana and Ipanema. Água de coco has been the beach drink of Rio for generations.' },
          { id: 'acai', label: 'Açaí bowl', scale: 0.85,
            blurb: 'Açaí comes from palms in the Amazon. Blended frozen and topped with granola and banana, it became a Rio beach and surf staple in the 1990s.' },
          { id: 'brigadeiro', label: 'Brigadeiro', scale: 0.85,
            blurb: 'The chocolate fudge ball was created in the 1940s and named after Brigadier Eduardo Gomes, whose presidential campaign sold them at rallies.' },
        ],
        coupon: { itemId: 'coconut', need: 6, title: 'Free coconut water', venue: 'Quiosque da Raposa, Copacabana (demo)' },
      },
      {
        id: 'beach', label: 'Beach life', short: 'Beach', pitch: 'Sand, surf and footvolley',
        items: [
          { id: 'football', label: 'Football', weight: 1.6, scale: 0.85,
            blurb: 'Rio is home to the Maracanã, built for the 1950 World Cup. On the sand, locals play footvolley, invented on Copacabana beach in the 1960s.' },
          { id: 'flipflop', label: 'Flip-flop', scale: 0.85,
            blurb: 'Brazil\'s rubber sandals were launched in 1962, inspired by Japanese zori straw sandals. They are now a symbol of beach life across the country.' },
          { id: 'seashell', label: 'Seashell', scale: 0.8,
            blurb: 'Shells wash up along Copacabana\'s 4 km arc. Its wave-patterned promenade, designed by Roberto Burle Marx in 1970, echoes Portuguese calçada paving.' },
        ],
        coupon: { itemId: 'football', need: 6, title: 'Footvolley lesson', venue: 'Barraca da Raposa, Ipanema (demo)' },
      },
      {
        id: 'party', label: 'Party & samba', short: 'Samba', pitch: 'Carnival rhythm, day and night',
        items: [
          { id: 'pandeiro', label: 'Pandeiro', weight: 1.6, scale: 0.85,
            blurb: 'The pandeiro is the heartbeat of samba. Rio\'s samba schools parade through the Sambadrome at Carnival with thousands of them.' },
          { id: 'mask', label: 'Carnival mask', scale: 0.85,
            blurb: 'Rio\'s Carnival grew from 18th-century Portuguese street festivities. Today its blocos, free street parties, draw millions of people every February.' },
          { id: 'apito', label: 'Samba whistle', scale: 0.8,
            blurb: 'The apito de samba, a three-tone whistle, is blown by the bateria leader to call the beat. Its sound has opened Rio parades since the 1930s.' },
        ],
        coupon: { itemId: 'pandeiro', need: 6, title: 'Samba class', venue: 'Escola da Raposa, Lapa (demo)' },
      },
    ],
    obstacles: [
      { id: 'crab', label: 'Crab' },
      { id: 'urchin', label: 'Sea urchin' },
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
    themes: [
      {
        id: 'food', label: 'Eat & drink', short: 'Food', pitch: 'Pastry, sandwiches and sardines',
        items: [
          { id: 'nata', label: 'Pastel de nata', weight: 1.6, scale: 0.85,
            blurb: 'The custard tart was created by monks in Lisbon before 1834, using leftover egg yolks. Porto bakeries serve them warm with cinnamon.' },
          { id: 'francesinha', label: 'Francesinha', scale: 0.85,
            blurb: 'Porto\'s layered sandwich of meats, melted cheese and spicy beer sauce was created in the 1950s, inspired by the French croque-monsieur.' },
          { id: 'sardine', label: 'Grilled sardine', scale: 0.85,
            blurb: 'Sardines have been grilled on Portuguese streets for centuries. In Porto they peak on São João night, served on a slice of broa corn bread.' },
        ],
        coupon: { itemId: 'nata', need: 6, title: 'Free pastel de nata', venue: 'Pastelaria da Raposa, Ribeira (demo)' },
      },
      {
        id: 'culture', label: 'Culture & history', short: 'Culture', pitch: 'Tiles, trams and the old quay',
        items: [
          { id: 'azulejo', label: 'Azulejo tile', weight: 1.6, scale: 0.8,
            blurb: 'Porto\'s São Bento station is lined with about 20,000 blue-and-white azulejo tiles, painted by Jorge Colaço between 1905 and 1916.' },
          { id: 'tram', label: 'Mini tram', scale: 0.85,
            blurb: 'Porto ran the first electric tram on the Iberian Peninsula in 1895. Heritage line 1 still rattles along the Douro riverside today.' },
          { id: 'rabelo', label: 'Rabelo boat', scale: 0.85,
            blurb: 'Flat-bottomed rabelo boats once carried port wine barrels down the Douro to the cellars of Vila Nova de Gaia. Today they line the Ribeira quay.' },
        ],
        coupon: { itemId: 'azulejo', need: 6, title: 'Tile-painting workshop', venue: 'Oficina da Raposa, Ribeira (demo)' },
      },
      {
        id: 'festa', label: 'São João festa', short: 'Festa', pitch: 'Hammers, balloons and fireworks',
        items: [
          { id: 'martelinho', label: 'Plastic hammer', weight: 1.6, scale: 0.85,
            blurb: 'On São João night, 23 June, Porto taps strangers on the head with squeaky plastic hammers, a 20th-century twist on an old leek-tapping custom.' },
          { id: 'balloon', label: 'Paper balloon', scale: 0.85,
            blurb: 'Paper hot-air balloons rise over the Douro during São João, alongside fireworks, grilled sardines and street parties that last until dawn.' },
          { id: 'manjerico', label: 'Basil pot', scale: 0.85,
            blurb: 'A manjerico is a small pot of bush basil given on São João, topped with a paper carnation and a four-line love verse.' },
        ],
        coupon: { itemId: 'martelinho', need: 6, title: 'Festival night pass', venue: 'Festa da Raposa, Fontainhas (demo)' },
      },
    ],
    obstacles: [
      { id: 'gull', label: 'Seagull' },
      { id: 'crate', label: 'Wooden crate' },
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

export const themeOf = (dest: DestinationDef, id: ThemeId) => dest.themes.find((t) => t.id === id)!;
export const ALL_ITEMS: ItemDef[] = DESTINATIONS.flatMap((d) => d.themes.flatMap((t) => t.items));
export const itemDef = (id: ItemId) => ALL_ITEMS.find((i) => i.id === id)!;
