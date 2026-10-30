# Development note — Passport Quest (Stage 1, Stage 2 polish, Stage 3 3D)

## Tools and libraries

| Tool | Use | Shipped at runtime? |
|---|---|---|
| Vite 7 | bundling, dev server | no (output only) |
| TypeScript 5 (`strict`) | source language, type gate | no |
| `@fontsource/fredoka` | Fredoka font files (OFL 1.1), latin 500/700 | yes (woff2 only, inlined as data URIs, ~43 KB) |
| `puppeteer-core` | headless-Chrome test scripts, uses the installed Google Chrome | no (dev-only) |
| Python 3 `http.server` | static-server test of `dist/` | no |
| Web Audio API | procedural background music | browser API |
| WebGL 1 | 3D runner (`src/gl/*`, `src/scene3d/*`, Stage 3) and the water shader of the 2D runner (`src/scene/water.ts`); SVG runner as fallback | browser API |
| Canvas 2D | pooled particles (`src/fx/particles.ts`) | browser API |

No game framework and no runtime npm dependency. The production build is one
self-contained `index.html` (JS, CSS and the two woff2 fonts inlined by
`scripts/inline.mjs` after `vite build`); there are no images, audio files or
external URLs. It is about 250 KB on disk since Stage 3 (`npm run check`
enforces a 300,000-byte budget); the whole 3D stack is about 40 KB minified.

## Assets

- **Scenes, characters, items, obstacles, map, stamps, skyline, plane, icons**:
  original inline SVG written for this project (`src/art/*.ts`). No stock art,
  no emoji, no traced references.
- **Scrambly fox**: no reference asset was found in the repository, so the fox
  is an original drawing using the Scrambly palette. It is the guide (start
  screen, HUD speech bubble, redeem card, final screen).
- **Capi the capybara**: original player character, drawn upright with themed
  clothes and hats.
- **3D models and worlds** (Stage 3): built in code from boxes, cylinders,
  cones, spheres and discs with vertex colours (`src/scene3d/models.ts`,
  `src/scene3d/world.ts`); no textures, no model files, no assets. Palette
  taken from the SVG art.
- **Font**: Fredoka, SIL Open Font License 1.1, from the `@fontsource/fredoka`
  package; license text ships in `node_modules/@fontsource/fredoka/LICENSE`
  and is credited in the README.
- **Music**: three short loops and a jingle synthesized at runtime from
  oscillators and filtered noise (`src/audio/music.ts`); no recordings.
- **History blurbs**: short factual lines written for the journal (São Bento
  azulejos by Jorge Colaço 1905–1916; Porto's first electric tram 1895;
  Sugarloaf cable car 1912; Brazilian rubber sandals 1962; brigadeiro 1940s;
  footvolley 1960s; São João hammers and balloons; Burle Marx promenade 1970).

## Implementation decisions

- **Mechanic.** The brief described a fixed-screen tap-to-find game. During
  review the developer asked for a runner, so the core loop became: scrolling
  parallax scene, character follows the pointer vertically, items and obstacles
  stream in, speed and obstacle density ramp per run. Hit areas are geometric
  (circle distance), so they do not depend on screen size.
- **Scrambly loop.** Discover = choose a theme and meet its items; play &
  progress = demo points and the passport bar; redeem = stamp + demo coupon,
  shown in the wallet and on the final screen. The CTA is local only.
- **Theme choice per city.** Both cities offer Eat & drink, Party and Culture.
  The choice selects the three collectibles, the coupon, the costume and a
  furniture layer (plus a night variant for Party), so replays differ.
- **Map hub instead of fixed stages.** The player picks the first city; the
  last one is auto-selected. State is `completedDests`, not a stage index.
- **One scene coordinate system.** 360×720 viewBox with `slice` fit; the play
  band and HUD are placed so both 320×568 and 390×844 see the same content.
- **Game clock.** Timers and tweens run on a frame-driven clock
  (`src/lib/clock.ts`); the rAF loop clamps the delta and has named pause
  reasons (`hidden`, `rotate`). Hiding the tab freezes hints, spawns, flights
  and effects with no time jump. CSS animations are paused with a class.
- **Single reset path.** `Game.reset()` aborts one `AbortController` (all
  listeners), stops the loop, clears the clock, removes effects, the scene, the
  HUD and overlays, stops the music sequencer and rebuilds the start screen.
  The e2e script restarts 12 times from every state and checks for leftovers.
- **Audio rules.** The AudioContext is created on the Play tap, there is a
  mute button in the HUD, and the context is suspended while hidden.
