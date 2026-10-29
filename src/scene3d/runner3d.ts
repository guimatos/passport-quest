import { FEEL, type DestinationDef, type ItemId, type ObstacleId, type ThemeDef } from '../data/destinations';
import { SCENE_ART } from '../art/scenes';
import type { CapyMood } from '../art/capy';
import { svgFromString } from '../lib/dom';
import { mat4, multiply, perspective, lookAt, trs, clamp, lerp, type Mat4 } from '../gl/math';
import { MeshBuilder, hex, mix, type RGB } from '../gl/mesh';
import { Renderer, makeMesh, type Mesh, type Env } from '../gl/renderer';
import { buildCapi, buildItem, buildObstacle, buildShadow, type CapiMeshes } from './models';
import { pickWeighted, pickPattern, type Entity, type RunnerApi, type RunnerHandlers, type SpawnPattern, type LiveEntity } from '../scene/types';

/** Lateral half-width of the play band (world units). */
export const BAND_HALF = 2.0;
/** Pointer control maps the stage width onto ±CONTROL_HALF, slightly wider than the band so the edges are reachable. */
const CONTROL_HALF = BAND_HALF + 0.5;
/** 2D scene units per second become world units per second through this divisor (keeps `level` tuning untouched). */
const SPEED_DIV = 16;
const SPAWN_Z = -62;
const DESPAWN_Z = 7;
const ROW_SPACING = 2.2;
const PATTERN_SPREAD = 1.4;
const FOLLOW_RATE = 11;
const LEAN_MAX = 14 * Math.PI / 180;
const KEY_SPEED = 4.5;
const ITEM_HEIGHT = 0.75;

interface Entity3D extends Entity {
  x: number;
  z: number;
  /** Rest height of the model's origin. */
  h: number;
  mesh: Mesh;
  scale: number;
  phase: number;
  anim: 'live' | 'pop' | 'bump' | 'dodge';
  /** Milliseconds since the end animation started. */
  t: number;
}

/**
 * The 3D endless runner: Capi runs into the screen along a band, the world
 * streams toward the camera, items and obstacles spawn far ahead. Same spawn
 * timing, patterns, dash and feel rules as the SVG runner; control is lateral
 * (pointer X, ArrowLeft/ArrowRight). All motion is driven by update(dt); the
 * runner owns no timers, and destroy() loses the GL context on purpose.
 */
export class Runner3D implements RunnerApi {
  static create(dest: DestinationDef, theme: ThemeDef, handlers: RunnerHandlers, random: () => number, signal: AbortSignal, stage: HTMLElement): Runner3D | null {
    const canvas = document.createElement('canvas');
    canvas.className = 'gl';
    canvas.setAttribute('aria-hidden', 'true');
    const renderer = Renderer.create(canvas);
    if (!renderer) return null;
    try { return new Runner3D(dest, theme, handlers, random, signal, stage, canvas, renderer); } catch { renderer.destroy(); return null; }
  }

  readonly mode = '3d' as const;
  readonly moveWords = 'left and right';
  readonly el: HTMLDivElement;
  readonly water = null;
  reducedMotion = false;
  private hintG: SVGSVGElement;
  private entities: Entity3D[] = [];
  private capiX = 0;
  private targetX = 0;
  private lean = 0;
  private elapsed = 0;
  private elapsedTotal = 0;
  private spawnIn = 900;
  private finished = false;
  private stunned = 0;
  private hintOn = false;
  private dashLeft = 0;
  private dashCooldown = 0;
  private dashes = 0;
  private dodges = 0;
  private squashT = 0;
  private mood: CapyMood = 'run';
  private keys = new Set<string>();
  private patternsSeen = new Set<SpawnPattern>();
  private itemMeshes = new Map<string, Mesh>();
  private capi: CapiMeshes;
  private shadow: Mesh;
  private ground: Mesh;
  private sky: Mesh;
  private groundOffset = 0;
  private env: Env;
  private proj = mat4();
  private view = mat4();
  private m = mat4();
  private m2 = mat4();
  private rect: DOMRect | null = null;

