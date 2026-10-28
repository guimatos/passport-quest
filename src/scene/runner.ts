import type { DestinationDef, ItemId, ObstacleId } from '../data/destinations';
import { ITEM_ART, OBSTACLE_ART } from '../art/items';
import { SCENE_ART, type ParallaxLayer } from '../art/scenes';
import { foxGroup, type FoxMood } from '../art/fox';
import { svgFromString, SVG_NS } from '../lib/dom';

export const SCENE_W = 360;
export const SCENE_H = 720;
const FOX_X = 96;
const FOX_RADIUS = 30;
const ITEM_RADIUS = 20;
const OBSTACLE_RADIUS = 18;
const SPAWN_X = SCENE_W + 70;
const DESPAWN_X = -80;
const FOLLOW_RATE = 11; // per second; higher = snappier follow

export interface Entity {
  kind: 'item' | 'obstacle';
  id: ItemId | ObstacleId;
  x: number;
  y: number;
  el: SVGGElement;
  done: boolean;
}

export interface RunnerHandlers {
  onCollect: (entity: Entity, screen: { x: number; y: number }) => void;
  onHit: (entity: Entity, screen: { x: number; y: number }) => void;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The endless-runner scene: parallax layers, the fox following the pointer
 * vertically, and items/obstacles streaming in from the right. All motion is
 * driven by update(dt) from the game loop, so it pauses with the game.
 * The runner owns no timers of its own; difficulty is a function of elapsed time.
 */
export class Runner {
  readonly el: SVGSVGElement;
  private layers: { g: SVGGElement; def: ParallaxLayer; offset: number }[] = [];
  private entityLayer: SVGGElement;
  private foxG: SVGGElement;
  private foxInner: SVGGElement;
  private bubbleG: SVGGElement;
  private hintG: SVGGElement;
  private entities: Entity[] = [];
  private foxY: number;
  private targetY: number;
  private elapsed = 0;
  private spawnIn = 900;
  private finished = false;
  private stunned = 0;
  private hintOn = false;

  constructor(
    private dest: DestinationDef,
    private handlers: RunnerHandlers,
    private random: () => number,
    signal: AbortSignal,
    stage: HTMLElement,
  ) {
    const art = SCENE_ART[dest.id];
    this.foxY = this.targetY = (art.band.top + art.band.bottom) / 2;

    const layerMarkup = (l: ParallaxLayer, cls: string) =>
      `<g class="layer ${cls}" data-speed="${l.speed}">${[0, 1, 2].map((i) => `<g transform="translate(${i * l.width} 0)">${l.markup}</g>`).join('')}</g>`;

    this.el = svgFromString(`
      <svg class="scene scene--${dest.id}" viewBox="0 0 ${SCENE_W} ${SCENE_H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g class="backdrop">${art.backdrop}</g>
        ${art.layers.map((l) => layerMarkup(l, 'layer-back')).join('')}
        <g class="entities"></g>
        <g class="fox-root"><g class="fox-inner">${foxGroup('run')}</g></g>
        ${art.front.map((l) => layerMarkup(l, 'layer-front')).join('')}
        <g class="bubble" visibility="hidden"><rect class="bubble-bg" rx="10"/><text class="bubble-text" text-anchor="start"></text></g>
        <g class="hint-hand" visibility="hidden">
          <g class="hint-hand-inner">
            <path d="M0 -26 L0 26 M-10 -14 L0 -26 L10 -14 M-10 14 L0 26 L10 14" stroke="#FFF6E8" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M0 -26 L0 26 M-10 -14 L0 -26 L10 -14 M-10 14 L0 26 L10 14" stroke="#7845D8" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
        </g>
      </svg>`);

    const allLayers = [...art.layers, ...art.front];
    this.el.querySelectorAll<SVGGElement>('.layer').forEach((g, i) => this.layers.push({ g, def: allLayers[i], offset: 0 }));
    this.entityLayer = this.el.querySelector('.entities')!;
    this.foxG = this.el.querySelector('.fox-root')!;
    this.foxInner = this.el.querySelector('.fox-inner')!;
    this.bubbleG = this.el.querySelector('.bubble')!;
    this.hintG = this.el.querySelector('.hint-hand')!;
    this.placeFox();

    // Pointer control: the fox follows the pointer's vertical position.
    // Mouse hover works without pressing; touch drives it while touching.
    const follow = (ev: PointerEvent) => {
      if (!ev.isPrimary || this.finished) return;
      this.targetY = this.clampY(this.toSceneY(ev.clientY));
    };
    stage.addEventListener('pointermove', follow, { signal, passive: true });
    stage.addEventListener('pointerdown', follow, { signal, passive: true });
    // pointercancel / pointerleave: nothing is held, the fox simply keeps its current target.
  }