- **Product promise.** Points are "demo pts" in the HUD and "Demo only — points
  and coupons are not real earnings or offers" on screens; coupons name
  fictional "da Raposa" venues; the email form says it is a mock and makes no
  request.
- **Rotate handling.** Landscape viewports under 480 px tall show a rotate
  prompt and pause; taller landscape windows get a centered phone-sized frame
  so desktop reviewers can play.
- **Determinism for tests.** `?seed=N` seeds spawns; `window.passportQuest.debug`
  exposes state for the scripts. Both are harmless in production and
  documented.

## Scope decisions

- Decoys became obstacles with a small progress penalty (never game over).
- Two items from earlier iterations (flip-flop, seashell) were cut when themes
  were fixed at three per city with three items each.
- No Lisbon or third city; no leaderboard; no localisation.

## Performance measurements

Measured with `node scripts/perfcheck.mjs` (headless Chrome, 320×568 @2x, Rio
Party at night, the busiest scene; CPU throttled 6x through the DevTools
protocol; 15 s of autopilot play). "Main thread" columns are the renderer's
cumulative task / style-recalc / layout durations over the window, read from
`Performance.getMetrics`; "busy" is task time divided by wall time. Frame
rate stays vsync-bound at 60 fps in every build, so the main-thread columns
are the ones that move. Runs vary by about ±5 points of busy time on the same machine; each row is
the median of three to five runs. `?perf=1` shows the live overlay in any build.

| Build | fps avg | frame worst ms | JS/frame avg ms | main thread busy % | task ms | style ms | layout ms | SVG nodes | heap MB |
|---|---|---|---|---|---|---|---|---|---|
| Stage 1 baseline (before Stage 2 work) | 60 | 24 | 0.52 | 48.5 | 7278 | 1468 | 351 | 876 | 3 |
| + entity node pooling, cached scene rects | 60 | 23 | 0.34 | 36.9 | 5530 | 1130 | 263 | 875 | 3 |
| + canvas particles (sparkles, trails, dust, confetti), squash, shake, flash, wipe | 60 | 22 | 0.44 | 38.8 | 5822 | 1075 | 282 | 875 | 3 |
| + WebGL water shader (band-sized canvas, 30 fps redraw) | 60 | 22 | 0.51 | 41.8 | 6266 | 1191 | 261 | 878 | 3 |

Reading the table: the SVG scene is style/layout bound, not script bound.
Pooling removed the node churn (script time −40%, main-thread busy −12
points). The particle canvas is free as long as its backing store is small:
at device-pixel-ratio 2 the raster area alone cost about 7 points, at 1.5 it
costs nothing measurable. The WebGL water adds about 3 points in headless
Chrome, which renders GL in software (SwiftShader) and so is an upper bound;
a phone GPU runs the same fragment shader in hardware.

## Technical problems and solutions

1. **CSS animations silently cancelled SVG `transform` attributes.** Palm
   crowns and clouds jumped between their placed position and the origin.
   Cause: a CSS `transform` animation replaces the presentation attribute, and
   mismatched transform lists interpolate through matrices. Diagnosed by
   comparing two screenshots of the same layer; fixed by wrapping every
   animated element in a plain positioning `<g>`.
2. **Pausing without time jumps.** `setTimeout` timers kept running while
   hidden and all fired on return. Replaced with a frame-driven clock (timers
   and tweens keyed to game time) and a loop with named pause reasons and a
   clamped delta. The Stage 2 shake, wipe, particles and water all take their
   time from that clock, so they freeze and resume with everything else.
3. **One coordinate system for every phone.** A 360×720 viewBox with `slice`
   fit and a computed safe band keeps hit areas, HUD and items identical on
   320×568 and 390×844; the WebGL shader reuses the same fit as uniforms, so
   the ripples line up with the SVG shore on any viewport.
4. **Music without assets.** A lookahead scheduler over the AudioContext clock
   plays three loops from oscillators and filtered noise; it is unlocked on a
   gesture, muted from the HUD and suspended while hidden.
5. **Effects without DOM churn.** Sparkles and confetti were DOM nodes created
   and removed per burst, and every item/obstacle was a fresh `<g>` per spawn.
   Entity nodes are now pooled per kind and id, and effects are a fixed
   400-particle pool on one canvas with dirty-rect clearing. The first canvas
   version measured *slower*: at DPR 2 the full-stage clear each frame cost
   more than the DOM it replaced. Capping the canvas at DPR 1.5 removed the
   cost (table above).