  private constructor(
    private dest: DestinationDef,
    private theme: ThemeDef,
    private handlers: RunnerHandlers,
    private random: () => number,
    signal: AbortSignal,
    private stage: HTMLElement,
    canvas: HTMLCanvasElement,
    private renderer: Renderer,
  ) {
    this.el = document.createElement('div');
    this.el.className = `scene scene--3d scene--${dest.id}`;
    this.el.setAttribute('aria-hidden', 'true');
    this.el.appendChild(canvas);
    this.hintG = svgFromString(`<svg class="hint-hand hint-hand--3d" viewBox="-44 -22 88 44" visibility="hidden">
        <g class="hint-hand-inner">
          <path d="M-28 0 L28 0 M-16 -11 L-28 0 L-16 11 M16 -11 L28 0 L16 11" stroke="#FFF6E8" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M-28 0 L28 0 M-16 -11 L-28 0 L-16 11 M16 -11 L28 0 L16 11" stroke="#7845D8" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </g></svg>`);
    this.el.appendChild(this.hintG);

    this.capi = buildCapi(theme.costume);
    this.shadow = buildShadow();
    const art = SCENE_ART[dest.id];
    const night = !!art.variants[theme.id]?.bg;
    const sand = dest.id === 'brazil' ? hex('#F2DEA6') : hex('#B8B1A3');
    const g = new MeshBuilder();
    g.plane(140, 160, sand, { p: [0, -0.02, -60] });
    g.plane(2 * BAND_HALF + 1.2, 160, sand, { p: [0, 0, -60] }, 1, 1, 40, (_ix, iz) => (iz % 2 ? mix(sand, hex('#201338'), 0.06) : sand));
    this.ground = makeMesh(g.build());
    const skyTop = night ? hex('#1A1040') : (dest.id === 'brazil' ? hex('#3FB3EE') : hex('#7FA7E8'));
    const horizon = night ? hex(dest.id === 'brazil' ? '#8A4FA8' : '#7A3F6E') : (dest.id === 'brazil' ? hex('#CDEFFB') : hex('#FFE1B8'));
    const s = new MeshBuilder();
    const strips = 14;
    for (let i = 0; i < strips; i++) {
      const y0 = -40 + (i / strips) * 200, y1 = -40 + ((i + 1) / strips) * 200;
      s.quad([-400, y0, -150], [400, y0, -150], [400, y1, -150], [-400, y1, -150], mix(horizon, skyTop, Math.pow(i / (strips - 1), 0.7)), 0);
    }
    this.sky = makeMesh(s.build());
    this.env = { horizon, light: [-0.5, 1, 0.6], ambient: night ? 0.5 : 0.62, fogNear: 30, fogFar: 120 };

    // Pointer control: Capi follows the pointer's horizontal position; a quick tap is a dash.
    let downAt = 0, downX = 0, downY = 0;
    const follow = (ev: PointerEvent) => {
      if (!ev.isPrimary || this.finished) return;
      this.targetX = clamp(this.toWorldX(ev.clientX), -BAND_HALF, BAND_HALF);
    };
    stage.addEventListener('pointermove', follow, { signal, passive: true });
    stage.addEventListener('pointerdown', (ev) => { if (!ev.isPrimary) return; downAt = performance.now(); downX = ev.clientX; downY = ev.clientY; follow(ev); }, { signal, passive: true });
    stage.addEventListener('pointerup', (ev) => {
      if (!ev.isPrimary || !downAt) return;
      if (performance.now() - downAt < 220 && Math.abs(ev.clientX - downX) < 12 && Math.abs(ev.clientY - downY) < 12) this.dash();
      downAt = 0;
    }, { signal, passive: true });
    // Keyboard: ArrowLeft/ArrowRight move while held; Space or ArrowUp dashes.
    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { ev.preventDefault(); this.keys.add(ev.key); }
      else if ((ev.key === ' ' || ev.key === 'ArrowUp') && !ev.repeat) { ev.preventDefault(); this.dash(); }
    }, { signal });
    window.addEventListener('keyup', (ev) => this.keys.delete(ev.key), { signal });
    window.addEventListener('blur', () => this.keys.clear(), { signal });
    window.addEventListener('resize', () => { this.rect = null; this.fit(); }, { signal });
    this.fit();
  }

  get stats() { return { gl: !this.renderer.lost, draws: this.renderer.draws }; }
  get progressRamp() { return Math.min(1, this.elapsed / this.dest.level.rampMs); }
  get speed() { return lerp(this.dest.level.speedStart, this.dest.level.speedEnd, this.progressRamp); }
  private get worldSpeed() { return (this.finished ? this.speed * 0.6 : this.speed) / SPEED_DIV; }

  private fit() {
    if (!this.rect) this.rect = this.stage.getBoundingClientRect();
    this.renderer.resize(this.rect.width, this.rect.height);
    return this.rect;
  }

  private toWorldX(clientX: number) { const r = this.fit(); return ((clientX - r.left) / r.width - 0.5) * 2 * CONTROL_HALF; }
  /** Inverse of the pointer mapping: where to put the pointer to steer to lateral x (test helper). */
  toScreen(x: number, _y: number) { const r = this.fit(); return { x: r.left + (x / (2 * CONTROL_HALF) + 0.5) * r.width, y: r.top + r.height * 0.72 }; }

  private projectPoint(x: number, y: number, z: number) {
    const r = this.fit();
    const p = this.renderer.project(x, y, z) ?? { x: r.width / 2, y: r.height * 0.7 };
    return { x: r.left + p.x, y: r.top + p.y };
  }
  foxScreenPoint() { return this.projectPoint(this.capiX, 1.0, 0); }
  feetScreenPoint() { return this.projectPoint(this.capiX, 0.05, 0.3); }
  get foxPosition() { return { x: this.capiX, y: 0 }; }
  liveEntities(): LiveEntity[] { return this.entities.filter((e) => !e.done).map((e) => ({ kind: e.kind, id: e.id, x: e.x, y: -e.z, golden: e.golden })); }
  get feel() { return { dashes: this.dashes, dodges: this.dodges, dashing: this.dashLeft > 0, cooldown: this.dashCooldown > 0, patterns: [...this.patternsSeen] }; }
  poolSize() { return this.itemMeshes.size; }

  squash() { this.squashT = 300; }
  setMood(mood: CapyMood) { this.mood = mood; }
  setHint(on: boolean) {
    if (this.hintOn === on) return;
    this.hintOn = on;
    this.hintG.setAttribute('visibility', on ? 'visible' : 'hidden');
  }

  dash() {
    if (this.finished || this.dashCooldown > 0) return false;
    this.dashLeft = FEEL.dashMs;
    this.dashCooldown = FEEL.dashMs + FEEL.dashCooldownMs;
    this.dashes++;
    this.handlers.onDash();
    return true;
  }
  get dashing() { return this.dashLeft > 0; }

  update(dt: number) {
    const sec = dt / 1000;
    this.elapsedTotal += dt;
    if (!this.finished) this.elapsed += dt;
    const speed = this.worldSpeed;
    this.groundOffset = (this.groundOffset + speed * sec) % 8;

    if (!this.finished) {
      if (this.keys.has('ArrowLeft')) this.targetX = clamp(this.targetX - KEY_SPEED * sec, -BAND_HALF, BAND_HALF);
      if (this.keys.has('ArrowRight')) this.targetX = clamp(this.targetX + KEY_SPEED * sec, -BAND_HALF, BAND_HALF);
    }
    if (this.dashLeft > 0) this.dashLeft -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.squashT > 0) this.squashT -= dt;

    const k = 1 - Math.exp(-FOLLOW_RATE * sec);
    const prevX = this.capiX;
    this.capiX += (this.targetX - this.capiX) * k;
    const vx = sec > 0 ? (this.capiX - prevX) / sec : 0;
    const targetLean = this.reducedMotion ? 0 : clamp(-vx * 0.09, -LEAN_MAX, LEAN_MAX);
    this.lean += (targetLean - this.lean) * (1 - Math.exp(-10 * sec));
    if (this.stunned > 0) {
      this.stunned -= dt;
      if (this.stunned <= 0) this.setMood('run');
    }

    if (!this.finished) {
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) {
        this.spawn();
        const { level } = this.dest;
        this.spawnIn = lerp(level.spawnGapStart, level.spawnGapEnd, this.progressRamp) * (0.85 + this.random() * 0.3);
      }
    }

    for (const e of this.entities) {
      e.z += speed * sec;
      if (e.done) { e.t += dt; continue; }
      if (this.finished) continue;
      const dx = Math.abs(e.x - this.capiX), dz = Math.abs(e.z);
      const hit = e.kind === 'item' ? dx < 1.0 && dz < 0.7 : dx < 0.8 && dz < 0.6;
      if (!hit) continue;
      const screen = this.projectPoint(e.x, e.h, e.z);
      if (e.kind === 'item') {
        e.done = true; e.anim = 'pop'; e.t = 0;
        this.handlers.onCollect(e, screen);
      } else if (this.dashLeft > 0) {
        e.done = true; e.anim = 'dodge'; e.t = 0;
        this.dodges++;
        this.handlers.onDodge(e, screen);
      } else if (this.stunned <= 0) {
        e.done = true; e.anim = 'bump'; e.t = 0;
        this.stunned = 700;
        this.setMood('ouch');
        this.handlers.onHit(e, screen);
      }
    }
    this.entities = this.entities.filter((e) => e.z < DESPAWN_Z && !(e.done && e.t > 600));
    this.render();
  }

  private spawn() {
    const { level, obstacles } = this.dest;
    const obstacleChance = lerp(level.obstacleStart, level.obstacleEnd, this.progressRamp);
    const x = (this.random() * 2 - 1) * BAND_HALF;
    if (this.random() < obstacleChance) {
      const def = obstacles[Math.floor(this.random() * obstacles.length)];
      this.addEntity('obstacle', def.id, x, SPAWN_Z, def.scale ?? 1);
      return;
    }
    const def = pickWeighted(this.theme.items, this.random);
    const pattern = pickPattern(this.random());
    this.patternsSeen.add(pattern);
    const n = pattern === 'single' ? 1 : pattern === 'row' ? 3 : 4;
    const dir = this.random() < 0.5 ? 1 : -1;
    const isSignature = def.id === this.theme.coupon.itemId;
    for (let i = 0; i < n; i++) {
      const dx = pattern === 'arc' ? -Math.sin((i / (n - 1)) * Math.PI) * PATTERN_SPREAD * dir
        : pattern === 'zigzag' ? (i % 2 ? PATTERN_SPREAD : -PATTERN_SPREAD) * dir
        : 0;
      const golden = isSignature && this.random() < FEEL.goldChance;
      this.addEntity('item', def.id, clamp(x + dx, -BAND_HALF, BAND_HALF), SPAWN_Z - i * ROW_SPACING, def.scale ?? 1, golden);
    }
  }

  private meshFor(kind: Entity['kind'], id: ItemId | ObstacleId) {
    const key = `${kind}:${id}`;
    let m = this.itemMeshes.get(key);
    if (!m) { m = kind === 'item' ? buildItem(id as ItemId) : buildObstacle(id as ObstacleId); this.itemMeshes.set(key, m); }
    return m;
  }

  private addEntity(kind: Entity['kind'], id: ItemId | ObstacleId, x: number, z: number, scale: number, golden = false) {
    const h = kind === 'item' ? ITEM_HEIGHT : id === 'gull' ? 0.9 : 0;
    this.entities.push({ kind, id, x, z, h, mesh: this.meshFor(kind, id), scale: scale * (kind === 'item' ? 1.1 : 1), phase: this.random() * Math.PI * 2, anim: 'live', t: 0, done: false, golden });
  }

  // ---------- rendering ----------

  private render() {
    const r = this.renderer;
    if (r.lost) return;
    const t = this.elapsedTotal / 1000;
    const camX = this.capiX * 0.4;
    const bob = this.reducedMotion ? 0 : Math.sin(t * 9) * 0.03;
    perspective(this.proj, 64 * Math.PI / 180, r.aspect, 0.5, 170);
    lookAt(this.view, [camX, 4.2 + bob, 7.4], [camX, 0.9, -9]);
    r.begin(this.proj, this.view, this.env, this.reducedMotion ? 0 : t);
    r.draw(this.sky, trs(this.m, camX, 0, 0), { unlit: true });
    r.draw(this.ground, trs(this.m, 0, 0, this.groundOffset));

    // Ground shadows (blended) then entities
    for (const e of this.entities) {
      if (e.done) continue;
      r.draw(this.shadow, trs(this.m, e.x, 0.01, e.z, 0, 0, 0, e.scale * 0.9), { alpha: 0.22 });
    }
    r.draw(this.shadow, trs(this.m, this.capiX, 0.012, 0, 0, 0, 0, 1.1, 1, 1.2), { alpha: 0.25 });
    for (const e of this.entities) this.drawEntity(e, t);
    this.drawCapi(t);
  }

  private drawEntity(e: Entity3D, t: number) {
    const r = this.renderer;
    const golden = e.golden ? { tint: hex('#FFD966') as RGB, tintMix: 0.45 } : {};
    if (e.anim === 'live') {
      const bob = e.kind === 'item' && !this.reducedMotion ? Math.sin(t * (e.golden ? 7 : 4.5) + e.phase) * 0.12 : 0;
      const spin = e.kind === 'item' ? t * (e.golden ? 3 : 1.6) + e.phase : 0;
      r.draw(e.mesh, trs(this.m, e.x, e.h + bob, e.z, 0, spin, 0, e.scale), golden);
      return;
    }
    const k = Math.min(1, e.t / (e.anim === 'pop' ? 280 : 500));
    if (k >= 1) return;
    if (e.anim === 'pop') {
      r.draw(e.mesh, trs(this.m, e.x, e.h + k * 0.8, e.z, 0, t * 6, 0, e.scale * (1 + k * 0.6)), { ...golden, alpha: 1 - k });
    } else {
      const dir = e.x >= this.capiX ? 1 : -1;
      const fly = e.anim === 'dodge' ? 1.6 : 1.0;
      r.draw(e.mesh, trs(this.m, e.x + dir * k * 2.2 * fly, e.h + Math.sin(k * Math.PI) * 1.6 * fly, e.z + k * 2, k * 7, k * 4, 0, e.scale * (1 - k * 0.4)), { alpha: 1 - k * k });
    }
  }

  private drawCapi(t: number) {
    const r = this.renderer;
    if (this.stunned > 0 && Math.floor(this.stunned / 80) % 2 === 1) return; // stun blink
    const cheer = this.mood === 'cheer';
    const run = this.finished ? 0.5 : 1;
    const cycle = t * 14 * run;
    const hop = cheer ? Math.abs(Math.sin(t * 6)) * 0.35 : Math.abs(Math.sin(cycle)) * 0.08;
    const dashLunge = this.dashLeft > 0 ? -0.5 : 0;
    const sq = this.squashT > 0 ? Math.sin((this.squashT / 300) * Math.PI) : 0;
    const root = trs(this.m, this.capiX, hop, dashLunge, this.dashLeft > 0 ? -0.25 : 0, 0, this.lean, 1 + sq * 0.18, 1 - sq * 0.18, 1);
    const part = (mesh: Mesh, px: number, py: number, pz: number, rx = 0, rz = 0, opts = {}) => {
      trs(this.m2, px, py, pz, rx, 0, rz);
      r.draw(mesh, multiply(this.m2, root, this.m2), opts);
    };
    const ouch = this.mood === 'ouch' ? { tint: hex('#D9534F') as RGB, tintMix: 0.3 } : {};
    part(this.capi.body, 0, 0, 0, 0, 0, ouch);
    part(this.capi.head, 0, 1.62, -0.04, cheer ? -0.15 : Math.sin(cycle) * 0.05, 0, ouch);
    const legA = Math.sin(cycle) * 0.75 * run, armA = cheer ? -2.6 : -Math.sin(cycle) * 0.6 * run;
    part(this.capi.leg, -0.17, 0.56, 0, legA);
    part(this.capi.leg, 0.17, 0.56, 0, -legA);
    part(this.capi.arm, -0.46, 1.22, 0, armA, cheer ? -0.3 : 0.08);
    part(this.capi.arm, 0.46, 1.22, 0, cheer ? armA : -armA, cheer ? 0.3 : -0.08);
    // Dash ghosts behind Capi
    if (this.dashLeft > 0 && !this.reducedMotion) {
      for (let i = 1; i <= 2; i++) {
        trs(this.m2, 0, 0, i * 0.5);
        const ghost = multiply(this.m2, root, this.m2) as Mat4;
        r.draw(this.capi.body, ghost, { tint: hex('#FFF6E8'), tintMix: 0.8, alpha: 0.3 / i });
      }
    }
  }

  finish() {
    this.finished = true;
    this.setHint(false);
    this.setMood('cheer');
    this.stunned = 0;
  }

  destroy() {
    this.keys.clear();
    this.entities = [];
    this.renderer.destroy();
    this.el.remove();
  }
}
