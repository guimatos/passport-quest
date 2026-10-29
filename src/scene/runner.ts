import { FEEL, type DestinationDef, type ItemId, type ObstacleId, type ThemeDef } from '../data/destinations';
import { ITEM_ART, OBSTACLE_ART } from '../art/items';
import { SCENE_ART, WATER, sceneLayers, type ParallaxLayer } from '../art/scenes';
import { Water } from './water';
import { capyGroup, type CapyMood } from '../art/capy';
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
const POOL_MAX = 12; // pooled nodes kept per kind:id

export interface Entity {
  kind: 'item' | 'obstacle';
  id: ItemId | ObstacleId;
  x: number;
  y: number;
  el: SVGGElement;
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The endless-runner scene: parallax layers, Capi following the pointer
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
  private hintG: SVGGElement;
  private entities: Entity[] = [];
  private foxY: number;
  private targetY: number;
  private elapsed = 0;
  private spawnIn = 900;
  private finished = false;
  private stunned = 0;
  private hintOn = false;
  private elapsedTotal = 0;
  private dashLeft = 0;
  private dashCooldown = 0;
  private dashes = 0;
  private dodges = 0;
  private keys = new Set<string>();
  private patternsSeen = new Set<SpawnPattern>();
  /** WebGL water under the SVG, or null when unavailable (SVG gradient shows instead). */
  water: Water | null = null;