6. **Layout thrash from `getBoundingClientRect`.** The scene rect was read on
   every pointer move and every effect, and the plane tween read the map rect
   every frame. Rects are now cached and invalidated on `resize`; the only
   forced layout left is the deliberate one that restarts Capi's squash.
7. **WebGL contexts and restart.** A canvas keeps its (lost) context after
   `WEBGL_lose_context`, so reusing one `#water` canvas across levels gave the
   second level a dead context. Each level now creates its own canvas, and
   `destroy()` loses the context and removes the element; the restart loop
   asserts that no canvas and no live context remain. Context loss at runtime
   falls back to the SVG gradient without an error.
8. **Measuring something that is vsync-bound.** At 6x CPU throttle the game
   still holds 60 fps in headless Chrome, so fps could not show improvements.
   `scripts/perfcheck.mjs` reads the renderer's cumulative task, style and
   layout durations through the DevTools `Performance` domain instead and
   reports main-thread busy time; run-to-run noise on a laptop is about ±5
   points, so rows are medians.

## AI correction / rejected output — written by developer

_To be filled in by the developer._

## Gameplay feel (Stage 2b)

Tuning lives in `FEEL` (`src/data/destinations.ts`); `level` values are
unchanged from Stage 1, so the difficulty curve is the same and only the
feedback around it changed.

| Mechanic | Value | Why |
|---|---|---|
| Combo multiplier | +1 every 5 catches, cap x4; reset on a hit ("Combo lost!") | Gives obstacles a cost beyond one progress point, still without a fail state |
| Dash | 350 ms immunity, 1.1 s cooldown; quick tap, Space or ArrowRight | A second decision for the player; near misses become dodges (+5, combo kept) |
| Spawn patterns | single 50 %, row 20 %, arc 15 %, zigzag 15 %; every y clamped to the band | Readable routes instead of single random heights |
| Golden signature item | 12 % of signature spawns; x3 points, counts 2 for the coupon | Makes the coupon a visible target, not a side effect of the spawn weight |
| Hit-stop | 45 ms on a hit, 90 ms on a golden or coupon catch | The cheapest "weight" an impact can have: `Game.frame` skips the clock and runner |
| Capi scale and lean | 0.72 (was 0.6), lean up to 14° toward the direction of travel | The hero should outweigh the collectibles; the lean sells the lane change |
| Depth cues | ground shadow per entity (outside the bob group), band shade, horizon haze | The flat ground read as empty; shadows make scale read as distance |
| Toasts | dark pill behind the text | "Coupon unlocked!" was unreadable over the Porto facades |

Playtest note: tuned with the e2e autopilot plus manual runs per city at
390×844 in Chrome touch emulation. Both cities still complete in 40–60 s; the
coupon still unlocks on most runs, the golden item mostly changes how it
feels. The Rio autopilot reaches x4 before the bar fills, so a human who
dodges will see the badge move. Real-device playtests are still pending (see
Known limitations).

Performance (same-session A/B, alternating runs of `scripts/perfcheck.mjs`,
15 s, 6x throttle, three rounds): polish build 60.1 % main-thread busy, worst
frame 35 ms, 875 nodes; feel build 62.0 %, 28 ms, 890 nodes. The 2-point
difference is inside the documented run-to-run noise. The absolute busy
numbers differ from the table above because the machine state differs between
days; compare rows only within one session. The golden glow is a CSS
`filter` on at most a couple of nodes at a time; the lane lean is one
attribute write per frame on a group that already carries `will-change`.

Storage: mute and best score use `localStorage` through `src/lib/storage.ts`;
every access is wrapped, so a sandboxed iframe or private window plays
exactly like before (`NO_STORAGE=1 node scripts/e2e.mjs` proves it). No data
leaves the device.

Keyboard: ArrowUp/ArrowDown move, Space/ArrowRight dash. This closes the Stage
1 gap of the runner having no keyboard alternative.

Onboarding: the move hint shows for 1.6 s at level start (ghost hand) before
the 4 s idle hint takes over; the first fox line says "Tap to dash!".

## 3D runner (Stage 3)

The run became a 3D world; the loop, screens, HUD, data, effects and the Stage
2b feel rules are unchanged. The SVG runner stays as the fallback. Built on
`stage3/3d-runner` and merged into `main` on 2026-10-29 (fast-forward; the
whole history is linear).

**Decisions**

