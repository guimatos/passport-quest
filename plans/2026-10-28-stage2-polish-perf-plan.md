# Stage 2 polish and performance: Implementation Plan

**Goal:** Give Passport Quest measurable performance work, one real shader, visual juice and an enforced check pipeline, without breaking any Stage 1 constraint (no runtime network, no runtime deps, demo labelling, single `reset()`, pause while hidden, restart reliability).

**Ticket:** none, direct request (interview-criteria feedback, 2026-10-28).

**Repos & branch:** `.` on `stage2/polish-perf`, from `main` (tag `stage1-v1` untouched).

**PRs & release:** no remote, no PR. Gates: `npm run check` green. Release: `npm run package`, then tag `stage2-v1` on request. Never move `stage1-v1`.

**Governing rules:** `.claude/change-loop.md` ("Never" list, checks, escalation), README "Project structure" and "Credits", `docs/DEVELOPMENT_NOTE.md` AI section is the developer's (not edited), the brief's section 6 (lifecycle, restart, no external requests).

**Blast radius:**
- `scripts/e2e.mjs` asserts `#fx` is empty after restart and reads `window.passportQuest.debug` → extended in Tasks 2 and 3, same commit.
- `scripts/package.mjs` copies `scripts/` and `docs/` into the ZIP → new scripts ship automatically; `.github/` is not copied (fine).
- `src/art/scenes.ts` backdrops paint opaque sea/river → Task 4 marks those rects with `class="water-rect"` so CSS can hide them when the WebGL layer is active.
- All scripts hardcode the macOS Chrome path → Task 5 adds a `CHROME_PATH` override so CI can run them.
- `index.html` gains two elements (`#water` canvas slot, `#fx-canvas`); `#fx` keeps DOM-based fly/float nodes.

**Architecture:** Keep the SVG scene and the DOM HUD. Add two canvases inside `#stage`: a WebGL water canvas **under** the SVG (`#water`, z-index 0, transparent outside the water band) and a 2D particle canvas **over** it (`#fx-canvas`, z-index 4, pooled particles). Both are driven from `Game.frame(dt)` so they pause with the game and are destroyed by `reset()`. Entity `<g>` nodes are pooled per `kind:id`. A perf overlay (`?perf=1`) and a throttled measurement script produce the numbers for the dev note. A `scripts/check.mjs` runner plus a GitHub workflow enforce the gates and a bundle budget.

**Runtime scenarios:**
1. Catch an item: Capi squashes then stretches, a sparkle burst and a short trail follow the item to the HUD, dust puffs keep appearing under Capi's feet while running.
2. Hit an obstacle: the stage shakes for ~250 ms, a brief warm flash covers the scene, "Ouch!" still shows; with `prefers-reduced-motion: reduce` there is no shake and no flash fade-in beyond opacity.
3. Sea (Rio) and river (Porto) ripple with the WebGL shader; with WebGL unavailable (`?nowebgl=1`), the SVG gradient shows and no error is logged.
4. Hide the tab mid-run: water, particles and shake all freeze; resume continues without a jump.
5. Restart from map, mid-run, redeem, journal and final, 12 times: `debug.particles === 0`, no `#water` canvas left, no WebGL context left (`debug.waterAlive === false`), `#fx` empty.
6. Screen changes (start → map, map → run, journal → map, journal → final) use a 220 ms wipe; the wipe never blocks input longer than that and is cleared by `reset()`.
7. `?perf=1` shows fps, average and worst frame time and live SVG node count; `node scripts/perfcheck.mjs` prints before/after numbers at 6x CPU throttle, recorded in the dev note.
8. `npm run check` runs typecheck, build, both e2e sizes, layoutcheck, perfcheck (non-blocking print) and the bundle budget (`dist/` ≤ 300,000 bytes), and fails on any red step.

---

### Task 1: Perf overlay and throttled measurement script (baseline numbers)

**Repo:** `.`

**Files:**
- Create: `src/lib/perf.ts`
- Create: `scripts/perfcheck.mjs`
- Modify: `src/game.ts` (constructor, `frame`, `teardown`, `debug`)
- Modify: `src/styles.css` (append)
- Modify: `package.json` (scripts)

- [ ] **Step 1: Implement**

`src/lib/perf.ts`:
```typescript
/** Dev overlay (?perf=1): fps, average and worst raw frame time, live SVG node count. */
export interface PerfSample { fps: number; avgMs: number; worstMs: number; nodes: number }

export class PerfOverlay {
  private el: HTMLElement;
  private last = performance.now();
  private frames = 0;
  private acc = 0;
  private worst = 0;
  sample: PerfSample = { fps: 0, avgMs: 0, worstMs: 0, nodes: 0 };

  constructor(private root: HTMLElement, private sceneRoot: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'perf';
    this.el.setAttribute('aria-hidden', 'true');
    root.appendChild(this.el);
  }

  /** Call once per animation frame, before game work, with raw wall-clock timing. */
  tick() {
    const now = performance.now();
    const dt = now - this.last;
    this.last = now;
    this.frames++; this.acc += dt; this.worst = Math.max(this.worst, dt);
    if (this.acc >= 500) {
      this.sample = { fps: (this.frames / this.acc) * 1000, avgMs: this.acc / this.frames, worstMs: this.worst, nodes: this.sceneRoot.querySelectorAll('*').length };
      this.el.textContent = `${this.sample.fps.toFixed(0)} fps · ${this.sample.avgMs.toFixed(1)} ms avg · ${this.sample.worstMs.toFixed(0)} ms worst · ${this.sample.nodes} nodes`;
      this.frames = 0; this.acc = 0; this.worst = 0;
    }
  }

  destroy() { this.el.remove(); }
}
```

