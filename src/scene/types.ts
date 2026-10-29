import type { ItemId, ObstacleId } from '../data/destinations';
import type { CapyMood } from '../art/capy';

/**
 * The contract between the game controller and a runner scene. Two runners
 * implement it: the SVG parallax runner (`scene/runner.ts`, the no-WebGL
 * fallback) and the WebGL 3D runner (`scene3d/runner3d.ts`). The game never
 * looks inside either; it only drives `update(dt)` and reacts to handlers.
 */
export interface Entity {
  kind: 'item' | 'obstacle';
  id: ItemId | ObstacleId;
  done: boolean;
  /** Golden signature item: ×3 points, counts 2 toward the coupon. */
  golden: boolean;
}

export interface RunnerHandlers {
  onCollect: (entity: Entity, screen: { x: number; y: number }) => void;
  onHit: (entity: Entity, screen: { x: number; y: number }) => void;
  /** An obstacle passed through during a dash. */
  onDodge: (entity: Entity, screen: { x: number; y: number }) => void;
  /** A dash started (for effects and the first-time hint). */
  onDash: () => void;
}

export type SpawnPattern = 'single' | 'row' | 'arc' | 'zigzag';

/**
 * Debug/test view of an upcoming entity. 2D: scene units (x scrolls toward
 * Capi, y is the lane). 3D: x is the lateral position, y the distance ahead.
 */
export interface LiveEntity { kind: Entity['kind']; id: Entity['id']; x: number; y: number; golden: boolean }

export interface RunnerFeel { dashes: number; dodges: number; dashing: boolean; cooldown: boolean; patterns: SpawnPattern[]; /** Golden signature items spawned so far. */ goldens: number }

export interface RunnerApi {
  readonly mode: '2d' | '3d';
  /** Root node appended to #scene-root. */
  readonly el: Element;
  /** The words of the move hint: "up and down" (2D) or "left and right" (3D). */
  readonly moveWords: string;
  /** Set by the game from prefers-reduced-motion. */
  reducedMotion: boolean;
  /** The WebGL water of the 2D runner, when alive. The 3D runner has none (its water is part of the scene). */
  readonly water: { alive: boolean; static: boolean } | null;
  /** Rendering stats for the debug hook: whether a GL context is alive and draw calls in the last frame. */
  readonly stats: { gl: boolean; draws: number };
  readonly progressRamp: number;
  readonly speed: number;
  readonly dashing: boolean;
  readonly foxPosition: { x: number; y: number };
  readonly feel: RunnerFeel;
  update(dt: number): void;
  finish(): void;
  destroy(): void;
  dash(): boolean;
  squash(): void;
  setMood(mood: CapyMood): void;
  setHint(on: boolean): void;
  foxScreenPoint(): { x: number; y: number };
  feetScreenPoint(): { x: number; y: number };
  /**
   * Test helper. 2D: scene coordinates to viewport px. 3D: the viewport point
   * the pointer must be at to steer Capi to lateral `x` (y is ignored).
   */
  toScreen(x: number, y: number): { x: number; y: number };
  liveEntities(): LiveEntity[];
  poolSize(): number;
}

export function pickWeighted<T extends { weight?: number }>(list: T[], random: () => number): T {
  const total = list.reduce((n, i) => n + (i.weight ?? 1), 0);
  let r = random() * total;
  for (const i of list) { r -= i.weight ?? 1; if (r <= 0) return i; }
  return list[list.length - 1];
}

/** Picks a spawn pattern with the shared odds: single 50%, row 20%, arc 15%, zigzag 15%. */
export function pickPattern(r: number): SpawnPattern { return r < 0.5 ? 'single' : r < 0.7 ? 'row' : r < 0.85 ? 'arc' : 'zigzag'; }
