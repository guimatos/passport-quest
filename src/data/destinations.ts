/**
 * Destinations, collectibles, obstacles and level tuning as data.
 * Scene coordinates are in the shared 360 x 720 viewBox (see runner.ts).
 * The play band (where the fox and entities move) must stay inside the
 * region visible on both 320x568 and 390x844 screens with the HUD in place.
 */
export type DestinationId = 'brazil' | 'portugal';
export type ItemId = 'coconut' | 'football' | 'seashell' | 'azulejo' | 'tram' | 'nata';
export type ObstacleId = 'crab' | 'cactus' | 'gull' | 'bollard';

export interface ItemDef {
  id: ItemId;
  label: string;
  /** Visual scale of the item art (art is authored at ~48 units). */
  scale?: number;
  /** Relative spawn weight. */
  weight?: number;
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
  items: ItemDef[];
  obstacles: ObstacleDef[];
  level: LevelTuning;
}

export const POINTS_PER_ITEM = 10;
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
      { id: 'coconut', label: 'Coconut', scale: 0.9 },
      { id: 'football', label: 'Football', scale: 0.85 },
      { id: 'seashell', label: 'Seashell', scale: 0.8 },
    ],
    obstacles: [
      { id: 'crab', label: 'Crab' },
      { id: 'cactus', label: 'Beach cactus' },
    ],
    level: {
      goal: 15,
      speedStart: 170, speedEnd: 300,
      spawnGapStart: 1100, spawnGapEnd: 700,
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
      { id: 'azulejo', label: 'Azulejo tile', scale: 0.8 },
      { id: 'tram', label: 'Mini tram', scale: 0.85 },
      { id: 'nata', label: 'Pastel de nata', scale: 0.85 },
    ],
    obstacles: [
      { id: 'gull', label: 'Seagull' },
      { id: 'bollard', label: 'Bollard' },
    ],
    level: {
      goal: 18,
      speedStart: 260, speedEnd: 430,
      spawnGapStart: 850, spawnGapEnd: 520,
      obstacleStart: 0.32, obstacleEnd: 0.5,
      rampMs: 30000,
      penalty: 1,
    },
  },
];