`src/game.ts` (constructor, after `this.hud = …`):
```typescript
    if (new URLSearchParams(location.search).has('perf')) this.perf = new PerfOverlay(this.stage, this.sceneRoot);
```
Field: `private perf: PerfOverlay | null = null;` and in `frame(dt)` first line: `this.perf?.tick();`. In `debug` add `perf: this.perf?.sample ?? null`. The overlay survives `reset()` on purpose (it is a URL flag, not game state); do not destroy it in `teardown`.

`src/styles.css` (append):
```css
.perf { position: absolute; left: 8px; top: 50%; z-index: 60; font-size: 10px; font-weight: 700; color: #FFD966; background: rgba(32,19,56,0.75); padding: 3px 6px; border-radius: 6px; pointer-events: none; white-space: nowrap; }
```

`scripts/perfcheck.mjs`:
```javascript
// Dev-only: measures fps/frame time/node count at 6x CPU throttle during the busiest scene (Rio Party at night).
// Usage: node scripts/perfcheck.mjs [url] [seconds]
import puppeteer from 'puppeteer-core';
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = (process.argv[2] ?? 'http://localhost:5173/') + '?seed=7&perf=1';
const seconds = Number(process.argv[3] ?? 15);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--enable-precise-memory-info'] });
const page = await browser.newPage();
await page.setViewport({ width: 320, height: 568, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto(url, { waitUntil: 'networkidle0' });
await page.evaluate(() => { window.__autopilot = (ms) => new Promise((res) => { const g = window.passportQuest, stage = document.getElementById('stage'); const end = performance.now() + ms; const step = () => { const d = g.debug; if (d.state !== 'playing' || performance.now() > end) return res(); const a = d.entities.filter((e) => e.x > d.fox.x - 10 && e.kind === 'item').sort((p, q) => p.x - q.x); if (a.length) { const p = d.toScreen(0, a[0].y); stage.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: p.y, isPrimary: true, pointerType: 'mouse', bubbles: true })); } requestAnimationFrame(step); }; step(); }); });
await page.tap('.btn--play'); await sleep(300); await page.tap('.dest-btn[data-dest="brazil"]'); await sleep(1900); await page.tap('.theme-btn[data-theme="party"]'); await sleep(500);
const cdp = await page.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
const samples = [];
const run = page.evaluate((ms) => window.__autopilot(ms), seconds * 1000);
for (let i = 0; i < seconds * 2; i++) { await sleep(500); samples.push(await page.evaluate(() => window.passportQuest.debug.perf)); }
await run;
const mem = await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
const valid = samples.filter((s) => s && s.fps > 0);
const avg = (k) => valid.reduce((n, s) => n + s[k], 0) / valid.length;
const result = { throttle: '6x', seconds, fpsAvg: +avg('fps').toFixed(1), fpsMin: +Math.min(...valid.map((s) => s.fps)).toFixed(1), frameAvgMs: +avg('avgMs').toFixed(2), frameWorstMs: +Math.max(...valid.map((s) => s.worstMs)).toFixed(0), nodesAvg: Math.round(avg('nodes')), heapMB: mem };
console.log(JSON.stringify(result));
await browser.close();
```

`package.json` scripts: add `"perf": "node scripts/perfcheck.mjs"`.

- [ ] **Step 2: Check**: run the measurement on the Stage 1 code before any optimization and paste the JSON line into `docs/DEVELOPMENT_NOTE.md` under a new heading `## Performance measurements` as the **Before** row (this task commits the baseline numbers).

- [ ] **Step 3: Verify**
```bash
cd /Users/guilherme.matos/Projects/tests/game
npx tsc --noEmit && node scripts/perfcheck.mjs http://localhost:5173/ 15
```
Expected: a JSON line like `{"throttle":"6x","fpsAvg":…}`; overlay visible at `http://localhost:5173/?perf=1`.

- [ ] **Step 4: Commit**
```bash
git add src/lib/perf.ts scripts/perfcheck.mjs src/game.ts src/styles.css package.json docs/DEVELOPMENT_NOTE.md
git commit -m "Add perf overlay and throttled measurement script with Stage 1 baseline"
```

---

### Task 2: Entity node pooling, cached rects, reduced motion

**Repo:** `.`

**Files:**
- Modify: `src/scene/runner.ts` (`addEntity`, despawn filter in `update`, `toSceneY`, `toScreen`, constructor listeners, `liveEntities`)
- Modify: `src/game.ts` (`flyTo` tween, `init`, `debug`)
- Modify: `src/styles.css` (append reduced-motion rules)
- Modify: `scripts/e2e.mjs` (pool and reduced-motion assertions)

- [ ] **Step 1: Implement**

