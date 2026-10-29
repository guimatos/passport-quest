# 3D runner (Stage 3): Implementation Plan

**Goal:** Give Passport Quest a 3D version of the run: Capi runs into the screen along Copacabana and the Douro quay in a low-poly WebGL world, with the same loop (discover → play & progress → redeem), the same HUD, screens, data, effects and gameplay feel, while the SVG runner remains as the no-WebGL fallback.

**Ticket:** none, direct request ("now i need to create a 3d version of this game", 2026-10-29).

**Repos & branch:** `.` on `stage3/3d-runner`, from `stage2/polish-perf` (Stage 2 and 2b complete and committed there; no tag yet). Tag `stage1-v1` untouched.

**PRs & release:** no remote, no PR. Gates: `npm run check` green (now also runs the e2e once in 2D mode). Release: `npm run package` then tag `stage3-v1` only on request.

**Governing rules:** `.claude/change-loop.md` ("Never" list: no runtime dependency, no external request, no emoji art, no real brand; escalation: keep the loop and the fox guide, no `level` retune without a playtest note), README "Project structure", `docs/DEVELOPMENT_NOTE.md` (AI section is the developer's, not edited), bundle budget 300,000 bytes in `scripts/check.mjs`.

**Blast radius:**
- No runtime dependency: the 3D renderer is hand-written WebGL 1 (`src/gl/*`), same as the existing water shader. Three.js alone would exceed the whole bundle budget.
- `src/game.ts` creates the runner. It gains a mode choice (`3d` when WebGL is available and `?mode=2d`/`?nowebgl=1` are absent, else `2d`) and talks to a shared `RunnerApi` interface (`src/scene/types.ts`). `Entity` and `RunnerHandlers` move to that file; `src/scene/runner.ts` re-exports them so nothing else changes.
- `scripts/e2e.mjs`, `scripts/layoutcheck.mjs`, `scripts/perfcheck.mjs`, `scripts/playshot.mjs` steer by pointer Y. In 3D the control axis is X. A shared page-side autopilot (`scripts/autopilot.mjs`) handles both; `MODE=2d` runs the scripts against the fallback runner. `scripts/check.mjs` runs the e2e in 3D at both sizes and once in 2D at 320×568.
- Debug contract (`window.passportQuest.debug`): `entities[].x` is lateral position and `entities[].y` is the distance ahead in 3D; `toScreen(x, 0)` returns the client point the pointer must be at to steer Capi to lateral `x`. New fields: `mode`, `gl`, `draws`.
- Copy: the move hint reads "left and right" in 3D and "up and down" in 2D (runner provides the words).
- `level` tuning untouched: 2D scene units per second divide by a constant to become world units per second; spawn gaps, obstacle chances, goals and penalties are read as-is. The autopilot must still finish both cities inside 90 s.
- No new assets: all 3D models are procedural primitives with vertex colours; fonts and music unchanged.

**Architecture:** A tiny WebGL 1 stack: `gl/math.ts` (mat4, projection), `gl/mesh.ts` (box/cylinder/cone/sphere/quad builder with flat normals and vertex colours, merged into one buffer per model), `gl/renderer.ts` (one lit+fog shader, one unlit mode, draw(mesh, model, tint, alpha), resize at DPR ≤ 1.5, context-loss handling with CPU-side mesh data for re-upload). `scene3d/models.ts` builds Capi (5 costumes, animated limbs), the 18 items and 4 obstacles. `scene3d/world.ts` builds per-city scenery as recyclable chunks (promenade, palms, kiosks, facades, bridge arch), a wave-displaced water plane, far landmarks and sky (day/night per theme). `scene3d/runner3d.ts` mirrors `Runner`: same spawn timing and patterns, same dash/combo hooks, pointer-X and ArrowLeft/Right control, timer-free (every animation is a counter in `update(dt)`), one `destroy()`.

**Runtime scenarios:**
1. Play → Rio → Eat & drink: the stage shows a WebGL canvas with Capi (chef hat) seen from behind running along the beach, sea to the right with moving waves, promenade and palms to the left, Sugarloaf ahead. Items come toward the camera; moving the finger/mouse left and right moves Capi; a tap dashes.
2. Catching an item pops it, bursts particles at its screen position, flies its icon to the HUD chip and adds points; the combo, golden items (gold tint, ×3, counts 2), hit-stop, coupon unlock and completion flow are byte-for-byte the 2D rules.
3. Hitting an obstacle tumbles it away, stuns Capi (blink), costs one bar segment, resets the combo, shakes and flashes; dashing through it spins it away and awards "Dodged!".
4. Rio Party and Porto Party run at night (dark sky, stars, string lights / paper balloons); Culture themes show the cable car / tram; Food themes show kiosks / café tables.
5. Level complete: spawns stop, the world slows, Capi cheers (arms up, hop), remaining entities fade; redeem and journal screens unchanged.
6. `?mode=2d` or `?nowebgl=1` or a browser without WebGL: the SVG runner runs exactly as before (the e2e runs it in `MODE=2d`).
7. Restart from any state tears the canvas down (`#scene-root` empty, GL context lost on purpose, no keyboard state); 12 consecutive restarts leave nothing behind.
8. Tab hidden or rotate prompt: the world freezes (no time jump); `prefers-reduced-motion`: no lean, no dash ghosts, still water and sky.
9. Resize mid-run: the canvas re-fits and the pointer mapping stays correct.
10. Bundle stays ≤ 300,000 bytes; perf at 6x throttle reported in the dev note.

---

### Task 1: GL core, runner contract and the playable 3D skeleton

**Repo:** `.`

**Files:**
- Create: `src/scene/types.ts` (`Entity`, `RunnerHandlers`, `SpawnPattern`, `RunnerApi`, `pickWeighted`)
- Create: `src/gl/math.ts`, `src/gl/mesh.ts`, `src/gl/renderer.ts`
- Create: `src/scene3d/runner3d.ts` (control, spawning, collisions, camera, placeholder meshes, hint overlay, debug accessors)
- Modify: `src/scene/runner.ts` (import the shared types, implement `RunnerApi`), `src/game.ts` (mode choice, `RunnerApi`, hint copy, debug fields), `src/styles.css` (`.scene--3d`, canvas, hint)
- Create: `scripts/autopilot.mjs`; Modify: `scripts/e2e.mjs`, `scripts/layoutcheck.mjs`, `scripts/perfcheck.mjs`, `scripts/playshot.mjs`, `scripts/check.mjs`

- [x] **Step 1: Implement** the files above. Entities in 3D: lateral `x ∈ [−2.4, 2.4]`, depth `z` from −62 (spawn) to +6 (despawn); world speed = `level` speed / 16; row spacing 2.2 units; arc/zigzag offsets ±1.4 laterally. Collision: item when `|dx| < 1.0 && |dz| < 0.7`, obstacle when `|dx| < 0.8 && |dz| < 0.6`. Camera at `(0.35·capiX, 3.0, 5.2)` looking at `(0.35·capiX, 0.9, −4)`, vertical FOV 58°.
- [x] **Step 2: Check** `scripts/e2e.mjs` runs mode-aware: 3D asserts a `.scene--3d canvas`, `debug.gl === true`, `debug.draws > 10`, `fox.x` follows the mouse X and ArrowLeft; 2D (`MODE=2d`) keeps every existing assertion. The `?nowebgl=1` section asserts `debug.mode === '2d'`.
- [x] **Step 3: Gates** `npx tsc --noEmit && npm run build`, `node scripts/e2e.mjs http://localhost:5173/ 320 568`, `MODE=2d node scripts/e2e.mjs http://localhost:5173/ 320 568`.
- [x] **Step 4: Commit** "Add WebGL 3D runner skeleton with shared runner contract and mode-aware scripts".

### Task 2: Models: Capi with costumes and run cycle, 18 items, 4 obstacles

**Repo:** `.`

**Files:**
- Create: `src/scene3d/models.ts`
- Modify: `src/scene3d/runner3d.ts` (use the models; limb animation; item bob/spin; golden tint; pop/bump/dodge/fade animations; ground shadows)
- Create: `gallery.html`, `src/dev/gallery.ts` (dev-only contact sheet, not part of the build), `scripts/artcheck3d.mjs`

- [x] **Step 1: Implement**. Capi: shirt/shorts/accent from the costume palette in `src/art/capy.ts` (exported as `COSTUME_COLORS`), fur head with snout, ears, eyes, nose, hat per costume; legs and arms as separate meshes rotated by a sine run cycle; moods run/ouch/cheer. Items and obstacles as 3–8 primitives each, sized to about 0.6 units.
- [x] **Step 2: Check** `node scripts/artcheck3d.mjs <png>` renders every model in a grid (visual review); e2e asserts a golden item is seen and collected entities disappear.
- [x] **Step 3: Gates and commit** "Add low-poly Capi, items and obstacles for the 3D runner".

### Task 3: Worlds: Rio beach and Porto quay, themes and night

**Repo:** `.`

**Files:**
- Create: `src/scene3d/world.ts`
- Modify: `src/scene3d/runner3d.ts` (world instance: chunks, water, far landmarks, sky, ambient motion)

- [x] **Step 1: Implement**. Rio: sand band, wet-sand foam line, wave-displaced sea on the right, Copacabana wave-pattern promenade with palms and umbrellas on the left, Sugarloaf and hills far ahead, sun and clouds; theme furniture: kiosks (food), string lights at night (party), cable-car cabin on a line to the Sugarloaf (culture). Porto: cobble quay, Douro on the right with rabelo boats, Ribeira facades with window boxes on the left, the Dom Luís arch crossing overhead every third chunk, Gaia hills; furniture: café tables (food), São João balloons and lights at night (party), a tram on the quay (culture). Night sky colours from `SCENE_ART[...].variants.party.bg`.
- [x] **Step 2: Check** `node scripts/playshot.mjs <dir> 320 568 food party` and `... culture culture` screenshots reviewed; e2e asserts the world reports the expected variant (`debug.world === 'brazil:food:day'` etc.).
- [x] **Step 3: Gates and commit** "Add Rio beach and Porto quay 3D worlds with theme and night variants".

### Task 4: Feel, robustness and performance

**Repo:** `.`

**Files:**
- Modify: `src/scene3d/runner3d.ts`, `src/gl/renderer.ts`, `src/styles.css`, `scripts/e2e.mjs`, `scripts/check.mjs`

- [x] **Step 1: Implement** lane lean, squash on catch, dash lunge with ghost copies, stun blink, finish cheer, camera bob, hint arrow, `prefers-reduced-motion` (no lean/ghosts, still water), context loss (canvas hidden behind a sky gradient, meshes re-uploaded on restore), DPR cap 1.5, draw-call counter.
- [x] **Step 2: Check** e2e: reduced-motion reported, context loss simulated via `WEBGL_lose_context` leaves no error and the run continues; `scripts/check.mjs` runs the 2D e2e too and enforces the budget. Perf measured with `node scripts/perfcheck.mjs`.
- [x] **Step 3: Gates and commit** "Polish the 3D runner: lean, dash ghosts, stun, cheer, reduced motion, context loss".

### Task 5: Documentation

**Repo:** `.`

**Files:**
- Modify: `README.md` (how to play, scripts, project structure, limitations, testing table), `docs/DEVELOPMENT_NOTE.md` (new "3D runner (Stage 3)" section: decisions, measurements, problems; AI section untouched), `.claude/change-loop.md` (new contracts: `RunnerApi`, debug fields, `MODE=2d`)

- [x] **Step 1: Write** the docs; **Step 2: Gates** `npm run check`; **Step 3: Commit** "Document the 3D runner".
