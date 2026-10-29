# Passport Quest

A mobile-first HTML5 playable for Scrambly (Simula take-home, Stage 1; Stage 2
polish and feel; Stage 3 adds a 3D version of the run).

Capi the capybara runs through Rio de Janeiro and Porto, guided by the Scrambly
fox. Since Stage 3 the run is a low-poly 3D world drawn with hand-written WebGL
(camera behind Capi, Copacabana and the Ribeira quay streaming toward the
player); the original SVG parallax runner stays as the fallback when WebGL is
unavailable or with `?mode=2d`. Before each city the player picks what to see (Eat & drink, Party or
Culture); the run streams that theme's items, each catch adds **demo points**,
and finishing a city **redeems** a passport stamp plus, if enough of the
signature item was caught, a **demo coupon**. Discover → play & progress →
redeem, with every balance and coupon clearly labelled as demo.

No backend, no analytics, no external requests at runtime. Everything (code,
fonts, art, music) is bundled or generated in the browser.

## Versions

| Stage | What | Where |
|---|---|---|
| 1 | SVG parallax runner, map hub, themes, passport and coupon loop, delivery ZIP | tag `stage1-v1` (2026-10-28) |
| 2 and 2b | entity pooling, canvas particles, WebGL water, combo, dash, golden items, hit-stop, onboarding, keyboard | merged into `main` |
| 3 | 3D WebGL run (Rio beach, Porto quay, five costumes, every item and obstacle as a model) with the SVG runner as fallback | merged into `main` on 2026-10-29 |

`main` holds everything. The `stage2/polish-perf` and `stage3/3d-runner`
branches are merged and kept only as history. Stages 2 and 3 have no tag yet;
`npm run check` is green at the merge commit.

## Build and run

Requirements: Node 22 (`.nvmrc`), npm. Python 3 is used only for the static
server command.

```bash
nvm use            # or any Node >= 20
npm install
npm run dev        # http://localhost:5173/  (Vite dev server)
```

Production build and static-server test (ES modules need an HTTP server;
`file://` will not work):

```bash
npm run build                      # writes dist/
npm run serve:dist                 # python3 -m http.server 4173 --directory dist
# or: npx serve dist
```

Open the URL in a mobile viewport (Chrome DevTools device mode, 320×568 or
390×844) or on a phone on the same network.

### Delivery ZIP

```bash
npm run package -- stage3   # build + release/passport-quest-stage3.zip (default stage: stage3)
```

The script puts the runnable build at the ZIP root (`index.html`, `assets/`),
adds `RUN.txt`, this README and a `source/` folder with the readable
TypeScript source, scripts and docs, then prints the byte size and root
listing and fails if `index.html` is not at the root or the ZIP exceeds
5,000,000 bytes. The stage argument names the ZIP and the `RUN.txt` label;
ZIPs of earlier stages in `release/` are left in place. The Stage 1 ZIP
(`stage1-v1`) was 209,576 bytes; the Stage 3 ZIP built on 2026-10-29 is
330,576 bytes and includes the plans, the model gallery page and the CI
workflow under `source/`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on 5173 |
| `npm run build` | `tsc --noEmit` then `vite build` → `dist/` |
| `npm run preview` | Vite preview of `dist/` |
| `npm run serve:dist` | Python static server for `dist/` on 4173 |
| `npm run package` | Build and create the delivery ZIP with verification |
| `npm run check` | Every gate in one run: typecheck, build, bundle budget (≤ 300,000 bytes), e2e at both sizes in 3D plus once in 2D against a static preview of `dist/`, layout checks, perf print |
| `npm run perf` | `scripts/perfcheck.mjs`: fps, frame times, main-thread cost and heap at 6x CPU throttle in the busiest scene (prints JSON) |
| `node scripts/e2e.mjs <url> <w> <h>` | Headless-Chrome flow test (uses the installed Google Chrome via `puppeteer-core`, dev-only) |
| `node scripts/layoutcheck.mjs <url>` | Rotate prompt, desktop frame and mid-game resize checks |
| `node scripts/playshot.mjs <dir> <w> <h> <rioTheme> <portoTheme>` | Captures map, intro and mid-play frames for visual review |
| `node scripts/artcheck.mjs <png>` | Renders a contact sheet of the SVG characters, items and obstacles |
| `node scripts/artcheck3d.mjs <png>` | Renders the 3D model gallery (`gallery.html`, dev server only) to a PNG for review |