`src/scene/runner.ts`, pooling (replace `addEntity` and the despawn filter):
```typescript
  private pool = new Map<string, SVGGElement[]>();
  poolSize() { let n = 0; for (const l of this.pool.values()) n += l.length; return n; }

  private addEntity(kind: Entity['kind'], id: ItemId | ObstacleId, x: number, y: number, scale: number, markup: string) {
    const key = `${kind}:${id}`;
    let el = this.pool.get(key)?.pop();
    if (!el) {
      el = document.createElementNS(SVG_NS, 'g');
      el.setAttribute('class', `entity entity--${kind} entity--${id}`);
      el.innerHTML = `<g class="entity-anim"><g class="entity-art" transform="scale(${scale})">${markup}</g></g>`;
    }
    el.setAttribute('transform', `translate(${x} ${y}) scale(${this.depthScale(y)})`);
    this.entityLayer.appendChild(el);
    this.entities.push({ kind, id, x, y, el, done: false });
  }

  private release(e: Entity) {
    e.el.classList.remove('collected', 'bumped', 'fade');
    e.el.remove();
    const key = `${e.kind}:${e.id}`;
    const list = this.pool.get(key) ?? [];
    if (list.length < 12) list.push(e.el);
    this.pool.set(key, list);
  }
```
Despawn: `this.entities = this.entities.filter((e) => { if (e.x < DESPAWN_X) { this.release(e); return false; } return true; });`
Collected items leave the screen by scrolling; the `.collected` pop animation ends at `transform: scale(0)` so the node is invisible until released (same as today, no extra timer).

Cached rect (replace `toSceneY` / `toScreen` bodies and add invalidation):
```typescript
  private rect: DOMRect | null = null;
  private fit() {
    if (!this.rect) this.rect = this.el.getBoundingClientRect();
    const r = this.rect; const s = Math.max(r.width / SCENE_W, r.height / SCENE_H);
    return { r, s, ox: r.left + (r.width - SCENE_W * s) / 2, oy: r.top + (r.height - SCENE_H * s) / 2 };
  }
  private toSceneY(clientY: number) { const { s, oy } = this.fit(); return (clientY - oy) / s; }
  toScreen(x: number, y: number) { const { s, ox, oy } = this.fit(); return { x: ox + x * s, y: oy + y * s }; }
```
Constructor: `window.addEventListener('resize', () => { this.rect = null; }, { signal });` (orientation changes fire resize too).

`src/game.ts` `flyTo`: compute `const s = parts.map.getBoundingClientRect().width / MAP_W;` once before the tween and re-read only in a `resize` handler bound with the signal; the tween body uses the cached `s`.

Reduced motion, `src/game.ts` `init()`:
```typescript
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotion = () => this.app.classList.toggle('reduced-motion', motion.matches);
    applyMotion();
    motion.addEventListener('change', applyMotion, { signal });
    this.reducedMotion = () => motion.matches;
```
Field: `private reducedMotion: () => boolean = () => false;` (Task 3 consults it for shake and particle counts; Task 4 for static water).

`src/styles.css` (append):
```css
#app.reduced-motion .waves, #app.reduced-motion .boat, #app.reduced-motion .palm-crown, #app.reduced-motion .cloud,
#app.reduced-motion .gull-far, #app.reduced-motion .laundry, #app.reduced-motion .bridge-tram, #app.reduced-motion .bulb,
#app.reduced-motion .firework, #app.reduced-motion .sj-balloon, #app.reduced-motion .smoke, #app.reduced-motion .cabin,
#app.reduced-motion .start-capy, #app.reduced-motion .start-fox, #app.reduced-motion .hint-hand-inner { animation: none !important; }
```
Run cycle, pops and HUD transitions stay (they convey state).

`debug` gains `pool: this.runner?.poolSize() ?? 0` and `reducedMotion: this.reducedMotion()`.

- [ ] **Step 2: Check**: `scripts/e2e.mjs`, after the Brazil autopilot run add:
```javascript
check((await page.evaluate(() => window.passportQuest.debug.pool)) > 0, 'entity nodes are pooled and reused');
```
and in the restart loop keep `#scene-root` empty check (pool is per runner and dies with it). Add a reduced-motion case before the visibility test:
```javascript
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.tap('.btn--restart'); await sleep(60);
check(await page.$eval('#app', (e) => e.classList.contains('reduced-motion')), 'reduced-motion class applied');
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
```

- [ ] **Step 3: Verify**
```bash
cd /Users/guilherme.matos/Projects/tests/game
npx tsc --noEmit && node scripts/e2e.mjs http://localhost:5173/ 320 568 && node scripts/perfcheck.mjs http://localhost:5173/ 15
```
Expected: ALL CHECKS PASSED; perfcheck `nodesAvg` lower than the Task 1 baseline and `frameWorstMs` not higher.

- [ ] **Step 4: Commit**
```bash
git add src/scene/runner.ts src/game.ts src/styles.css scripts/e2e.mjs
git commit -m "Pool entity nodes, cache scene rects, honor prefers-reduced-motion"
```

---

### Task 3: Pooled canvas particles and juice (squash, trails, dust, shake, flash, wipe)

**Repo:** `.`