  get progressRamp() { return Math.min(1, this.elapsed / this.dest.level.rampMs); }
  get speed() { return lerp(this.dest.level.speedStart, this.dest.level.speedEnd, this.progressRamp); }

  private clampY(y: number) {
    const { band } = SCENE_ART[this.dest.id];
    return Math.max(band.top, Math.min(band.bottom, y));
  }

  /** Convert a viewport Y (CSS px) to scene units, accounting for the slice fit. */
  private toSceneY(clientY: number) {
    const r = this.el.getBoundingClientRect();
    const s = Math.max(r.width / SCENE_W, r.height / SCENE_H);
    return (clientY - r.top - (r.height - SCENE_H * s) / 2) / s;
  }

  /** Convert scene coordinates to viewport CSS px (for effects). */
  toScreen(x: number, y: number) {
    const r = this.el.getBoundingClientRect();
    const s = Math.max(r.width / SCENE_W, r.height / SCENE_H);
    return { x: r.left + (r.width - SCENE_W * s) / 2 + x * s, y: r.top + (r.height - SCENE_H * s) / 2 + y * s };
  }

  foxScreenPoint() { return this.toScreen(FOX_X, this.foxY); }

  /** Depth cue: things lower on screen are closer, so slightly bigger. */
  private depthScale(y: number) {
    const { band } = SCENE_ART[this.dest.id];
    return lerp(0.82, 1.08, (y - band.top) / (band.bottom - band.top));
  }

  private placeFox() {
    this.foxG.setAttribute('transform', `translate(${FOX_X} ${this.foxY}) scale(${this.depthScale(this.foxY) * 0.52})`);
    this.bubbleG.setAttribute('transform', `translate(${FOX_X - 34} ${this.foxY - 58})`);
    this.hintG.setAttribute('transform', `translate(${FOX_X + 70} ${this.foxY})`);
  }

  update(dt: number) {
    const sec = dt / 1000;
    if (!this.finished) this.elapsed += dt;
    const speed = this.finished ? this.speed * 0.6 : this.speed;

    // Parallax
    for (const l of this.layers) {
      l.offset = (l.offset + speed * l.def.speed * sec) % l.def.width;
      l.g.setAttribute('transform', `translate(${-l.offset} 0)`);
    }

    // Fox follows target (exponential smoothing, frame-rate independent)
    const k = 1 - Math.exp(-FOLLOW_RATE * sec);
    this.foxY += (this.targetY - this.foxY) * k;
    this.placeFox();
    if (this.stunned > 0) {
      this.stunned -= dt;
      if (this.stunned <= 0) { this.foxG.classList.remove('stunned'); this.setMood('run'); }
    }

    // Spawning
    if (!this.finished) {
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) {
        this.spawn();
        const { level } = this.dest;
        this.spawnIn = lerp(level.spawnGapStart, level.spawnGapEnd, this.progressRamp) * (0.85 + this.random() * 0.3);
      }
    }