`MODE=2d` in front of the e2e, layout, perf or playshot script runs it against
the SVG fallback runner (it appends `?mode=2d`); the default is the 3D runner.

Add `?seed=N` to the URL for deterministic spawns (the tests use `seed=7`),
`?perf=1` for the live performance overlay, `?mode=2d` for the SVG runner and
`?nowebgl=1` to force the SVG runner with its gradient water (no WebGL at all). `window.passportQuest.debug` exposes read-only state for the
scripts. The scripts use the Google Chrome found at the macOS path by default;
set `CHROME_PATH` to point them at another Chrome or Chromium binary.
`NO_STORAGE=1 node scripts/e2e.mjs …` runs the flow with `localStorage`
throwing on every access (sandboxed-iframe conditions).

## How to play (reviewer notes)

1. **Start**: Capi and the fox, the Scrambly framing line, Play.
2. **Map**: choose Rio or Porto first (buttons or markers). The plane flies there.
3. **Theme card**: pick Eat & drink, Party or Culture. Capi's costume and the
   scene change with the choice; the card shows the three items and the coupon.
4. **Run** (3D): move your finger or mouse left and right; Capi follows across
   the beach or quay while the world streams toward you. Tap (or Space /
   ArrowUp) to dash through an obstacle. Catch items, dodge obstacles (a hit
   costs one bar segment, never game over). Speed and obstacle density ramp up
   ("Faster!"). Catch 6 of the signature item to unlock the theme's coupon.
   In the 2D fallback (`?mode=2d`, no WebGL) Capi follows the pointer up and
   down and ArrowUp/ArrowDown move; everything else is identical.
5. **Redeem**: stamp card (+100), coupon won or missed, then the travel journal
   with a short real history of each item.
6. **Map again**: the remaining city is selected automatically.
7. **Final**: passport with both stamps, demo points, coupons, a mock email
   form ("Send coupons" validates and logs; nothing is sent), the
   **Explore Scrambly** CTA (local confirmation + `console.log`, no navigation)
   and **Play again**.

**Restart** is always in the HUD top bar (map, run, redeem, journal). **Mute**
sits next to it; music starts only after the Play tap and is silenced while the
tab is hidden.

## Testing results

All testing was **emulated** (headless Google Chrome 156 on macOS via
`puppeteer-core`, device-mode viewports with touch enabled). No real phone or
tablet was used; the developer records real-device results separately.

| Check | Result | Mode |
|---|---|---|
| Loading, start screen, map hub, theme cards | pass | emulated 320×568, 390×844 |
| 3D runner: WebGL canvas alive, world streams, Capi follows pointer X and ArrowLeft, dash, day/night worlds per theme | pass | emulated 320×568, 390×844 (software GL) |
| 3D runner: GL context lost mid-run keeps the game running; restore resumes drawing; no errors | pass | emulated |
| 2D fallback runner (`?mode=2d`, `?nowebgl=1`): full flow with the Stage 2 assertions | pass | emulated 320×568 |
| Items collected once; completion fires once; continue/theme/destination double taps ignored | pass | emulated |
| Hint after ~4 s idle; suppressed while hidden; no time jump on resume | pass | emulated |
| Points, coupon unlock (+50), stamp bonus (+100), passport progress | pass | emulated |
| Rio-first and Porto-first flows; last city auto-selected; final screen | pass | emulated |
| CTA: confirmation text, console log, URL unchanged | pass | emulated |
| Email mock: invalid rejected, valid confirmed, logged, no network request | pass | emulated |
| Restart from map, mid-run, redeem, journal, final; 12 consecutive restarts; no leftover effects or duplicate listeners | pass | emulated |
| Touch taps and mouse hover/move | pass | emulated |
| Portrait 320×568 and 390×844 | pass | emulated |
| Phone landscape rotate prompt (pauses); desktop landscape phone frame | pass | emulated |
| Resize and orientation change mid-game | pass | emulated |
| Page hidden/resumed: world and timers frozen | pass | emulated |
| No scrolling/zoom: `touch-action: none`, `overscroll-behavior: none`, no document overflow | pass (overflow asserted) | emulated |
| No console errors, no broken assets, no external requests (5 local requests) | pass | emulated, Network observed |
| Static-server execution of `dist/` (Python http.server) at both sizes | pass | emulated |
| ZIP root structure and byte size | pass | script |
| 3D look and frame rate on a phone GPU | **not verified** (headless Chrome renders GL in software) | — |
| Music audible and balanced | **not verified** (headless has no audio output) | — |
| Real iOS Safari / Android Chrome, pull-to-refresh, haptics, safe areas | **not tested** | — |