**Files:**
- Create: `src/fx/particles.ts`
- Modify: `src/fx/fx.ts` (burst, confetti → particles; add `trail`, `dust`, `update`, `destroy`)
- Modify: `index.html` (add `<canvas id="fx-canvas"></canvas>` after `#fx`, and `<div id="flash"></div><div id="wipe"></div>` inside `#stage`)
- Modify: `src/scene/runner.ts` (`squash()`, `feetScreenPoint()`)
- Modify: `src/game.ts` (`frame`, `collect`, `hit`, `shake`, `wipeTo`, `teardown`, `debug`)
- Modify: `src/styles.css` (append)
- Modify: `scripts/e2e.mjs` (particle assertions)

- [ ] **Step 1: Implement**

`src/fx/particles.ts`:
```typescript
/** Fixed-size particle pool rendered on a 2D canvas. No allocation per spawn. */
export interface Particle { active: boolean; x: number; y: number; vx: number; vy: number; life: number; ttl: number; size: number; color: string; shape: 0 | 1 | 2; rot: number; vr: number; gravity: number }
export interface SpawnConfig { x: number; y: number; count: number; speed: [number, number]; ttl: [number, number]; size: [number, number]; colors: string[]; shape?: 0 | 1 | 2; gravity?: number; spread?: [number, number]; vy0?: number }

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export class ParticleSystem {
  private ctx: CanvasRenderingContext2D;
  private pool: Particle[];
  private dpr = 1;
  constructor(private canvas: HTMLCanvasElement, capacity = 400) {
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    this.pool = Array.from({ length: capacity }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, ttl: 1, size: 4, color: '#fff', shape: 0 as const, rot: 0, vr: 0, gravity: 0 }));
    this.resize();
  }
  resize() {
    const r = this.canvas.parentElement!.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(r.width * this.dpr); this.canvas.height = Math.round(r.height * this.dpr);
    this.canvas.style.width = `${r.width}px`; this.canvas.style.height = `${r.height}px`;
  }
  get active() { let n = 0; for (const p of this.pool) if (p.active) n++; return n; }
  spawn(c: SpawnConfig) {
    let left = c.count;
    for (const p of this.pool) {
      if (left === 0) break;
      if (p.active) continue;
      const a = c.spread ? rnd(c.spread[0], c.spread[1]) : rnd(0, Math.PI * 2);
      const sp = rnd(c.speed[0], c.speed[1]);
      p.active = true; p.x = c.x; p.y = c.y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp + (c.vy0 ?? 0);
      p.life = 0; p.ttl = rnd(c.ttl[0], c.ttl[1]); p.size = rnd(c.size[0], c.size[1]);
      p.color = c.colors[Math.floor(Math.random() * c.colors.length)]; p.shape = c.shape ?? 0; p.rot = rnd(0, Math.PI * 2); p.vr = rnd(-6, 6); p.gravity = c.gravity ?? 0;
      left--;
    }
  }
  /** dt in ms; positions in CSS px relative to the stage. */
  update(dt: number) {
    const s = dt / 1000;
    const { ctx, dpr } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save(); ctx.scale(dpr, dpr);
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life += s; if (p.life >= p.ttl) { p.active = false; continue; }
      p.vy += p.gravity * s; p.x += p.vx * s; p.y += p.vy * s; p.rot += p.vr * s;
      const t = p.life / p.ttl; ctx.globalAlpha = 1 - t * t;
      ctx.fillStyle = p.color; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      const sz = p.size * (p.shape === 2 ? 1 + t : 1 - t * 0.5);
      if (p.shape === 1) { ctx.fillRect(-sz / 2, -sz * 0.75, sz, sz * 1.5); } else { ctx.beginPath(); ctx.arc(0, 0, sz / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ctx.restore();
  }
  clear() { for (const p of this.pool) p.active = false; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
}
```

`src/fx/fx.ts`: construct `this.particles = new ParticleSystem($('#fx-canvas'))`; `burst`, `confetti` become `spawn` calls (burst: 10 dots, speed 60–160 px/s, ttl 0.4–0.7, gravity 240; confetti: shape 1, speed 20–60, vy0 −40, gravity 160, ttl 1.4–2, spawned along the top edge); add:
```typescript
  trail(x: number, y: number, color: string) { this.particles.spawn({ x, y, count: 2, speed: [5, 20], ttl: [0.25, 0.4], size: [3, 6], colors: [color, '#FFF6E8'] }); }
  dust(x: number, y: number) { this.particles.spawn({ x, y, count: 2, speed: [10, 30], ttl: [0.3, 0.5], size: [4, 8], colors: ['rgba(255,246,232,0.8)', 'rgba(228,197,124,0.8)'], shape: 2, spread: [Math.PI * 1.1, Math.PI * 1.4], vy0: -15 }); }
  update(dt: number) { this.particles.update(dt); }
  resize() { this.particles.resize(); }
  get activeParticles() { return this.particles.active; }
  clear() { this.root.replaceChildren(); this.particles.clear(); }
```
`fly()` keeps its DOM node but calls `this.trail(x, y, color)` from its tween update (color passed in by the caller).

`index.html`: add `<canvas id="fx-canvas" aria-hidden="true"></canvas>`, `<div id="flash" aria-hidden="true"></div>`, `<div id="wipe" aria-hidden="true"></div>` inside `#stage` after `#fx`.

`src/scene/runner.ts`:
```typescript
  squash() { this.foxInner.classList.remove('squash'); void (this.foxInner as unknown as HTMLElement).getBoundingClientRect(); this.foxInner.classList.add('squash'); }
  feetScreenPoint() { return this.toScreen(FOX_X - 4, this.foxY + 34 * this.depthScale(this.foxY)); }
```

