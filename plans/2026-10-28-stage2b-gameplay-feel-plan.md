# Stage 2b gameplay feel, visual depth and usability: Implementation Plan

**Goal:** Give the run real tension and feedback (combo multiplier, tap-to-dash, spawn patterns, golden signature item, hit-stop), more visual depth (bigger Capi with lane lean, ground shading, entity shadows, legible toasts) and the usability fixes found in the 2026-10-28 review (ghost-hand onboarding, city buttons that actually hide, keyboard control, persisted mute and best score), without touching any Stage 1 constraint.

**Ticket:** none, direct request (interview-criteria review of visual, usability and gameplay gaps, 2026-10-28; the owner approved the improvement list and asked for this plan).

**Repos & branch:** `.` on `stage2/polish-perf` (same branch as `plans/2026-10-28-stage2-polish-perf-plan.md`, which must be fully implemented and committed first; its Task 1 is in progress on disk at planning time). Tag `stage1-v1` untouched.

**PRs & release:** no remote, no PR. Gates: `npm run check` green (added by the polish plan's Task 5), plus the two e2e sizes. Release: `npm run package` then tag `stage2-v1` only on request. Never move `stage1-v1`.

**Governing rules:** `.claude/change-loop.md` ("Never" list, checks per repo, escalation list: `level` tuning needs a playtest note, no real-reward copy, keep the Scrambly loop and the fox guide); README "Project structure" and "Credits"; `docs/DEVELOPMENT_NOTE.md` AI section is the developer's (not edited); brief section 6 (lifecycle, restart, no external requests).

**Blast radius:**
- Depends on the polish plan's shapes: `Runner.addEntity` with pooling and `release()`, `Runner.squash()`, `Runner.feetScreenPoint()`, `Game.reducedMotion()`, `Game.shake()`, `Game.flash()`, `Fx.update/trail/dust`, `scripts/e2e.mjs` pool and particle assertions, `scripts/check.mjs`. If any of those landed under a different name, adapt the call, not the design.
- `src/data/destinations.ts` is the content contract. This plan adds one exported constant (`FEEL`) and leaves every `level`, `weight` and `coupon.need` value unchanged, so no playtest escalation is needed. `Entity` gains `golden`; `RunnerHandlers` gains `onDodge` and `onDash` (both required, so `game.ts` must pass them in the same commit).
- `scripts/e2e.mjs` is the executable spec. Each task extends it in the same commit. The existing `finalPts >= 34 * 10 + 200` and `progress === 16` checks stay valid (points only go up; progress is unchanged by the multiplier).
- `scripts/playshot.mjs` screenshots are the visual check for Task 3.
- `counts` semantics change: a golden signature item adds 2 to its count (coupon progress and journal `×n`); the passport `progress` still rises by 1 per catch.
- Browser storage: a new `src/lib/storage.ts` wraps `localStorage` with try/catch (sandboxed playable iframes and private mode can throw). No network, no new runtime dependency. `reset()` does not clear it on purpose: mute and best score are player preferences, not game state.
- Known bug fixed here: `.dest-list { display: flex }` overrides the `hidden` attribute, so the city buttons stay visible after a city is picked (confirmed in the 390×844 screenshot).

**Architecture:** Keep the layering: data (`FEEL` tuning) → runner (patterns, dash, keyboard, lean, shadows) → game (combo, hit-stop, dodge points, golden rules) → HUD/screens/CSS (badge, toast pill, best score) → docs. The runner stays timer-free: dash and cooldown are millisecond counters decremented in `update(dt)`, so they pause with the game and die with `destroy()`. Hit-stop is a counter in `Game.frame` that skips clock and runner updates for a few frames; nothing else is touched. Storage access is isolated in one module with silent failure.

**Runtime scenarios:**
1. Catching 5 items in a row shows a "x2" badge on the wallet and the toast "Combo x2!"; each further item is worth 20 demo pts; at 10 items "x3", at 15 "x4" (cap). Hitting an obstacle shakes the badge away and the next item is worth 10 again.
2. A quick tap (or Space / ArrowRight) makes Capi dash for 350 ms with a lean and a cream afterimage; an obstacle touched during the dash spins away, "Dodged!" floats, +5 demo pts, combo is kept. A second tap within 1.1 s does nothing. During `redeem` / `journal` the tap does nothing.
3. Items arrive in patterns: single, row of 3, arc of 4, zigzag of 4; every y is clamped to the play band; the autopilot still completes both cities.
4. About one in eight signature items is golden (glow, faster bob): catching it freezes the frame for 90 ms, bursts gold, floats "+30" (×3, times the multiplier) and counts as 2 toward the coupon.
5. Capi is drawn at scale 0.72 (was 0.6), leans up to 14° toward the direction of travel, every entity has a ground shadow that does not bob, the play band has a bottom shade and a horizon haze in all four backdrops; toasts sit on a dark pill and stay readable over the Porto facades.
6. Level start: the hint arrow shows for 1.6 s next to Capi, then hides; the 4 s idle hint still works. The fox's first line reads "Move up and down. Tap to dash!".
7. Map hub: after picking a city, the two city buttons disappear and the theme card sits directly under the map.
8. Mute survives a restart and a reload; the final screen shows "New best!" when the trip beats the stored best, otherwise "Best: N demo pts"; the start screen shows "Your best: N demo pts" once a best exists. All labelled demo. With storage unavailable the game runs exactly as before.
9. ArrowUp / ArrowDown move Capi continuously while held; the keys are released on window blur. With `prefers-reduced-motion: reduce` the dash afterimage and lean are off; the mechanics stay.
10. Restart from every state (existing 12-iteration loop) leaves combo 0, no dash class, no hit-stop and no keyboard state.

---

### Task 1: Spawn patterns, golden signature item, dash and keyboard control (runner)

**Repo:** `.`

**Files:**
- Modify: `src/data/destinations.ts` (append after `COUPON_BONUS`)
- Modify: `src/scene/runner.ts` (`Entity`, `RunnerHandlers`, fields, constructor listeners, `update`, `spawn`, `addEntity`, `release`, `destroy`, debug accessors)
- Modify: `src/game.ts` (handlers only: pass `onDodge` and `onDash` stubs so the project compiles; Task 2 fills them)
- Modify: `src/styles.css` (append)
- Modify: `scripts/e2e.mjs`

- [x] **Step 1: Implement**

`src/data/destinations.ts` (append after `export const COUPON_BONUS = 50;`):
```typescript
/**
 * Gameplay-feel tuning (Stage 2b). Kept apart from `level` so difficulty
 * values stay untouched; every number here is recorded in the dev note.
 */
export const FEEL = {
  /** Chance that a spawned signature item is golden (×3 points, counts 2 toward the coupon). */
  goldChance: 0.12,
  /** Dash: obstacle immunity window and the cooldown that follows it (ms). */
  dashMs: 350,
  dashCooldownMs: 1100,
  /** Points per item are multiplied by 1 + floor(combo / comboStep), capped at comboMax. */
  comboStep: 5,
  comboMax: 4,
  /** Frame freeze on a hit and on a golden/coupon catch (ms). */
  hitStopHitMs: 45,
  hitStopRewardMs: 90,
  /** Demo points for dashing through an obstacle. */
  dodgePoints: 5,
  /** Keyboard vertical speed (scene units per second). */
  keySpeed: 420,
} as const;
```

`src/scene/runner.ts`:

Imports: add `FEEL` to the import from `../data/destinations` (it is a value import, so change `import type {...}` into `import { FEEL, type DestinationDef, type ItemId, type ObstacleId, type ThemeDef } from '../data/destinations';`).

`Entity` and handlers:
```typescript
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
```

Fields (next to `hintOn`):
```typescript
  private dashLeft = 0;
  private dashCooldown = 0;
  private dashes = 0;
  private dodges = 0;
  private keys = new Set<string>();
  private patternsSeen = new Set<SpawnPattern>();
```

Constructor, replace the pointer block (keep `follow`):
```typescript
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
```

Dash API (after `placeFox`):
```typescript
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
```

`update(dt)`: after the parallax block and before the follow block add the keyboard and dash counters:
```typescript
    // Keyboard hold
    if (!this.finished) {
      if (this.keys.has('ArrowUp')) this.targetY = this.clampY(this.targetY - FEEL.keySpeed * sec);
      if (this.keys.has('ArrowDown')) this.targetY = this.clampY(this.targetY + FEEL.keySpeed * sec);
    }
    // Dash window and cooldown
    if (this.dashLeft > 0) { this.dashLeft -= dt; if (this.dashLeft <= 0) this.foxG.classList.remove('dashing'); }
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
```
Collision branch, replace the obstacle `else if`:
```typescript
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
```

`spawn()` (replace the item branch, keep the obstacle branch):
```typescript
    const def = this.pickWeighted(items);
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
```
Note: the former `chain` (25 % chance of 3) is replaced by `row`; the number of `random()` calls per spawn changes, so seeded runs differ from Stage 1 runs. The e2e script only relies on the autopilot finishing, not on a specific sequence.

`addEntity` / `release` (polish-plan versions, extended):
```typescript
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
    if (list.length < 12) list.push(e.el);
    this.pool.set(key, list);
  }
```
Obstacles call `addEntity(..., OBSTACLE_ART[def.id])` with the default `golden = false` (no change needed).

Debug accessors:
```typescript
  liveEntities() { return this.entities.filter((e) => !e.done).map((e) => ({ kind: e.kind, id: e.id, x: e.x, y: e.y, golden: e.golden })); }
  get feel() { return { dashes: this.dashes, dodges: this.dodges, dashing: this.dashLeft > 0, cooldown: this.dashCooldown > 0, patterns: [...this.patternsSeen] }; }
```
`destroy()`: add `this.keys.clear(); this.foxG.classList.remove('dashing');` before `this.el.remove()`.

`src/game.ts` (compile-only in this task): in `enterPlaying` pass
```typescript
      onDodge: (e, screen) => this.dodge(e, screen),
      onDash: () => this.onDash(),
```
and add minimal methods (Task 2 replaces their bodies):
```typescript
  private dodge(_e: Entity, _screen: { x: number; y: number }) { /* Task 2 */ }
  private onDash() { /* Task 2 */ }
```
`debug` gains `feel: this.runner?.feel ?? null`.

`src/styles.css` (append):
```css
/* ---------- Stage 2b: dash, dodge, golden ---------- */
.entity.dodged .entity-anim { animation: obstacle-dodged 0.5s ease-out forwards; }
@keyframes obstacle-dodged { 100% { transform: translate(40px, -60px) rotate(260deg) scale(0.6); opacity: 0; } }
.entity--golden .entity-art { filter: drop-shadow(0 0 5px #FFD966) drop-shadow(0 0 2px #FFF6E8); }
.entity--golden .entity-anim { animation-duration: 0.9s; }
.runner-root.dashing .capy { filter: drop-shadow(-12px 0 0 rgba(255,246,232,0.45)) drop-shadow(-24px 0 0 rgba(255,246,232,0.2)); }
.runner-root.dashing .runner-shadow { opacity: 0.06; }
#app.reduced-motion .runner-root.dashing .capy { filter: none; }
```

- [x] **Step 2: Check**: `scripts/e2e.mjs`. After the existing "fox follows real mouse move" check add:
```javascript
// Keyboard: ArrowUp held moves Capi up; Space dashes (once, then cooldown)
const k0 = (await dbg()).fox.y;
await page.keyboard.down('ArrowUp'); await sleep(500); await page.keyboard.up('ArrowUp');
check((await dbg()).fox.y < k0 - 40, `ArrowUp moves Capi up (y ${k0.toFixed(0)} -> ${(await dbg()).fox.y.toFixed(0)})`);
await page.keyboard.press('Space'); await page.keyboard.press('Space');
const feel0 = await page.evaluate(() => window.passportQuest.debug.feel);
check(feel0.dashes === 1 && feel0.dashing, 'Space dashes once; second press inside the cooldown is ignored');
check(await page.$eval('.runner-root', (e) => e.classList.contains('dashing')), 'dashing class while dashing');
await sleep(FEEL_DASH_SETTLE);
check(!(await page.evaluate(() => window.passportQuest.debug.feel.dashing)), 'dash ends after its window');
```
with `const FEEL_DASH_SETTLE = 500;` near the other constants at the top. Extend the autopilot so it can dash when an obstacle is close (new optional third argument):
```javascript
  window.__autopilot = (ms, target = 'item', dashThrough = false) => new Promise((res) => {
    ...
      if (dashThrough) {
        const near = ahead.find((e) => e.kind === 'obstacle' && e.x - d.fox.x < 90 && Math.abs(e.y - d.fox.y) < 40);
        if (near && !d.feel.dashing && !d.feel.cooldown) window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      }
```
and `const autopilot = (ms, target, dash) => page.evaluate((ms, t, dsh) => window.__autopilot(ms, t, dsh), ms, target, dash);`. In the obstacle-hunting block, after the existing `progress >= 0` check add a dash-through pass:
```javascript
await autopilot(5000, 'obstacle', true);
const feel1 = await page.evaluate(() => window.passportQuest.debug.feel);
check(feel1.dodges > 0, `dash passes through obstacles (${feel1.dodges} dodged)`);
```
After "Brazil completed via autopilot" add:
```javascript
const feel2 = await page.evaluate(() => window.passportQuest.debug.feel);
check(feel2.patterns.length >= 3, `spawn patterns seen: ${feel2.patterns.join(', ')}`);
```
In the restart loop add `check((await page.evaluate(() => window.passportQuest.debug.feel)) === null, \`iteration ${i}: runner gone (no dash/keyboard state)\`);`.

- [x] **Step 3: Verify**
```bash
cd /Users/guilherme.matos/Projects/tests/game && source ~/.nvm/nvm.sh && nvm use
npx tsc --noEmit && node scripts/e2e.mjs http://localhost:5173/ 320 568 && node scripts/e2e.mjs http://localhost:5173/ 390 844
```
Expected: `ALL CHECKS PASSED` at both sizes, including the new keyboard, dash, dodge and pattern lines. Manually: open `http://localhost:5173/?seed=7`, play Rio, tap quickly on the stage: Capi gets a cream afterimage and passes through a crab; a golden coconut glows.

- [x] **Step 4: Commit**
```bash
git -C /Users/guilherme.matos/Projects/tests/game add src/data/destinations.ts src/scene/runner.ts src/game.ts src/styles.css scripts/e2e.mjs
git -C /Users/guilherme.matos/Projects/tests/game commit -m "Add spawn patterns, golden signature items, tap-to-dash and keyboard control

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Combo multiplier, hit-stop, dodge and golden rewards (game + HUD)

**Repo:** `.`

**Files:**
- Modify: `src/game.ts` (fields, `teardown`, `frame`, `enterPlaying`, `collect`, `hit`, `dodge`, `onDash`, `debug`)
- Modify: `src/ui/hud.ts` (wallet markup, `setCombo`)
- Modify: `src/styles.css` (append)
- Modify: `scripts/e2e.mjs`

- [x] **Step 1: Implement**

`src/game.ts` imports: add `FEEL` to the `./data/destinations` import.

Fields:
```typescript
  private combo = 0;
  private hitStop = 0;
  private dodges = 0;
  private get multiplier() { return Math.min(FEEL.comboMax, 1 + Math.floor(this.combo / FEEL.comboStep)); }
```
`teardown()`: add `this.combo = 0; this.hitStop = 0; this.dodges = 0;`.

`frame(dt)`: right after `this.perf?.tick();` add
```typescript
    if (this.hitStop > 0) { this.hitStop -= dt; this.perf?.end(); return; }
```
(if the polish plan's overlay has no `end()`, drop that call). The clock, runner, particles and water all freeze for the hit-stop; CSS animations keep running, which reads as a deliberate "impact frame".

`enterPlaying`: after `this.speedToastShown = false;` add `this.combo = 0; this.hud.setCombo(1);` (call it after `mountHud()`; move the line below `this.hud.setPoints(this.points);`). First fox line: replace `'Move up and down to guide Capi!'` with `'Move up and down. Tap to dash!'`.

`collect` (full replacement):
```typescript
  private collect(e: Entity, screen: { x: number; y: number }) {
    if (this.state !== 'playing') return;
    const id = e.id as ItemId;
    const dest = this.destination;
    const theme = this.theme;
    const first = !this.counts[id];
    const step = e.golden ? 2 : 1;
    const prevCount = this.counts[id] ?? 0;
    const count = (this.counts[id] = prevCount + step);
    this.progress = Math.min(dest.level.goal, this.progress + 1);
    this.armHint();

    const multBefore = this.multiplier;
    this.combo++;
    const mult = this.multiplier;
    const gained = POINTS_PER_ITEM * mult * (e.golden ? 3 : 1);

    const isCouponItem = id === theme.coupon.itemId;
    const couponJustUnlocked = isCouponItem && prevCount < theme.coupon.need && count >= theme.coupon.need;

    this.runner!.squash();
    this.fx.burst(screen.x, screen.y, e.golden ? '#FFD966' : dest.accent, e.golden ? 16 : 8);
    this.fx.floatText(screen.x, screen.y - 14, `+${gained}`, e.golden ? 'float-text--gold' : '');
    const to = first || isCouponItem ? this.hud.chipPoint(id) : this.hud.barPoint();
    this.fx.fly(screen, to, ITEM_ART[id](), dest.accent, () => {
      this.hud.setCount(id, count, isCouponItem ? theme.coupon.need : undefined, isCouponItem && count >= theme.coupon.need);
      this.hud.setProgress(this.progress, dest.level.goal, 'up');
      this.addPoints(gained);
    });
    if (mult > multBefore) { this.hud.setCombo(mult); this.hud.toast(`Combo x${mult}!`, 'toast--combo'); }
    if (e.golden || couponJustUnlocked) this.hitStop = FEEL.hitStopRewardMs;
    if (couponJustUnlocked) {
      this.coupons.push(`${dest.id}:${theme.id}`);
      this.addPoints(COUPON_BONUS);
      this.hud.toast('Coupon unlocked!', 'toast--coupon');
      this.fx.confetti(18);
      this.say(`${theme.coupon.title} — yours!`, 2000);
    } else if (e.golden) {
      this.say('Golden! Counts double.', 1400, 'cheer');
    } else if (first) {
      this.say(DISCOVER_LINES[id], 1600);
    }

    if (this.progress >= dest.level.goal) this.completeDestination();
  }
```
(`fx.fly` signature with the accent colour is the polish plan's; if it stayed `fly(from, to, markup, onDone)`, drop the colour argument.)

`hit`:
```typescript
  private hit(_e: Entity, screen: { x: number; y: number }) {
    if (this.state !== 'playing') return;
    const dest = this.destination;
    this.progress = Math.max(0, this.progress - dest.level.penalty);
    this.hud.setProgress(this.progress, dest.level.goal, 'down');
    const lostCombo = this.multiplier > 1;
    this.combo = 0;
    this.hud.setCombo(1, lostCombo);
    this.hitStop = FEEL.hitStopHitMs;
    this.shake();
    this.flash();
    this.fx.floatText(screen.x, screen.y - 14, lostCombo ? 'Combo lost!' : 'Ouch!', 'float-text--bad');
    this.fx.burst(screen.x, screen.y, '#201338', 6);
    this.say('Ouch! Watch out, Capi.', 1000, 'think');
  }
```
`dodge` and `onDash` (replace the Task 1 stubs):
```typescript
  private dodge(_e: Entity, screen: { x: number; y: number }) {
    if (this.state !== 'playing') return;
    this.dodges++;
    this.fx.floatText(screen.x, screen.y - 14, 'Dodged!', 'float-text--dodge');
    this.fx.burst(screen.x, screen.y, '#FFF6E8', 6);
    this.addPoints(FEEL.dodgePoints);
    if (this.dodges === 1) this.say('Dash through obstacles!', 1400, 'cheer');
  }

  private onDash() {
    if (this.state !== 'playing' || this.reducedMotion()) return;
    const p = this.runner!.foxScreenPoint();
    this.fx.burst(p.x - 18, p.y + 16, '#FFF6E8', 5);
  }
```
`debug` gains `combo: this.combo, multiplier: this.multiplier, hitStop: this.hitStop, dodges: this.dodges`.

`src/ui/hud.ts`: in `mount()` wallet markup, after `<span class="wallet-label">demo pts</span>` add `<span class="wallet-combo" aria-live="polite"></span>`. Add:
```typescript
  /** Combo badge on the wallet: hidden at x1, pops when it grows, shakes away when lost. */
  setCombo(mult: number, lost = false) {
    const el = $('.wallet-combo', this.root);
    el.textContent = `x${mult}`;
    el.classList.remove('pop', 'lost');
    void el.offsetWidth;
    el.classList.toggle('show', mult > 1);
    el.classList.add(lost ? 'lost' : 'pop');
  }
```

`src/styles.css` (append):
```css
/* ---------- Stage 2b: combo badge, reward texts ---------- */
.wallet { position: relative; }
.wallet-combo {
  position: absolute; left: -8px; top: -9px;
  background: #FFD966; color: var(--ink);
  font-size: 11px; font-weight: 700; line-height: 1;
  padding: 3px 7px; border-radius: 999px;
  box-shadow: 0 2px 0 #c9a33d;
  transform: scale(0); transition: transform 0.2s cubic-bezier(.34,1.56,.64,1);
  pointer-events: none;
}
.wallet-combo.show { transform: scale(1); }
.wallet-combo.pop { animation: combo-pop 0.35s cubic-bezier(.34,1.56,.64,1); }
.wallet-combo.lost { animation: combo-lost 0.45s ease-in forwards; }
@keyframes combo-pop { 40% { transform: scale(1.35) rotate(-8deg); } 100% { transform: scale(1); } }
@keyframes combo-lost { 20% { transform: translateX(-4px) scale(1.1); } 40% { transform: translateX(4px); } 100% { transform: scale(0); } }
.hud-toast.toast--combo { color: #FFD966; }
.float-text--gold { color: #FFD966; text-shadow: 0 2px 0 #9a6a00, 0 4px 10px rgba(0,0,0,0.4); }
.float-text--dodge { color: var(--cream); font-size: 18px; text-shadow: 0 2px 0 #1FA463, 0 4px 10px rgba(0,0,0,0.4); }
```

- [x] **Step 2: Check**: `scripts/e2e.mjs`. After the dash-through block from Task 1:
```javascript
const c0 = await page.evaluate(() => { const d = window.passportQuest.debug; return { combo: d.combo, mult: d.multiplier }; });
check(c0.combo === 0 && c0.mult === 1, 'combo is 0 after a hit');
```
Replace the plain "Play Brazil to completion" call with a combo probe: run `autopilot(9000, 'item')` first, then
```javascript
const c1 = await page.evaluate(() => { const d = window.passportQuest.debug; return { combo: d.combo, mult: d.multiplier, points: d.points }; });
check(c1.combo > 0, `combo grows while catching (${c1.combo})`);
if (c1.mult > 1) check(await page.$eval('.wallet-combo', (e) => e.classList.contains('show') && e.textContent === `x${c1.mult}`), `combo badge shows x${c1.mult}`);
```
then continue with `autopilot(90000, 'item')` as before. After the Brazil `redeem` checks add:
```javascript
check(r1.points >= 16 * 10 + 100, `points include multiplier gains and bonus (${r1.points})`);
```
In the restart loop add `check((await page.evaluate(() => window.passportQuest.debug.combo)) === 0, \`iteration ${i}: combo reset\`);`.

- [x] **Step 3: Verify**
```bash
cd /Users/guilherme.matos/Projects/tests/game && source ~/.nvm/nvm.sh && nvm use
npx tsc --noEmit && node scripts/e2e.mjs http://localhost:5173/ 320 568 && node scripts/e2e.mjs http://localhost:5173/ 390 844
```
Expected: `ALL CHECKS PASSED` at both sizes. Manually: five catches in a row show the yellow "x2" badge and the "Combo x2!" toast; a hit floats "Combo lost!" and the badge shakes away; the screen holds for a beat on a hit and on a golden catch.

- [x] **Step 4: Commit**
```bash
git -C /Users/guilherme.matos/Projects/tests/game add src/game.ts src/ui/hud.ts src/styles.css scripts/e2e.mjs
git -C /Users/guilherme.matos/Projects/tests/game commit -m "Add combo multiplier, hit-stop, dodge and golden rewards

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Visual depth: bigger Capi with lane lean, ground shade, entity shadows, legible toasts

**Repo:** `.`

**Files:**
- Modify: `src/scene/runner.ts` (scene markup, `placeFox`, `update`, `feetScreenPoint`, `addEntity`)
- Modify: `src/art/scenes.ts` (four backdrop strings: `brazil.backdrop`, `brazil.variants.party.backdrop`, `portugal.backdrop`, `portugal.variants.party.backdrop`)
- Modify: `src/styles.css` (`.hud-toast`, append)
- Modify: `scripts/e2e.mjs`

- [x] **Step 1: Implement**

`src/scene/runner.ts`:

Scene markup, replace the runner group:
```typescript
        <g class="runner-root"><ellipse class="runner-shadow" cy="46" rx="44" ry="8" fill="#201338" opacity="0.18"/><g class="runner-lean"><g class="runner-inner">${capyGroup('run', theme.costume)}</g></g></g>
```
Fields: `private leanG: SVGGElement; private lean = 0;` and in the constructor after `foxInner`: `this.leanG = this.el.querySelector('.runner-lean')!;`.

Scale and lean:
```typescript
const FOX_SCALE = 0.72; // was 0.6: Capi is the hero and should outweigh the items
const LEAN_MAX = 14;    // degrees, toward the direction of vertical travel

  private placeFox() {
    this.foxG.setAttribute('transform', `translate(${FOX_X} ${this.foxY}) scale(${this.depthScale(this.foxY) * FOX_SCALE})`);
    this.leanG.setAttribute('transform', `rotate(${this.lean.toFixed(1)} 0 24)`);
    this.hintG.setAttribute('transform', `translate(${FOX_X + 70} ${this.foxY})`);
  }
```
In `update`, replace the follow block:
```typescript
    const k = 1 - Math.exp(-FOLLOW_RATE * sec);
    const prevY = this.foxY;
    this.foxY += (this.targetY - this.foxY) * k;
    const vy = sec > 0 ? (this.foxY - prevY) / sec : 0;
    const targetLean = this.reducedMotion ? 0 : Math.max(-LEAN_MAX, Math.min(LEAN_MAX, vy * 0.03));
    this.lean += (targetLean - this.lean) * (1 - Math.exp(-10 * sec));
    this.placeFox();
```
Add a public field `reducedMotion = false;` on the runner; `game.ts` sets `this.runner.reducedMotion = this.reducedMotion();` right after constructing the runner in `enterPlaying` and in the polish plan's `applyMotion` handler (`this.runner && (this.runner.reducedMotion = motion.matches)`).

`feetScreenPoint()` (polish plan) becomes `return this.toScreen(FOX_X - 4, this.foxY + 58 * this.depthScale(this.foxY) * FOX_SCALE);` so dust still appears under the feet.

Entity shadow: in `addEntity`, when creating a new node:
```typescript
      el.innerHTML = `<ellipse class="entity-shadow" cy="26" rx="17" ry="4" fill="#201338" opacity="0.16"/><g class="entity-anim"><g class="entity-art" transform="scale(${scale})">${markup}</g></g>`;
```
The shadow sits outside `.entity-anim`, so the bob does not move it; the outer depth scale still applies.

`src/art/scenes.ts`: in each of the four backdrop strings append, after the last ground rect (`rio-sand`, `rio-nsand`, `porto-quay`/`porto-river`, `porto-nquay`/`porto-nriver`), the shade and haze. Gradient ids must be unique per backdrop (`rio-shade`, `rio-nshade`, `porto-shade`, `porto-nshade`; same for `-haze`). Rio day example:
```typescript
        <linearGradient id="rio-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#201338" stop-opacity="0"/><stop offset="1" stop-color="#201338" stop-opacity="0.16"/></linearGradient>
        <linearGradient id="rio-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6E8" stop-opacity="0.35"/><stop offset="1" stop-color="#FFF6E8" stop-opacity="0"/></linearGradient>
```
inside `<defs>`, and after the sand rect:
```typescript
      <rect y="396" width="360" height="324" fill="url(#rio-shade)"/>
      <rect y="396" width="360" height="48" fill="url(#rio-haze)"/>
```
Porto: shade rect `y="380" height="236"` (the quay only; the river keeps its own gradient and the polish plan's WebGL water), haze rect `y="380" height="44"`. Night variants: same rects, haze opacity `0.18`.

`src/styles.css`: replace the `.hud-toast` rule with
```css
.hud-toast {
  position: absolute; left: 50%; top: 36%;
  transform: translate(-50%, -50%) scale(0.5);
  font-size: 30px; font-weight: 700; color: var(--cream);
  padding: 6px 18px; border-radius: 999px;
  background: rgba(32,19,56,0.82);
  box-shadow: 0 4px 0 rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.3);
  text-shadow: 0 2px 0 rgba(0,0,0,0.35);
  opacity: 0; pointer-events: none; white-space: nowrap;
}
```
(`toast--speed`, `toast--coupon`, `toast--done`, `toast--combo` colour rules stay.) Append:
```css
.entity-shadow { pointer-events: none; }
.runner-lean { will-change: transform; }
```

- [x] **Step 2: Check**: screenshots plus one e2e assertion.
`scripts/e2e.mjs`, right after the "HUD shows the 3 items" check:
```javascript
check(await page.$eval('.hud-toast', (e) => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)'), 'toast has a solid backing');
check(await page.$$eval('.entity-shadow', (els) => els.length >= 0), 'entity shadow markup present (count may be 0 before first spawn)');
```
Visual review: `node scripts/playshot.mjs <scratchpad>/shots 390 844 food culture` and `node scripts/playshot.mjs <scratchpad>/shots320 320 568 party party`; open `play-rio-food-a.png`, `play-porto-culture-b.png` and `play-porto-party-a.png` and confirm: Capi visibly larger than the items, lean visible when the autopilot moves, shadows under items, a soft horizon haze, darker band bottom, and a toast (if captured) on a dark pill.

- [x] **Step 3: Verify**
```bash
cd /Users/guilherme.matos/Projects/tests/game && source ~/.nvm/nvm.sh && nvm use
npx tsc --noEmit && node scripts/e2e.mjs http://localhost:5173/ 320 568 && node scripts/perfcheck.mjs http://localhost:5173/ 15
```
Expected: `ALL CHECKS PASSED`; perfcheck `frameWorstMs` and `nodesAvg` within 10 % of the polish plan's "After" row (one extra `<ellipse>` per pooled entity node; the golden `filter` is rare). If worse, drop the second `drop-shadow` on `.entity--golden` first.

- [x] **Step 4: Commit**
```bash
git -C /Users/guilherme.matos/Projects/tests/game add src/scene/runner.ts src/art/scenes.ts src/styles.css src/game.ts scripts/e2e.mjs
git -C /Users/guilherme.matos/Projects/tests/game commit -m "Enlarge Capi with lane lean, add ground shade, entity shadows and toast backing

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Usability: ghost-hand onboarding, hidden city buttons, persisted mute and best score

**Repo:** `.`

**Files:**
- Create: `src/lib/storage.ts`
- Modify: `src/game.ts` (constructor, `init`, `mountHud`, `enterStart`, `enterPlaying`, `enterFinal`, `debug`)
- Modify: `src/ui/screens.ts` (`renderStart`, `renderFinal` signatures and markup)
- Modify: `src/styles.css` (`.dest-list[hidden]`, append)
- Modify: `scripts/e2e.mjs`

- [x] **Step 1: Implement**

`src/lib/storage.ts`:
```typescript
/**
 * Player preferences that outlive a restart: mute and best score.
 * localStorage can be missing or throw (private mode, sandboxed playable
 * iframes, blocked site data), so every call is guarded and failures are silent.
 * Nothing leaves the device; no network is involved.
 */
const PREFIX = 'passport-quest:';

export const storage = {
  get(key: string): string | null {
    try { return localStorage.getItem(PREFIX + key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { localStorage.setItem(PREFIX + key, value); } catch { /* unavailable: ignore */ }
  },
};
```

`src/game.ts`:
- Import `storage` from `./lib/storage`.
- Field `private best = 0;`.
- Constructor, after `this.hud = …`: `this.music.setMuted(storage.get('muted') === '1');`.
- `init()`: `this.best = Number(storage.get('best') ?? 0) || 0;` before `this.enterStart()`.
- `mountHud()` mute callback: `() => { this.music.setMuted(!this.music.muted); storage.set('muted', this.music.muted ? '1' : '0'); return this.music.muted; }`.
- `enterStart()`: `renderStart(this.overlay, this.best, () => {...}, this.ac.signal);`.
- `enterPlaying()`: after `this.armHint();` add the ghost hand:
```typescript
    // Ghost hand: show the move hint immediately for a moment, then rely on the idle hint.
    this.runner.setHint(true);
    this.clock.after(1600, () => { if (this.state === 'playing') this.runner?.setHint(false); });
```
(`armHint()` already turns the hint off on the first catch.)
- `enterFinal()`: before `renderFinal`:
```typescript
    const newBest = this.points > this.best;
    if (newBest) { this.best = this.points; storage.set('best', String(this.best)); }
```
and pass `{ best: this.best, newBest }` as a new argument: `renderFinal(this.overlay, this.points, allCounts, this.chosen, this.coupons, { best: this.best, newBest }, {...handlers}, this.ac.signal)`.
- `debug` gains `best: this.best`.

`src/ui/screens.ts`:
- `renderStart(root, best: number, onPlay, signal)`: after the `.instruction` paragraph add `${best > 0 ? `<p class="best-line">Your best: <b>${best}</b> demo pts</p>` : ''}` and change the instruction to `Move <b>up and down</b> to catch items. <b>Tap</b> to dash through obstacles.`
- `renderFinal(root, points, counts, chosen, coupons, score: { best: number; newBest: boolean }, h, signal)`: inside `.final-wallet`, after the points row, add
```typescript
        <div class="final-wallet-row final-best ${score.newBest ? 'final-best--new' : ''}">${score.newBest ? 'New best!' : `Best: ${score.best} demo pts`}</div>
```

`src/styles.css`: next to `.dest-list` add `.dest-list[hidden] { display: none; }`. Append:
```css
.best-line { font-size: 13px; margin-top: 6px; opacity: 0.9; }
.best-line b { color: #FFD966; }
.final-best { font-size: 12px; opacity: 0.85; justify-content: center; }
.final-best--new { color: #FFD966; font-weight: 700; opacity: 1; animation: combo-pop 0.5s cubic-bezier(.34,1.56,.64,1); }
```

- [x] **Step 2: Check**: `scripts/e2e.mjs`.
After the "intro card shown after the plane lands" check:
```javascript
check(await page.$eval('.dest-list', (e) => e.offsetParent === null), 'city buttons hidden once a city is picked');
```
After "choosing a theme enters playing":
```javascript
check(await hintVisible(), 'ghost hand shown at level start');
await sleep(1700);
check(!(await hintVisible()) || (await dbg()).progress > 0, 'ghost hand hides after ~1.6s');
```
(then remove the later `await sleep(4300)` idle wait's dependency: keep it, the 4 s idle hint still re-arms.)
After the final screen checks (before the CTA block):
```javascript
check(await page.evaluate(() => localStorage.getItem('passport-quest:best')) === String(finalPts), 'best score persisted');
check(await page.$eval('.final-best', (e) => e.textContent.includes('New best')), 'first trip is a new best');
```
Before the restart loop (HUD is mounted on the start screen? No: use the first iteration of the loop instead). Inside the loop at `i === 0`, after `.btn--play`:
```javascript
  if (i === 0) {
    await page.tap('.btn--mute'); await sleep(50);
    check(await page.evaluate(() => localStorage.getItem('passport-quest:muted')) === '1', 'mute persisted');
    check(await page.$eval('.btn--mute', (e) => e.getAttribute('aria-pressed') === 'true'), 'mute button pressed');
    await page.tap('.btn--mute'); await sleep(50);
  }
```
After "points reset after restarts":
```javascript
check(await page.$eval('.btn--mute', (e) => e.getAttribute('aria-pressed') === 'false'), 'mute state restored from storage after restart');
```
Storage unavailable path: add near the top, before `page.goto`:
```javascript
if (process.env.NO_STORAGE) await page.evaluateOnNewDocument(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
```
and run the script once with `NO_STORAGE=1` (the best/mute persistence checks are skipped when `process.env.NO_STORAGE` is set: wrap those four checks in `if (!process.env.NO_STORAGE) { ... }`).

- [x] **Step 3: Verify**
```bash
cd /Users/guilherme.matos/Projects/tests/game && source ~/.nvm/nvm.sh && nvm use
npx tsc --noEmit && node scripts/e2e.mjs http://localhost:5173/ 320 568 && node scripts/e2e.mjs http://localhost:5173/ 390 844 && NO_STORAGE=1 node scripts/e2e.mjs http://localhost:5173/ 320 568
```
Expected: `ALL CHECKS PASSED` three times; the `NO_STORAGE` run logs no console errors. Manually: reload the page after muting: the HUD mute button is pressed on the next run; the start screen shows "Your best".

- [x] **Step 4: Commit**
```bash
git -C /Users/guilherme.matos/Projects/tests/game add src/lib/storage.ts src/game.ts src/ui/screens.ts src/styles.css scripts/e2e.mjs
git -C /Users/guilherme.matos/Projects/tests/game commit -m "Add ghost-hand onboarding, hide picked city buttons, persist mute and best score

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Docs: dev note, walkthrough, README

**Repo:** `.`

**Files:**
- Modify: `docs/DEVELOPMENT_NOTE.md` (new section `## Gameplay feel (Stage 2b)` before "## Known limitations and unfinished work"; the developer's AI section untouched)
- Modify: `docs/WALKTHROUGH.md` (section 1 and 2 bullets)
- Modify: `README.md` ("Project structure", "Known limitations", "Scripts" env var)

- [x] **Step 1: Implement**

`docs/DEVELOPMENT_NOTE.md`, new section:
```markdown
## Gameplay feel (Stage 2b)

Tuning lives in `FEEL` (`src/data/destinations.ts`); `level` values are unchanged from Stage 1.

| Mechanic | Value | Why |
|---|---|---|
| Combo multiplier | +1 every 5 catches, cap x4; reset on hit | Gives obstacles a cost beyond one progress point without a fail state |
| Dash | 350 ms immunity, 1.1 s cooldown; tap, Space or ArrowRight | A second decision for the player; near misses become dodges (+5) |
| Spawn patterns | single 50 %, row 20 %, arc 15 %, zigzag 15 % | Readable routes instead of single random heights |
| Golden signature item | 12 % of signature spawns; x3 points, counts 2 for the coupon | Makes the coupon a visible target, not a side effect of the weight |
| Hit-stop | 45 ms on hit, 90 ms on golden/coupon | Cheapest "weight" an impact can have |
| Capi scale | 0.72 (was 0.6), lean up to 14° | The hero should outweigh the collectibles |

Playtest note: tuned with the e2e autopilot and three manual runs per city at 390×844 on a desktop Chrome touch emulation; both cities still complete in 40–60 s. The coupon still unlocks on most runs; the golden item mostly changes how it feels. Real-device playtests are still pending (see Known limitations).

Storage: mute and best score use `localStorage` through `src/lib/storage.ts`; every access is wrapped, so a sandboxed iframe or private window plays exactly like Stage 1. No data leaves the device.

Keyboard: ArrowUp/ArrowDown move, Space/ArrowRight dash. This closes the Stage 1 accessibility gap for the runner itself.
```

`docs/WALKTHROUGH.md`: in section 1 "Run" bullet add "Tap to dash through a crab: 'Dodged!', +5. Catch five in a row: the x2 badge and 'Combo x2!'. A golden coconut glows: freeze-frame and +30." In section 2 add "Final screen: 'New best!' line (stored locally, demo)."

`README.md`:
- "Project structure": add `src/lib/storage.ts     guarded localStorage for mute and best score (no network)` and mention `FEEL` next to `destinations.ts`.
- "Known limitations": replace the accessibility bullet with "Keyboard: arrows move, Space dashes; screen readers get HUD live regions only." and add "Best score and mute are stored in localStorage when available; inside a sandboxed iframe they simply reset."
- "Scripts" table: note `NO_STORAGE=1` for the e2e storage-blocked run.

- [x] **Step 2: Check**: `No-test: documentation only`; run the full suite once more to confirm the docs match the shipped behaviour.

- [x] **Step 3: Verify**
```bash
cd /Users/guilherme.matos/Projects/tests/game && source ~/.nvm/nvm.sh && nvm use
npm run check
grep -n "AI correction / rejected output" -A 2 docs/DEVELOPMENT_NOTE.md
```
Expected: `npm run check` green; the AI section still reads `_To be filled in by the developer._` (or whatever the developer wrote), untouched by this plan.

- [x] **Step 4: Commit**
```bash
git -C /Users/guilherme.matos/Projects/tests/game add docs/DEVELOPMENT_NOTE.md docs/WALKTHROUGH.md README.md
git -C /Users/guilherme.matos/Projects/tests/game commit -m "Document Stage 2b gameplay feel, storage and keyboard control

No-test: documentation only

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-review

- Coverage: scenarios 1–2 → Tasks 1–2; 3–4 → Task 1 (+ rewards in Task 2); 5 → Task 3; 6–8 → Task 4; 9 → Tasks 1 and 3; 10 → restart-loop checks in Tasks 1, 2 and 4.
- Placeholders: none; the Task 1 game stubs are explicit compile shims replaced in Task 2.
- Type consistency: `Entity.golden` (Task 1) read in Task 2; `RunnerHandlers.onDodge/onDash` provided by `game.ts` in Task 1; `renderStart`/`renderFinal` signature changes land with their callers in Task 4; `FEEL` keys used: `goldChance`, `dashMs`, `dashCooldownMs`, `comboStep`, `comboMax`, `hitStopHitMs`, `hitStopRewardMs`, `dodgePoints`, `keySpeed`.
- Checks: every code task extends `scripts/e2e.mjs`; Task 3 adds screenshots; Task 5 carries `No-test`.
- Order: data → runner → game/HUD → visuals → usability → docs; no task depends on a later one.
- Rules: no network, no runtime dependency, no emoji art, no real venue, demo labels on the best-score lines, `level` untouched (no tuning escalation), developer's AI section untouched, no tag moved.