Run the same checks yourself:

```bash
npm run check   # all gates against a static preview of dist/ (about 10 minutes: 3D at both sizes, then 2D once)

# or individually, against the dev server:
npm run dev &
node scripts/e2e.mjs http://localhost:5173/ 320 568
node scripts/e2e.mjs http://localhost:5173/ 390 844
node scripts/layoutcheck.mjs http://localhost:5173/
```

The same gates run in GitHub Actions on every push and pull request
(`.github/workflows/check.yml`, repository github.com/guimatos/passport-quest);
the workflow installs Chrome and passes its path through `CHROME_PATH`. Performance numbers
and the measurement method are in `docs/DEVELOPMENT_NOTE.md`.

## Known limitations

- Music is synthesized with the Web Audio API and was tuned by ear only in
  design; it has not been listened to on a device. Volume is low; use Mute.
- The email form is a mock; on phones the keyboard reduces the viewport and the
  final screen may need a scroll inside the keyboard-shortened view.
- The map's coastlines are stylized, not geographic.
- Difficulty tuning (`level` in `src/data/destinations.ts`) is set for a
  roughly 30–45 s run per city but was validated with an autopilot, not humans.
- The 3D runner was verified only in headless Chrome, which renders WebGL in
  software (SwiftShader); its look and frame rate on a phone GPU are
  unverified. Antialiasing is requested and the canvas is capped at device
  pixel ratio 1.5. `?mode=2d` is the fallback to compare against.
- Rotate prompt threshold: landscape viewports under 480 px tall show the
  prompt; taller landscape windows (desktop) get a centered phone frame.
- Keyboard: ArrowLeft/ArrowRight move Capi and Space or ArrowUp dashes in 3D
  (ArrowUp/ArrowDown and Space/ArrowRight in 2D). Screen readers get the HUD
  live regions only; the run itself is visual.
- Best score and mute are kept in `localStorage` when the browser allows it;
  inside a sandboxed iframe or a private window they simply reset each load.
- The WebGL water was verified in headless Chrome, which renders GL in
  software (SwiftShader): its measured cost is an upper bound and its look on
  a phone GPU is unverified. `?nowebgl=1` forces the SVG fallback. Performance
  numbers (`docs/DEVELOPMENT_NOTE.md`) come from a laptop at 6x CPU throttle
  and vary by about ±5 points of main-thread time between runs.

## Project structure