- **No library.** The bundle budget (300,000 bytes, 240 KB already used) rules
  out Three.js or Babylon (hundreds of KB minified), and the profile forbids
  runtime dependencies. The renderer is WebGL 1 in about 40 KB: one shader
  (per-vertex colour, one directional light plus ambient, distance fog toward
  the horizon colour, an unlit mode, a per-draw tint, alpha and vertex wave),
  a mesh builder for primitives with flat normals, and 4×4 matrix helpers.
  Every model is one interleaved buffer and one draw call; a frame is 35–50
  draw calls.
- **One contract, two runners.** `src/scene/types.ts` (`RunnerApi`) is what
  the game drives. `Runner3D` mirrors `Runner`: the same spawn timing, spawn
  patterns, dash window and cooldown, stun, golden odds and collision roles,
  so `level` and `FEEL` tuning carry over untouched. Scene speed in 2D units
  per second divides by 16 to become world units per second; spawns appear
  62 units ahead so the first reaction window is longer than in 2D while the
  item throughput per minute is identical.
- **Lateral control.** The pointer's horizontal position across the stage maps
  linearly onto the play band (±2 units, slightly widened so the edges are
  reachable), independent of perspective, so a finger position always means
  the same lane. Keyboard: ArrowLeft/ArrowRight move, Space/ArrowUp dash.
- **Camera.** Behind and above Capi (eye at 4.8 up, 8.6 back; 64° vertical
  field of view), following 40 % of Capi's lateral offset so the band stays
  on screen at 320×568 and 390×844.
- **Worlds as recyclable chunks.** Each city has three 24-unit scenery chunks
  (promenade mosaic, palms, umbrellas, buildings; cobbles, facades with
  windows, bollards, the Dom Luís arch every third chunk). Seven are visible;
  when one passes the camera it moves to the far end and the variant cycle
  rotates, so the street never repeats visibly in one screen. Theme
  furniture (kiosks, café tables, string lights, rails, a footvolley net) and
  the night sky (party themes) are baked into the chunks and sky at level
  start; nothing allocates per frame. "Movers" (boats, clouds, the cable car,
  São João balloons, a tram) are a handful of meshes with a position update.
- **Night** is a sky gradient with stars and a moon, lower ambient light and
  an intensity multiplier on lit colours, so the day palette is reused.
- **Feel in 3D.** Lane lean (roll toward the lateral velocity), squash on a
  catch, dash lunge with two ghost copies, stun blink, cheer at level end
  (arms up, hop), item bob and spin (golden ones faster and tinted), pop,
  tumble and spin-away animations on catch, hit and dodge, ground shadow
  discs for depth, entity fade on finish. All are counters in `update(dt)`,
  so they pause with the game.
- **Robustness.** The canvas is created per level and `destroy()` loses the
  context on purpose (the restart loop asserts no canvas, no context). A lost
  context at runtime hides the canvas behind a CSS sky gradient while the
  world keeps running; on restore the program is rebuilt and every mesh
  re-uploads lazily (meshes keep their CPU data). No WebGL at all, `?nowebgl=1`
  or `?mode=2d` use the SVG runner. `prefers-reduced-motion` removes lean,
  ghosts, water waves, bob and drifting movers. Device pixel ratio is capped
  at 1.5 like the particle canvas.

**Testing.** The dev-only scripts share one in-page autopilot
(`scripts/autopilot.mjs`) that steers by pointer X in 3D and pointer Y in
2D; `MODE=2d` runs any script against the fallback. The e2e asserts, in 3D,
the live context and draw calls, pointer and keyboard control, the day and
night world names, a golden spawn counted by the runner, context loss and
restore, and the same teardown invariants as before. `npm run check` runs the
e2e at both sizes in 3D and once in 2D. `gallery.html` (dev server only) and
`scripts/artcheck3d.mjs` render every model for review.

**Measurements** (`node scripts/perfcheck.mjs`, 320×568 @2x, 6x CPU throttle,
15 s of autopilot, same session, two rounds each; the busiest scene for the
2D runner, Rio Party at night, is the same world the 3D run loads). "Main
thread" is the renderer process only: headless Chrome rasterises WebGL with
SwiftShader in the GPU process, which these numbers do not include, so the
3D row says how much the page's own thread works, not what a phone GPU will
spend.