`src/game.ts`:
```typescript
  private shakeTween: number | undefined;
  private dustAcc = 0;

  private frame(dt: number) {
    this.perf?.tick();
    this.clock.tick(dt);
    this.fx.update(dt);
    if (this.runner && (this.state === 'playing' || this.state === 'redeem' || this.state === 'journal')) {
      this.runner.update(dt);
      if (this.state === 'playing' && !this.reducedMotion()) {
        this.dustAcc += dt;
        if (this.dustAcc > 110) { this.dustAcc = 0; const p = this.runner.feetScreenPoint(); this.fx.dust(p.x, p.y); }
      }
      // … existing Faster! toast …
    }
  }

  private shake(strength = 6, ms = 260) {
    if (this.reducedMotion()) return;
    this.clock.cancel(this.shakeTween);
    this.shakeTween = this.clock.tween(ms, (t) => {
      const k = (1 - t) * strength;
      this.stage.style.transform = t >= 1 ? '' : `translate(${(Math.random() - 0.5) * 2 * k}px, ${(Math.random() - 0.5) * 2 * k}px)`;
    });
  }

  private flash() {
    const el = $('#flash');
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }

  /** 220 ms wipe: covers the stage, runs cb at the midpoint, uncovers. */
  private wipeTo(cb: () => void) {
    const el = $('#wipe');
    el.classList.remove('wipe-out'); el.classList.add('wipe-in');
    this.clock.after(200, () => { cb(); el.classList.remove('wipe-in'); el.classList.add('wipe-out'); this.clock.after(260, () => el.classList.remove('wipe-out')); });
  }
```
Use `wipeTo` in: Play tap (`() => this.wipeTo(() => this.enterMap())`), `startLevel` (`this.wipeTo(() => this.enterPlaying(index))`), journal continue (`this.wipeTo(() => isLast ? this.enterFinal() : this.enterMap())`). In `collect`: `this.runner!.squash();` and pass `dest.accent` to `fx.fly` for the trail. In `hit`: `this.shake(); this.flash();`. In `teardown`: `this.stage.style.transform = ''; $('#flash').classList.remove('show'); $('#wipe').className = '';`. Resize listener calls `this.fx.resize()`. `debug` gains `particles: this.fx.activeParticles`.

`src/styles.css` (append):
```css
#fx-canvas { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
#flash { position: absolute; inset: 0; z-index: 6; pointer-events: none; background: #FFB38A; opacity: 0; }
#flash.show { animation: flash 0.28s ease-out; }
@keyframes flash { 0% { opacity: 0.55; } 100% { opacity: 0; } }
#wipe { position: absolute; inset: 0; z-index: 40; pointer-events: none; background: var(--purple); transform: translateX(100%); }
#wipe.wipe-in { animation: wipe-in 0.2s ease-in forwards; pointer-events: auto; }
#wipe.wipe-out { animation: wipe-out 0.26s ease-out forwards; }
@keyframes wipe-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes wipe-out { from { transform: translateX(0); } to { transform: translateX(-100%); } }
.runner-inner.squash { animation: squash 0.3s cubic-bezier(.34,1.56,.64,1); transform-origin: 0 58px; }
@keyframes squash { 30% { transform: scale(1.18, 0.82); } 65% { transform: scale(0.9, 1.12); } 100% { transform: none; } }
#app.reduced-motion #flash.show { animation-duration: 0.12s; }
```

- [ ] **Step 2: Check**: `scripts/e2e.mjs`:
```javascript
// after the first catch in Brazil (obstacle hunting phase already ran):
check((await page.evaluate(() => window.passportQuest.debug.particles)) > 0, 'canvas particles active during play');
// in the restart loop, after each restart:
check(await page.evaluate(() => window.passportQuest.debug.particles === 0 && getComputedStyle(document.getElementById('stage')).transform === 'none'), `iteration ${i}: particles cleared and shake reset`);
// after the theme tap (wipe): state must be playing within 450 ms
```
Adjust the existing `sleep(200)` after theme/destination/journal taps to `sleep(500)` for the wipe. Visual review: `node scripts/playshot.mjs <dir> 320 568 party party` and inspect squash/dust/shake frames.

- [ ] **Step 3: Verify**
```bash
cd /Users/guilherme.matos/Projects/tests/game
npx tsc --noEmit && node scripts/e2e.mjs http://localhost:5173/ 320 568 && node scripts/e2e.mjs http://localhost:5173/ 390 844 && node scripts/perfcheck.mjs http://localhost:5173/ 15
```
Expected: ALL CHECKS PASSED at both sizes; perfcheck frame times within ±10% of Task 2 despite particles (DOM sparkle/confetti nodes are gone).

- [ ] **Step 4: Commit**
```bash
git add src/fx/particles.ts src/fx/fx.ts index.html src/scene/runner.ts src/game.ts src/styles.css scripts/e2e.mjs
git commit -m "Pooled canvas particles; squash, trails, dust, shake, flash and wipe"
```

---

### Task 4: WebGL water shader with CSS fallback

**Repo:** `.`