    // Move entities and test collisions
    for (const e of this.entities) {
      e.x -= speed * sec;
      e.el.setAttribute('transform', `translate(${e.x} ${e.y}) scale(${this.depthScale(e.y)})`);
      if (!e.done && !this.finished) {
        const r = e.kind === 'item' ? FOX_RADIUS + ITEM_RADIUS : FOX_RADIUS + OBSTACLE_RADIUS - 8;
        if (Math.hypot(e.x - FOX_X, e.y - this.foxY) < r) {
          e.done = true;
          const screen = this.toScreen(e.x, e.y);
          if (e.kind === 'item') {
            e.el.classList.add('collected');
            this.handlers.onCollect(e, screen);
          } else if (this.stunned <= 0) {
            e.el.classList.add('bumped');
            this.stunned = 700;
            this.foxG.classList.add('stunned');
            this.setMood('ouch');
            this.handlers.onHit(e, screen);
          }
        }
      }
    }
    // Despawn off-screen or finished entities
    this.entities = this.entities.filter((e) => {
      if (e.x < DESPAWN_X) { e.el.remove(); return false; }
      return true;
    });
  }

  private spawn() {
    const { level, items, obstacles } = this.dest;
    const { band } = SCENE_ART[this.dest.id];
    const obstacleChance = lerp(level.obstacleStart, level.obstacleEnd, this.progressRamp);
    const y = band.top + this.random() * (band.bottom - band.top);
    if (this.random() < obstacleChance) {
      const def = obstacles[Math.floor(this.random() * obstacles.length)];
      this.addEntity('obstacle', def.id, SPAWN_X, y, def.scale ?? 1, OBSTACLE_ART[def.id]);
      return;
    }
    const def = items[Math.floor(this.random() * items.length)];
    // Sometimes spawn a short chain of the same item for a satisfying streak.
    const chain = this.random() < 0.25 ? 3 : 1;
    for (let i = 0; i < chain; i++) {
      this.addEntity('item', def.id, SPAWN_X + i * 64, y, def.scale ?? 1, ITEM_ART[def.id]());
    }
  }

  private addEntity(kind: Entity['kind'], id: ItemId | ObstacleId, x: number, y: number, scale: number, markup: string) {
    const el = document.createElementNS(SVG_NS, 'g');
    el.setAttribute('class', `entity entity--${kind} entity--${id}`);
    el.innerHTML = `<g class="entity-anim"><g class="entity-art" transform="scale(${scale})">${markup}</g></g>`;
    this.entityLayer.appendChild(el);
    const e: Entity = { kind, id, x, y, el, done: false };
    e.el.setAttribute('transform', `translate(${x} ${y}) scale(${this.depthScale(y)})`);
    this.entities.push(e);
  }

  /** Debug/test accessor: upcoming live entities in scene units. */
  liveEntities() { return this.entities.filter((e) => !e.done).map((e) => ({ kind: e.kind, id: e.id, x: e.x, y: e.y })); }
  get foxPosition() { return { x: FOX_X, y: this.foxY }; }

  setMood(mood: FoxMood) {
    this.foxInner.innerHTML = foxGroup(mood);
  }

  /** Short speech bubble anchored to the fox. */
  say(text: string | null) {
    if (!text) { this.bubbleG.setAttribute('visibility', 'hidden'); return; }
    const t = this.bubbleG.querySelector<SVGTextElement>('.bubble-text')!;
    const bg = this.bubbleG.querySelector<SVGRectElement>('.bubble-bg')!;
    t.textContent = text;
    const w = Math.max(60, text.length * 7.2 + 20);
    bg.setAttribute('x', '0'); bg.setAttribute('y', '-18');
    bg.setAttribute('width', String(w)); bg.setAttribute('height', '30');
    t.setAttribute('x', '10'); t.setAttribute('y', '3');
    this.bubbleG.setAttribute('visibility', 'visible');
  }

  setHint(on: boolean) {
    if (this.hintOn === on) return;
    this.hintOn = on;
    this.hintG.setAttribute('visibility', on ? 'visible' : 'hidden');
  }

  /** Level complete: stop spawning, slow down, fade remaining entities. */
  finish() {
    this.finished = true;
    this.setHint(false);
    this.setMood('cheer');
    this.foxG.classList.remove('stunned');
    this.foxG.classList.add('finished');
    this.entities.forEach((e) => e.el.classList.add('fade'));
  }

  destroy() { this.el.remove(); this.entities = []; }
}