| Runner | fps avg | frame worst ms | JS/frame avg ms | main thread busy % | task ms | style ms | layout ms | nodes / draw calls | heap MB |
|---|---|---|---|---|---|---|---|---|---|
| 3D (WebGL), round 1 | 60 | 18 | 0.35 | 11.0 | 1645 | 227 | 112 | 6 nodes, 25 draws | 7 |
| 3D (WebGL), round 2 | 60 | 20 | 0.28 | 8.5 | 1275 | 170 | 104 | 6 nodes, 25 draws | 7 |
| 2D (SVG fallback), round 1 | 60 | 22 | 0.41 | 37.3 | 5597 | 1110 | 250 | 889 nodes | 2 |
| 2D (SVG fallback), round 2 | 60 | 22 | 0.38 | 36.9 | 5538 | 1072 | 242 | 891 nodes | 2 |

Reading the table: the 3D scene removes the style and layout work of the
SVG scene (six DOM nodes instead of about 890), so the main thread is mostly
idle; what remains is the HUD, effects canvas and JS. The GPU cost is the
open question for real devices: a frame is 25–50 draw calls and a few
thousand triangles, which is small for any phone GPU of the last decade,
but it has not been measured on one.

**Problems and solutions**

1. **Software GL in headless Chrome.** SwiftShader draws the 3D scene slowly,
   so the autopilot's completion times in the e2e are about the same as in 2D
   only because the game clock is frame-independent; a perf number from
   headless is an upper bound. The scripts keep their timeouts generous.
2. **Steering tests across perspectives.** Projecting an item to the screen
   and moving the pointer there would depend on the camera; instead the
   control mapping is linear and `debug.toScreen(x, 0)` is its exact inverse,
   so the autopilot targets a lane, not a pixel.
3. **A flaky golden assertion.** Sampling the entity list every 100 ms missed
   golden items, and with seed 7 the first golden item only spawns after
   36 s, when a level is long over. The runner now counts golden spawns
   (`feel.goldens`) and a dedicated `?seed=13` run, whose first spawn is
   golden (found by replaying the spawn RNG in node), asserts the count and
   the live golden entity in both runners.
4. **Z-fighting on overlays.** Promenade, wet sand, curb and shadows are thin
   planes on the ground; they sit 1–5 cm apart in height and the fog hides
   the far-distance flicker.
5. **Culled discs.** The sun, moon and stars are one-sided discs; a rotation
   of +90° about x makes them face the camera, −90° culls them silently.
6. **Bundle budget.** The 3D stack added about 40 KB; the build was 280 KB
   of 300,000 bytes with four font files, and 250 KB once the single-file
   step dropped the `.woff` copies (every target browser reads `.woff2`).
7. **Double-clicking `index.html` did nothing.** Vite emits a module script
   with `crossorigin`, and on a `file://` page (origin "null") Chrome blocks
   both the script and the stylesheet as cross-origin requests. The brief
   only requires a static HTTP server, but a reviewer who opens the file
   should not see a blank page. `scripts/inline.mjs` now folds the build
   into one HTML file: the bundle (a single ES2019 chunk with no `import`,
   `export` or `import.meta`) is inlined as a classic script inside a
   strict-mode function at the end of `<body>`, `</script` and `<!--`
   sequences are escaped, and the CSS is inlined with the woff2 fonts as
   data URIs. `npm run check` runs the e2e once against the file URL; the
   only "requests" are the two data-URI fonts.

## Known limitations and unfinished work

- The 3D runner was verified only in headless Chrome (software GL): frame
  rate, antialiasing quality and heat on a phone GPU are unverified. The
  models are deliberately low-poly (a frame is a few thousand triangles).
- The hint arrow in 3D is a fixed overlay above Capi rather than a marker in
  the world; the fox's text says "left and right".

- Not tested on real devices; all results are emulated headless Chrome.
- Headless Chrome renders WebGL with SwiftShader (software), so the water's
  measured cost is an upper bound and its look on a phone GPU is unverified;
  `?nowebgl=1` shows the SVG fallback for comparison.
- `prefers-reduced-motion` is honoured (no shake, still water, ambient
  decoration stopped, fewer particles) but was verified only through emulation.
- Music has not been auditioned on a device; patterns may need taste tuning.
- Mobile keyboard on the final screen may shorten the viewport; the layout is
  compact but was not verified with a real on-screen keyboard.
- Difficulty tuned with an autopilot; human playtest data would refine
  `level` values and the coupon threshold (6 of the signature item).
- The fox guide's speech bubble is text-only; no localisation.
- Accessibility: buttons have labels and the HUD uses `aria-live`; the runner
  takes keyboard input (arrows, Space) but has no screen-reader description
  of what is on screen.
- Combo, dash, golden and hit-stop values (`FEEL`) were tuned with the
  autopilot and emulated touch, not with players; the golden chance and the
  dash cooldown are the two numbers most likely to move after a playtest.