**Files:**
- Create: `src/scene/water.ts`
- Modify: `index.html` (add `<canvas id="water" aria-hidden="true"></canvas>` as the first child of `#stage`)
- Modify: `src/art/scenes.ts` (sea/river rects get `class="water-rect"`; export `WATER: Record<DestinationId, { top: number; bottom: number; deep: string; light: string; foam: string }>`)
- Modify: `src/scene/runner.ts` (constructor creates `Water` when available; `update` calls `water.render(elapsed)`; `destroy` calls `water.destroy()`; class `has-water` on the SVG)
- Modify: `src/game.ts` (`debug.waterAlive`, reduced motion → `water.static = true`)
- Modify: `src/styles.css`, `scripts/e2e.mjs`

- [ ] **Step 1: Implement**

`src/art/scenes.ts` additions:
```typescript
export const WATER: Record<DestinationId, { top: number; bottom: number; deep: string; light: string; foam: string }> = {
  brazil: { top: 330, bottom: 400, deep: '#1E8FD0', light: '#5FD0F0', foam: '#FFF6E8' },
  portugal: { top: 612, bottom: 720, deep: '#1F4470', light: '#4C7FB8', foam: '#D9E6F2' },
};
```
In both backdrops add `class="water-rect"` to the sea/river `<rect>` (and to the night variants' rects). CSS: `.scene.has-water .water-rect { display: none; }`.

`src/scene/water.ts`:
```typescript
/**
 * Animated water as a WebGL fragment shader on a canvas under the SVG scene.
 * Draws only inside the scene's water band (transparent elsewhere). Falls back
 * silently (returns null) when WebGL is unavailable or ?nowebgl=1 is set.
 */
import { SCENE_W, SCENE_H } from './runner';

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `precision mediump float;
uniform vec2 u_res; uniform float u_time; uniform vec4 u_fit; /* ox, oy, scale, dpr */
uniform vec2 u_band; uniform vec3 u_deep; uniform vec3 u_light; uniform vec3 u_foam; uniform float u_speed;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
void main(){
  vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / u_fit.w;      /* CSS px, y down */
  vec2 sc = (px - u_fit.xy) / u_fit.z;                                       /* scene units */
  float band = u_band.y - u_band.x;
  if (sc.y < u_band.x || sc.y > u_band.y) { gl_FragColor = vec4(0.0); return; }
  float d = (sc.y - u_band.x) / band;                                        /* 0 top .. 1 bottom */
  float t = u_time * u_speed;
  float w = sin(sc.x * 0.045 + t * 1.6 + d * 6.0) * 0.5 + sin(sc.x * 0.11 - t * 2.3) * 0.25 + noise(vec2(sc.x * 0.02 + t * 0.3, d * 4.0)) * 0.5;
  vec3 col = mix(u_light, u_deep, clamp(d * 1.1 + w * 0.12, 0.0, 1.0));
  float sparkle = step(0.93, noise(vec2(sc.x * 0.15 + t, sc.y * 0.3 - t * 0.5))) * (1.0 - d);
  float foam = smoothstep(0.08, 0.0, d + sin(sc.x * 0.08 + t * 2.0) * 0.02) * 0.6;
  col = mix(col, u_foam, clamp(sparkle * 0.7 + foam, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`;

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

export class Water {
  static create(canvas: HTMLCanvasElement, sceneEl: SVGSVGElement, cfg: { top: number; bottom: number; deep: string; light: string; foam: string }): Water | null {
    if (new URLSearchParams(location.search).has('nowebgl')) return null;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) return null;
    try { return new Water(canvas, sceneEl, gl, cfg); } catch { return null; }
  }
  static: boolean = false;
  private prog: WebGLProgram;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private lost = false;
  private onLost = (e: Event) => { e.preventDefault(); this.lost = true; this.canvas.style.display = 'none'; this.sceneEl.classList.remove('has-water'); };
  private constructor(private canvas: HTMLCanvasElement, private sceneEl: SVGSVGElement, private gl: WebGLRenderingContext, private cfg: Water['cfgT']) {
    const mk = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader'); return s; };
    const prog = gl.createProgram()!; gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    this.prog = prog; gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['u_res', 'u_time', 'u_fit', 'u_band', 'u_deep', 'u_light', 'u_foam', 'u_speed']) this.u[n] = gl.getUniformLocation(prog, n);
    gl.uniform3fv(this.u.u_deep, hex(cfg.deep)); gl.uniform3fv(this.u.u_light, hex(cfg.light)); gl.uniform3fv(this.u.u_foam, hex(cfg.foam));
    gl.uniform2f(this.u.u_band, cfg.top, cfg.bottom);
    canvas.addEventListener('webglcontextlost', this.onLost);
    sceneEl.classList.add('has-water');
    canvas.style.display = '';
    this.resize();
  }
  private declare cfgT: { top: number; bottom: number; deep: string; light: string; foam: string };
  resize() {
    const r = this.canvas.parentElement!.getBoundingClientRect();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(r.width * dpr); this.canvas.height = Math.round(r.height * dpr);
    this.canvas.style.width = `${r.width}px`; this.canvas.style.height = `${r.height}px`;
    const s = Math.max(r.width / SCENE_W, r.height / SCENE_H);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(this.u.u_res, this.canvas.width, this.canvas.height);
    this.gl.uniform4f(this.u.u_fit, (r.width - SCENE_W * s) / 2, (r.height - SCENE_H * s) / 2, s, dpr);
  }
  /** elapsed in ms of game time (frozen while paused). */
  render(elapsed: number) {
    if (this.lost) return;
    this.gl.uniform1f(this.u.u_time, this.static ? 0 : elapsed / 1000);
    this.gl.uniform1f(this.u.u_speed, 1.0);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }
  get alive() { return !this.lost; }
  destroy() {
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.sceneEl.classList.remove('has-water');
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.lost = true;
    this.canvas.style.display = 'none';
  }
}
```
(The `cfgT` declare is only a type helper; the constructor parameter type is the same object literal type as `WATER[DestinationId]`. Drop `cfgT` if `tsc` objects and inline the type.)

`src/scene/runner.ts`: field `water: Water | null = null;` constructor end: `this.water = Water.create($('#water') as HTMLCanvasElement, this.el, WATER[dest.id]);` plus `window.addEventListener('resize', () => { this.rect = null; this.water?.resize(); }, { signal })`. In `update`: `this.water?.render(this.elapsedTotal)` where `elapsedTotal` accumulates `dt` even after `finish()` (add `private elapsedTotal = 0; this.elapsedTotal += dt;` at the top of `update`). `destroy()`: `this.water?.destroy(); this.water = null;`.

`src/game.ts`: after creating the runner, `if (this.runner.water) this.runner.water.static = this.reducedMotion();`; `debug.waterAlive: this.runner?.water?.alive ?? false`.

`src/styles.css` (append):
```css
#water { position: absolute; inset: 0; z-index: 0; pointer-events: none; display: none; }
.scene.has-water .water-rect { display: none; }
#scene-root { background: transparent; }
```

- [ ] **Step 2: Check**: `scripts/e2e.mjs`, after entering Brazil:
```javascript
check(await page.evaluate(() => window.passportQuest.debug.waterAlive), 'WebGL water active');
```
in the restart loop: `check(!(await page.evaluate(() => window.passportQuest.debug.waterAlive)), \`iteration ${i}: water torn down\`)` (after restart `runner` is null → false). Add a fallback pass at the end of the script: navigate to `url + '&nowebgl=1'`, play into Brazil, assert `waterAlive === false`, `.water-rect` visible (`display !== 'none'`), and `errors.length === 0`. Visual review via `playshot` for both cities (ripples visible in frames).

- [ ] **Step 3: Verify**
```bash
cd /Users/guilherme.matos/Projects/tests/game
npx tsc --noEmit && node scripts/e2e.mjs http://localhost:5173/ 320 568 && node scripts/layoutcheck.mjs http://localhost:5173/ && node scripts/perfcheck.mjs http://localhost:5173/ 15
```
Expected: all green; perfcheck frame time increase ≤ 2 ms avg at 6x throttle (headless uses SwiftShader, so this is an upper bound; note it in the dev note).

- [ ] **Step 4: Commit**
```bash
git add src/scene/water.ts src/art/scenes.ts src/scene/runner.ts src/game.ts index.html src/styles.css scripts/e2e.mjs
git commit -m "WebGL water shader for sea and river with SVG fallback"
```

---

### Task 5: `npm run check`, bundle budget, CHROME_PATH, GitHub workflow

**Repo:** `.`

**Files:**
- Create: `scripts/check.mjs`
- Create: `.github/workflows/check.yml`
- Modify: `scripts/e2e.mjs`, `scripts/layoutcheck.mjs`, `scripts/playshot.mjs`, `scripts/artcheck.mjs`, `scripts/perfcheck.mjs` (Chrome path from env)
- Modify: `package.json` (`check` script), `README.md` (Scripts table + CI note)

- [ ] **Step 1: Implement**

Every script: replace the hardcoded path with
```javascript
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
```

`scripts/check.mjs`:
```javascript
// Runs every gate: typecheck, build, bundle budget, static server, e2e at two sizes, layout checks, perf print.
import { spawn, spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const BUDGET = 300_000; const PORT = 4173; const url = `http://localhost:${PORT}/`;
const run = (cmd, args, env = {}) => { console.log(`\n$ ${cmd} ${args.join(' ')}`); const r = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } }); if (r.status !== 0) { console.error(`FAILED: ${cmd} ${args.join(' ')}`); process.exit(r.status ?? 1); } };
run('npx', ['tsc', '--noEmit']);
run('npx', ['vite', 'build']);
const size = (d) => readdirSync(d).reduce((n, f) => { const p = join(d, f); return n + (statSync(p).isDirectory() ? size(p) : statSync(p).size); }, 0);
const total = size('dist');
console.log(`\nBundle: ${total} bytes (budget ${BUDGET})`);
if (total > BUDGET) { console.error('FAILED: bundle over budget'); process.exit(1); }
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const up = async () => { for (let i = 0; i < 50; i++) { try { if ((await fetch(url)).ok) return; } catch {} await new Promise((r) => setTimeout(r, 200)); } throw new Error('preview server did not start'); };
try {
  await up();
  run('node', ['scripts/e2e.mjs', url, '320', '568']);
  run('node', ['scripts/e2e.mjs', url, '390', '844']);
  run('node', ['scripts/layoutcheck.mjs', url]);
  spawnSync('node', ['scripts/perfcheck.mjs', url, '8'], { stdio: 'inherit' }); // informational, never fails the run
  console.log('\nALL GATES GREEN');
} finally { server.kill(); }
```
`package.json`: `"check": "node scripts/check.mjs"`.

`.github/workflows/check.yml`:
```yaml
name: check
on: { push: { branches: ['**'] }, pull_request: {} }
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - uses: browser-actions/setup-chrome@v1
        id: chrome
      - run: npm ci
      - run: npm run check
        env: { CHROME_PATH: ${{ steps.chrome.outputs.chrome-path }} }
```

`README.md`: add `npm run check` to the Scripts table and one paragraph under "Testing results": the same gates run in GitHub Actions on every push once a remote exists; `CHROME_PATH` selects the browser.

- [ ] **Step 2: Check**: the check is the script itself; `npm run check` must be green locally. `No-test:` not needed.

- [ ] **Step 3: Verify**
```bash
cd /Users/guilherme.matos/Projects/tests/game
npm run check
```
Expected: `ALL GATES GREEN`, bundle under 300,000 bytes.

- [ ] **Step 4: Commit**
```bash
git add scripts/check.mjs .github/workflows/check.yml scripts/*.mjs package.json README.md
git commit -m "Add npm run check (gates + bundle budget) and GitHub workflow; CHROME_PATH override"
```

---

### Task 6: Development note: measurements and problems-and-solutions

**Repo:** `.`

**Files:**
- Modify: `docs/DEVELOPMENT_NOTE.md` (new sections; the developer's AI section untouched)
- Modify: `docs/WALKTHROUGH.md` (section 6 mentions the shader, pooling and the numbers)
- Modify: `README.md` (Known limitations: SwiftShader caveat; Project structure: new files)

- [ ] **Step 1: Implement**

`docs/DEVELOPMENT_NOTE.md` additions:
```markdown
## Performance measurements

Headless Chrome 156, 320×568 @2x, Rio Party (busiest scene), CPU throttled 6x via CDP, 15 s autopilot. Headless renders WebGL with SwiftShader (software), so the water numbers are an upper bound.

| Build | fps avg | fps min | frame avg ms | frame worst ms | SVG nodes | heap MB |
|---|---|---|---|---|---|---|
| Stage 1 baseline (Task 1) | <from JSON> | … | … | … | … | … |
| After pooling + cached rects (Task 2) | … | … | … | … | … | … |
| After canvas particles (Task 3) | … | … | … | … | … | … |
| After WebGL water (Task 4) | … | … | … | … | … | … |

## Technical problems and solutions

1. **CSS animations silently cancelled SVG `transform` attributes.** Palm crowns and clouds jumped between their placed position and the origin. Cause: a CSS `transform` animation replaces the presentation attribute, and mismatched transform lists interpolate through matrices. Diagnosed by comparing two screenshots of the same layer; fixed by wrapping every animated element in a plain positioning `<g>`.
2. **Pausing without time jumps.** `setTimeout` timers kept running while hidden and all fired on return. Replaced with a frame-driven clock (timers and tweens keyed to game time) and a loop with named pause reasons and a clamped delta.
3. **One coordinate system for every phone.** A 360×720 viewBox with `slice` fit and a computed safe band keeps hit areas, HUD and items identical on 320×568 and 390×844; the WebGL shader reuses the same fit uniforms.
4. **Music without assets.** A lookahead scheduler over the AudioContext clock plays three loops from oscillators and filtered noise; it is unlocked on a gesture, muted from the HUD and suspended while hidden.
5. **Effects without DOM churn.** Sparkles and confetti were DOM nodes created and removed per burst; a fixed 400-particle pool on a canvas removed that allocation and the layout cost, measured above.
```
Fill the table from the JSON lines produced in Tasks 1–4 (copy them into the note as they are produced).

- [ ] **Step 2: Check**: `No-test: documentation only`; verify the AI section is byte-identical: `git diff --stat docs/DEVELOPMENT_NOTE.md` and read the diff.

- [ ] **Step 3: Verify**
```bash
cd /Users/guilherme.matos/Projects/tests/game
git diff docs/DEVELOPMENT_NOTE.md | grep -c "AI correction"   # expected 0 (section unchanged)
npm run check
```

- [ ] **Step 4: Commit**
```bash
git add docs/DEVELOPMENT_NOTE.md docs/WALKTHROUGH.md README.md
git commit -m "Document Stage 2 performance measurements and technical problems solved

No-test: documentation only"
```

---

## Self-review

- Coverage: scenarios 1–3 → Tasks 3–4; 4–5 → Tasks 2–4 (e2e restart loop); 6 → Task 3; 7 → Task 1; 8 → Task 5. Dev-note numbers → Task 6.
- Placeholders: the dev-note table cells are filled from the JSON produced by Tasks 1–4, each committed in its task; none remain at the end.
- Types: `Water.create` returns `Water | null`; `debug.waterAlive`, `debug.particles`, `debug.pool`, `debug.perf` all added where read.
- Checks: every task ships an e2e assertion or the script itself; Task 6 carries `No-test:`.
- Rules: no runtime dependency added (particles and WebGL are hand-written), no network, demo labelling untouched, `reset()` tears down particles, shake, wipe, flash and the WebGL context, `stage1-v1` not moved, the AI section not edited.
