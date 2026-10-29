# Passport Quest

A mobile-first HTML5 playable for Scrambly (Simula take-home, Stage 1).

Capi the capybara runs through Rio de Janeiro and Porto, guided by the Scrambly
fox. Before each city the player picks what to see (Eat & drink, Party or
Culture); the run streams that theme's items, each catch adds **demo points**,
and finishing a city **redeems** a passport stamp plus, if enough of the
signature item was caught, a **demo coupon**. Discover → play & progress →
redeem, with every balance and coupon clearly labelled as demo.

No backend, no analytics, no external requests at runtime. Everything (code,
fonts, art, music) is bundled or generated in the browser.

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
npm run package    # build + release/passport-quest-stage1.zip
```

The script puts the runnable build at the ZIP root (`index.html`, `assets/`),
adds `RUN.txt`, this README and a `source/` folder with the readable
TypeScript source, scripts and docs, then prints the byte size and root
listing and fails if `index.html` is not at the root or the ZIP exceeds
5,000,000 bytes. The exact byte size of the delivered ZIP is in the Stage 1 final report and in the `stage1-v1` tag message.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on 5173 |
| `npm run build` | `tsc --noEmit` then `vite build` → `dist/` |
| `npm run preview` | Vite preview of `dist/` |
| `npm run serve:dist` | Python static server for `dist/` on 4173 |
| `npm run package` | Build and create the delivery ZIP with verification |
| `npm run check` | Every gate in one run: typecheck, build, bundle budget (≤ 300,000 bytes), e2e at both sizes against a static preview of `dist/`, layout checks, perf print |
| `npm run perf` | `scripts/perfcheck.mjs`: fps, frame times, main-thread cost and heap at 6x CPU throttle in the busiest scene (prints JSON) |
| `node scripts/e2e.mjs <url> <w> <h>` | Headless-Chrome flow test (uses the installed Google Chrome via `puppeteer-core`, dev-only) |
| `node scripts/layoutcheck.mjs <url>` | Rotate prompt, desktop frame and mid-game resize checks |
| `node scripts/playshot.mjs <dir> <w> <h> <rioTheme> <portoTheme>` | Captures map, intro and mid-play frames for visual review |
| `node scripts/artcheck.mjs <png>` | Renders a contact sheet of characters, items and obstacles |

Add `?seed=N` to the URL for deterministic spawns (the tests use `seed=7`),
`?perf=1` for the live performance overlay and `?nowebgl=1` to force the SVG
water fallback. `window.passportQuest.debug` exposes read-only state for the
scripts. The scripts use the Google Chrome found at the macOS path by default;
set `CHROME_PATH` to point them at another Chrome or Chromium binary.

## How to play (reviewer notes)

1. **Start**: Capi and the fox, the Scrambly framing line, Play.
2. **Map**: choose Rio or Porto first (buttons or markers). The plane flies there.
3. **Theme card**: pick Eat & drink, Party or Culture. Capi's costume and the
   scene change with the choice; the card shows the three items and the coupon.
4. **Run**: move your finger or mouse up and down; Capi follows. Catch items,
   dodge obstacles (a hit costs one bar segment, never game over). Speed and
   obstacle density ramp up ("Faster!"). Catch 6 of the signature item to unlock
   the theme's coupon.
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
| Music audible and balanced | **not verified** (headless has no audio output) | — |
| Real iOS Safari / Android Chrome, pull-to-refresh, haptics, safe areas | **not tested** | — |

Run the same checks yourself:

```bash
npm run check   # all gates against a static preview of dist/ (about 5 minutes)

# or individually, against the dev server:
npm run dev &
node scripts/e2e.mjs http://localhost:5173/ 320 568
node scripts/e2e.mjs http://localhost:5173/ 390 844
node scripts/layoutcheck.mjs http://localhost:5173/
```

The same gates run in GitHub Actions on every push and pull request
(`.github/workflows/check.yml`) once the repository has a remote; the workflow
installs Chrome and passes its path through `CHROME_PATH`. Performance numbers
and the measurement method are in `docs/DEVELOPMENT_NOTE.md`.

## Known limitations

- Music is synthesized with the Web Audio API and was tuned by ear only in
  design; it has not been listened to on a device. Volume is low; use Mute.
- The email form is a mock; on phones the keyboard reduces the viewport and the
  final screen may need a scroll inside the keyboard-shortened view.
- The map's coastlines are stylized, not geographic.
- Difficulty tuning (`level` in `src/data/destinations.ts`) is set for a
  roughly 30–45 s run per city but was validated with an autopilot, not humans.
- Rotate prompt threshold: landscape viewports under 480 px tall show the
  prompt; taller landscape windows (desktop) get a centered phone frame.

## Project structure

```
index.html              app shell
src/main.ts             boot
src/game.ts             state machine (start, intro/map, playing, redeem, journal, final), reset()
src/data/destinations.ts  destinations, themes, items, coupons, obstacles, tuning (content contract)
src/scene/runner.ts     parallax runner scene, pointer follow, spawns, collisions
src/ui/hud.ts           HUD: restart, mute, wallet, progress bar, item chips, fox guide bubble
src/ui/screens.ts       start, map/intro, redeem, journal, final (email mock, CTA)
src/art/*.ts            SVG art: scenes, items, capy, fox, map, passport
src/fx/fx.ts            sparkles, fly-to-HUD, floating text, confetti
src/audio/music.ts      procedural music (Web Audio), mute, hidden handling
src/lib/*.ts            game clock (timers/tweens), rAF loop with pause reasons, DOM helpers, seeded RNG
src/styles.css          all styling and CSS animations
scripts/                package, e2e, layoutcheck, playshot, artcheck
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
- Stage 2 work goes on a `stage2/<slug>` branch and gets its own tag; the
  `stage1-v1` tag is never moved.

## Credits

- Game design, code and all artwork (scenes, Capi, fox, items, obstacles, map,
  stamps): original vector work for this project.
- Font: [Fredoka](https://github.com/hafontia/Fredoka-One) by Milena Brandão,
  SIL Open Font License 1.1, bundled via `@fontsource/fredoka` (latin 500/700).
- Music: generated at runtime with the Web Audio API; no recordings used.
- Tools: Vite 7, TypeScript 5, `puppeteer-core` (dev-only tests), Google Chrome.
- The Scrambly fox: no reference asset was present in the repository, so the
  fox is an original drawing in the Scrambly palette (orange #F58324, purple
  #7845D8, ink #201338, warm white #FFF6E8).
