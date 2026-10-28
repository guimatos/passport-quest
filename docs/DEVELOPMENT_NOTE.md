# Development note — Passport Quest (Stage 1)

## Tools and libraries

| Tool | Use | Shipped at runtime? |
|---|---|---|
| Vite 7 | bundling, dev server | no (output only) |
| TypeScript 5 (`strict`) | source language, type gate | no |
| `@fontsource/fredoka` | Fredoka font files (OFL 1.1), latin 500/700 | yes (woff2/woff, ~72 KB) |
| `puppeteer-core` | headless-Chrome test scripts, uses the installed Google Chrome | no (dev-only) |
| Python 3 `http.server` | static-server test of `dist/` | no |
| Web Audio API | procedural background music | browser API |

No game framework and no runtime npm dependency. Runtime assets are the bundled
JS, CSS and the four font files; there are no images, audio files or external
URLs. The production build is about 224 KB on disk.

## Assets

- **Scenes, characters, items, obstacles, map, stamps, skyline, plane, icons**:
  original inline SVG written for this project (`src/art/*.ts`). No stock art,
  no emoji, no traced references.
- **Scrambly fox**: no reference asset was found in the repository, so the fox
  is an original drawing using the Scrambly palette. It is the guide (start
  screen, HUD speech bubble, redeem card, final screen).
- **Capi the capybara**: original player character, drawn upright with themed
  clothes and hats.
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
are the ones that move. Runs vary by about ±10%; each row is the median of
three runs. `?perf=1` shows the live overlay in any build.

| Build | fps avg | frame worst ms | JS/frame avg ms | main thread busy % | task ms | style ms | layout ms | SVG nodes | heap MB |
|---|---|---|---|---|---|---|---|---|---|
| Stage 1 baseline (before Stage 2 work) | 60 | 24 | 0.52 | 48.5 | 7278 | 1468 | 351 | 876 | 3 |

## AI correction / rejected output — written by developer

_To be filled in by the developer._

## Known limitations and unfinished work

- Not tested on real devices; all results are emulated headless Chrome.
- Music has not been auditioned on a device; patterns may need taste tuning.
- Mobile keyboard on the final screen may shorten the viewport; the layout is
  compact but was not verified with a real on-screen keyboard.
- Difficulty tuned with an autopilot; human playtest data would refine
  `level` values and the coupon threshold (6 of the signature item).
- The fox guide's speech bubble is text-only; no localisation.
- Accessibility: buttons have labels and the HUD uses `aria-live`, but the
  runner itself needs pointer control and has no keyboard alternative.