```
index.html              app shell
src/main.ts             boot
src/game.ts             state machine (start, intro/map, playing, redeem, journal, final), reset()
src/data/destinations.ts  destinations, themes, items, coupons, obstacles, level tuning and FEEL (combo, dash, golden, hit-stop) (content contract)
src/scene/types.ts      RunnerApi: the contract both runners implement (entities, handlers, debug accessors)
src/scene/runner.ts     SVG parallax runner (2D fallback), pointer/keyboard control, dash, spawn patterns, pooled spawns, collisions
src/scene/water.ts      WebGL water shader under the SVG scene (SVG gradient fallback)
src/gl/math.ts          mat4 helpers: perspective, lookAt, TRS, projection
src/gl/mesh.ts          low-poly mesh builder (box, cylinder, cone, sphere, disc, plane) with flat normals and vertex colours
src/gl/renderer.ts      WebGL 1 renderer: one lit+fog shader, unlit mode, tint/alpha/wave per draw, DPR cap, context loss/restore
src/scene3d/runner3d.ts 3D runner: lateral control, same spawn/dash/feel rules, camera, chunk streaming, Capi animation
src/scene3d/models.ts   Capi (5 costumes, animated limbs), 18 items, 4 obstacles, ground shadow
src/scene3d/world.ts    Rio beach and Porto quay: base, water, far landmarks, sky (day/night), scenery chunks, movers
src/dev/gallery.ts      dev-only model gallery behind gallery.html (not built)
src/ui/hud.ts           HUD: restart, mute, wallet, progress bar, item chips, fox guide bubble
src/ui/screens.ts       start, map/intro, redeem, journal, final (email mock, CTA)
src/art/*.ts            SVG art: scenes, items, capy, fox, map, passport
src/fx/fx.ts            effects: canvas particles (bursts, trails, dust, confetti), fly-to-HUD, floating text
src/fx/particles.ts     fixed-size particle pool on a 2D canvas
src/lib/perf.ts         ?perf=1 overlay (fps, frame time, JS per frame, node count)
src/lib/storage.ts      guarded localStorage for mute and best score (no network; silent when blocked)
src/audio/music.ts      procedural music (Web Audio), mute, hidden handling
src/lib/*.ts            game clock (timers/tweens), rAF loop with pause reasons, DOM helpers, seeded RNG
src/styles.css          all styling and CSS animations
scripts/                check (all gates), package, e2e, layoutcheck, perfcheck, playshot, artcheck, artcheck3d, autopilot (shared steering, MODE=2d)
.github/workflows/      check.yml: the same gates on every push once a remote exists
docs/                   development note, walkthrough outline
.claude/change-loop.md  change-loop profile for /plan-change and /implement-change
plans/                  plans written by /plan-change
```

## Working on this project with the change loop

The repo ships a profile for the **change-loop** Claude Code plugin, the same
plan-then-implement loop used across the Norruva projects, tailored here to a
single Vite/TypeScript repo. The profile is `.claude/change-loop.md`; it tells
the skills what the gates are (`tsc`, build, the e2e script), how to run the
app, what is never allowed (external requests, runtime dependencies, real brand
coupons, editing the developer's AI section) and where plans go (`plans/`).

Setup once: install the `change-loop` plugin from the organization's plugin
library (it is already installed in this workspace). Then:

```
/plan-change <describe the change, e.g. "add a third city, Lisbon">
/clear
/implement-change plans/<date>-<slug>-plan.md
```

- `/plan-change` re-reads the profile, `README.md` and the code, maps every
  file the change touches (data contract → art → game → e2e script), and writes
  a numbered plan to `plans/`. It writes no product code.
- `/implement-change` runs the plan task by task. Each task updates
  `scripts/e2e.mjs` (behaviour) or a screenshot script (visuals) in the same
  commit, passes `npx tsc --noEmit` and `npm run build`, and is exercised in
  the running app before it is called done. It never pushes or tags without
  being asked.
- "Ship to QA" means build and run the e2e script against the static `dist/`
  server. "Finalize" means the full gates plus `npm run package`.
- Stages 2 and 3 were built on `stage2/<slug>` and `stage3/<slug>` branches
  and merged into `main` (fast-forward, linear history). New work branches
  from `main` as `<topic>/<slug>` and merges back once `npm run check` is
  green. Each delivered stage gets its own tag; `stage1-v1` is never moved.

## Credits

- Game design, code and all artwork (scenes, Capi, fox, items, obstacles, map,
  stamps): original vector work for this project. The 3D models and worlds are
  built in code from primitives with vertex colours (no textures, no assets).
- Font: [Fredoka](https://github.com/hafontia/Fredoka-One) by Milena Brandão,
  SIL Open Font License 1.1, bundled via `@fontsource/fredoka` (latin 500/700).
- Music: generated at runtime with the Web Audio API; no recordings used.
- Tools: Vite 7, TypeScript 5, `puppeteer-core` (dev-only tests), Google Chrome.
- The Scrambly fox: no reference asset was present in the repository, so the
  fox is an original drawing in the Scrambly palette (orange #F58324, purple
  #7845D8, ink #201338, warm white #FFF6E8).