  constructor(
    private dest: DestinationDef,
    /** The chosen theme: its items stream in, its costume and environment variant are used. */
    private theme: ThemeDef,
    private handlers: RunnerHandlers,
    private random: () => number,
    signal: AbortSignal,
    stage: HTMLElement,
  ) {
    const art = SCENE_ART[dest.id];
    const variant = art.variants[theme.id];
    const layers = sceneLayers(art, theme.id);
    this.foxY = this.targetY = (art.band.top + art.band.bottom) / 2;

    const layerMarkup = (l: ParallaxLayer, cls: string) =>
      `<g class="layer ${cls}" data-speed="${l.speed}">${[0, 1, 2].map((i) => `<g transform="translate(${i * l.width} 0)">${l.markup}</g>`).join('')}</g>`;

    this.el = svgFromString(`
      <svg class="scene scene--${dest.id}" viewBox="0 0 ${SCENE_W} ${SCENE_H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g class="backdrop">${variant?.backdrop ?? art.backdrop}</g>
        ${layers.map((l) => layerMarkup(l, 'layer-back')).join('')}
        <g class="entities"></g>
        <g class="runner-root"><ellipse class="runner-shadow" cy="46" rx="44" ry="8" fill="#201338" opacity="0.18"/><g class="runner-inner">${capyGroup('run', theme.costume)}</g></g>
        ${art.front.map((l) => layerMarkup(l, 'layer-front')).join('')}
        <g class="hint-hand" visibility="hidden">
          <g class="hint-hand-inner">
            <path d="M0 -26 L0 26 M-10 -14 L0 -26 L10 -14 M-10 14 L0 26 L10 14" stroke="#FFF6E8" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M0 -26 L0 26 M-10 -14 L0 -26 L10 -14 M-10 14 L0 26 L10 14" stroke="#7845D8" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
        </g>
      </svg>`);

    const allLayers = [...layers, ...art.front];
    this.el.querySelectorAll<SVGGElement>('.layer').forEach((g, i) => this.layers.push({ g, def: allLayers[i], offset: 0 }));
    this.entityLayer = this.el.querySelector('.entities')!;
    this.foxG = this.el.querySelector('.runner-root')!;
    this.foxInner = this.el.querySelector('.runner-inner')!;
    this.hintG = this.el.querySelector('.hint-hand')!;
    this.placeFox();

    // Pointer control: Capi follows the pointer's vertical position.
    // Mouse hover works without pressing; touch drives it while touching.
    // A quick tap (< 220 ms, < 12 px of travel) is a dash.
    let downAt = 0, downY = 0;
    const follow = (ev: PointerEvent) => {
      if (!ev.isPrimary || this.finished) return;
      this.targetY = this.clampY(this.toSceneY(ev.clientY));
    };
    stage.addEventListener('pointermove', follow, { signal, passive: true });
    stage.addEventListener('pointerdown', (ev) => { if (!ev.isPrimary) return; downAt = performance.now(); downY = ev.clientY; follow(ev); }, { signal, passive: true });
    stage.addEventListener('pointerup', (ev) => {
      if (!ev.isPrimary || !downAt) return;
      if (performance.now() - downAt < 220 && Math.abs(ev.clientY - downY) < 12) this.dash();
      downAt = 0;
    }, { signal, passive: true });

    // Keyboard: ArrowUp/ArrowDown move while held; Space or ArrowRight dashes.
    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') { ev.preventDefault(); this.keys.add(ev.key); }
      else if ((ev.key === ' ' || ev.key === 'ArrowRight') && !ev.repeat) { ev.preventDefault(); this.dash(); }
    }, { signal });
    window.addEventListener('keyup', (ev) => this.keys.delete(ev.key), { signal });
    window.addEventListener('blur', () => this.keys.clear(), { signal });
    window.addEventListener('resize', () => { this.rect = null; this.water?.resize(); }, { signal }); // orientation changes fire resize too
    this.water = Water.create(stage, this.el, { ...WATER[dest.id], ...variant?.water });
    // pointercancel / pointerleave: nothing is held, the fox simply keeps its current target.
  }

  get progressRamp() { return Math.min(1, this.elapsed / this.dest.level.rampMs); }
  get speed() { return lerp(this.dest.level.speedStart, this.dest.level.speedEnd, this.progressRamp); }

  private clampY(y: number) {
    const { band } = SCENE_ART[this.dest.id];
    return Math.max(band.top, Math.min(band.bottom, y));
  }

  /** The scene's client rect and slice fit, cached until the next resize (getBoundingClientRect forces layout). */
  private rect: DOMRect | null = null;
  private fit() {
    if (!this.rect) this.rect = this.el.getBoundingClientRect();
    const r = this.rect;
    const s = Math.max(r.width / SCENE_W, r.height / SCENE_H);
    return { s, ox: r.left + (r.width - SCENE_W * s) / 2, oy: r.top + (r.height - SCENE_H * s) / 2 };
  }

  /** Convert a viewport Y (CSS px) to scene units, accounting for the slice fit. */
  private toSceneY(clientY: number) { const { s, oy } = this.fit(); return (clientY - oy) / s; }

  /** Convert scene coordinates to viewport CSS px (for effects). */
  toScreen(x: number, y: number) { const { s, ox, oy } = this.fit(); return { x: ox + x * s, y: oy + y * s }; }

  foxScreenPoint() { return this.toScreen(FOX_X, this.foxY); }
  /** Viewport point just behind Capi's feet (for dust). Feet sit at y=58 in Capi's local space, drawn at 0.6 x depth. */
  feetScreenPoint() { return this.toScreen(FOX_X - 4, this.foxY + 34 * this.depthScale(this.foxY)); }

  /** Squash-and-stretch on a catch; restarting the class restarts the CSS animation. */
  squash() {
    this.foxInner.classList.remove('squash');
    void (this.foxInner as unknown as HTMLElement).getBoundingClientRect();
    this.foxInner.classList.add('squash');
  }

  /** Depth cue: things lower on screen are closer, so slightly bigger. */
  private depthScale(y: number) {
    const { band } = SCENE_ART[this.dest.id];
    return lerp(0.82, 1.08, (y - band.top) / (band.bottom - band.top));
  }

  private placeFox() {
    this.foxG.setAttribute('transform', `translate(${FOX_X} ${this.foxY}) scale(${this.depthScale(this.foxY) * 0.6})`);
    this.hintG.setAttribute('transform', `translate(${FOX_X + 70} ${this.foxY})`);
  }

  /** Starts a dash unless finished or cooling down. Returns whether it started. */
  dash() {
    if (this.finished || this.dashCooldown > 0) return false;
    this.dashLeft = FEEL.dashMs;
    this.dashCooldown = FEEL.dashMs + FEEL.dashCooldownMs;
    this.dashes++;
    this.foxG.classList.add('dashing');
    this.handlers.onDash();
    return true;
  }
  get dashing() { return this.dashLeft > 0; }

  update(dt: number) {
    const sec = dt / 1000;
    this.elapsedTotal += dt;
    if (!this.finished) this.elapsed += dt;
    this.water?.render(this.elapsedTotal);
    const speed = this.finished ? this.speed * 0.6 : this.speed;

    // Parallax
    for (const l of this.layers) {
      l.offset = (l.offset + speed * l.def.speed * sec) % l.def.width;
      l.g.setAttribute('transform', `translate(${-l.offset} 0)`);
    }

    // Keyboard hold
    if (!this.finished) {
      if (this.keys.has('ArrowUp')) this.targetY = this.clampY(this.targetY - FEEL.keySpeed * sec);
      if (this.keys.has('ArrowDown')) this.targetY = this.clampY(this.targetY + FEEL.keySpeed * sec);
    }
    // Dash window and cooldown
    if (this.dashLeft > 0) { this.dashLeft -= dt; if (this.dashLeft <= 0) this.foxG.classList.remove('dashing'); }
    if (this.dashCooldown > 0) this.dashCooldown -= dt;

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
          } else if (this.dashLeft > 0) {
            e.el.classList.add('dodged');
            this.dodges++;
            this.handlers.onDodge(e, screen);
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
      if (e.x < DESPAWN_X) { this.release(e); return false; }
      return true;
    });
  }

  private spawn() {
    const { level, obstacles } = this.dest;
    const items = this.theme.items;
    const { band } = SCENE_ART[this.dest.id];
    const obstacleChance = lerp(level.obstacleStart, level.obstacleEnd, this.progressRamp);
    const y = band.top + this.random() * (band.bottom - band.top);
    if (this.random() < obstacleChance) {
      const def = obstacles[Math.floor(this.random() * obstacles.length)];
      this.addEntity('obstacle', def.id, SPAWN_X, y, def.scale ?? 1, OBSTACLE_ART[def.id]);
      return;
    }
    const def = this.pickWeighted(items);
    // Items arrive in readable patterns: single, a row, an arc or a zigzag; every y stays in the band.
    const r = this.random();
    const pattern: SpawnPattern = r < 0.5 ? 'single' : r < 0.7 ? 'row' : r < 0.85 ? 'arc' : 'zigzag';
    this.patternsSeen.add(pattern);
    const n = pattern === 'single' ? 1 : pattern === 'row' ? 3 : 4;
    const dir = this.random() < 0.5 ? 1 : -1;
    const isSignature = def.id === this.theme.coupon.itemId;
    for (let i = 0; i < n; i++) {
      const dy = pattern === 'arc' ? -Math.sin((i / (n - 1)) * Math.PI) * 90 * dir
        : pattern === 'zigzag' ? (i % 2 ? 70 : -70) * dir
        : 0;
      const golden = isSignature && this.random() < FEEL.goldChance;
      this.addEntity('item', def.id, SPAWN_X + i * 64, this.clampY(y + dy), def.scale ?? 1, ITEM_ART[def.id](), golden);
    }
  }

  private pickWeighted<T extends { weight?: number }>(list: T[]): T {
    const total = list.reduce((n, i) => n + (i.weight ?? 1), 0);
    let r = this.random() * total;
    for (const i of list) { r -= i.weight ?? 1; if (r <= 0) return i; }
    return list[list.length - 1];
  }

  /** Entity <g> nodes are pooled per kind:id so a run allocates each item/obstacle markup only once or twice. */
  private pool = new Map<string, SVGGElement[]>();
  poolSize() { let n = 0; for (const l of this.pool.values()) n += l.length; return n; }

  private addEntity(kind: Entity['kind'], id: ItemId | ObstacleId, x: number, y: number, scale: number, markup: string, golden = false) {
    const key = `${kind}:${id}`;
    let el = this.pool.get(key)?.pop();
    if (!el) {
      el = document.createElementNS(SVG_NS, 'g');
      el.setAttribute('class', `entity entity--${kind} entity--${id}`);
      el.innerHTML = `<g class="entity-anim"><g class="entity-art" transform="scale(${scale})">${markup}</g></g>`;
    }
    el.classList.toggle('entity--golden', golden);
    el.setAttribute('transform', `translate(${x} ${y}) scale(${this.depthScale(y)})`);
    this.entityLayer.appendChild(el);
    this.entities.push({ kind, id, x, y, el, done: false, golden });
  }

  private release(e: Entity) {
    e.el.classList.remove('collected', 'bumped', 'dodged', 'fade', 'entity--golden');
    e.el.remove();
    const key = `${e.kind}:${e.id}`;
    const list = this.pool.get(key) ?? [];
    if (list.length < POOL_MAX) list.push(e.el);
    this.pool.set(key, list);
  }

  /** Debug/test accessor: upcoming live entities in scene units. */
  liveEntities() { return this.entities.filter((e) => !e.done).map((e) => ({ kind: e.kind, id: e.id, x: e.x, y: e.y, golden: e.golden })); }
  get foxPosition() { return { x: FOX_X, y: this.foxY }; }
  /** Debug/test accessor: dash, dodge and spawn-pattern counters. */
  get feel() { return { dashes: this.dashes, dodges: this.dodges, dashing: this.dashLeft > 0, cooldown: this.dashCooldown > 0, patterns: [...this.patternsSeen] }; }

  setMood(mood: CapyMood) {
    this.foxInner.innerHTML = capyGroup(mood, this.theme.costume);
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

  destroy() { this.water?.destroy(); this.water = null; this.keys.clear(); this.foxG.classList.remove('dashing'); this.el.remove(); this.entities = []; this.pool.clear(); }
}
