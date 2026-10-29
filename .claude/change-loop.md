# Change-loop profile: Passport Quest (Scrambly playable)

Profile for the `change-loop` plugin (`/plan-change`, `/implement-change`),
tailored to this repo. The loop itself lives in the plugin; this file holds
only what is specific to Passport Quest. Treat it like a `CLAUDE.md`.

## Repos

Single repo; paths are relative to this file's workspace root (the repo root).
Use Node from `.nvmrc` (`source ~/.nvm/nvm.sh && nvm use`), currently Node 22.

| Repo (path) | Role | Stack | Local port |
|---|---|---|---|
| `.` | Mobile-first HTML5 playable: runner game with a Scrambly loop (discover → play → redeem) | Vite 7, TypeScript 5, hand-written WebGL 1 (3D runner, `src/gl`, `src/scene3d`), inline SVG scenes (2D fallback runner, screens, HUD), CSS animations, Web Audio API; no framework, no runtime dependencies | 5173 (dev), 4173 (static preview of `dist/`) |

Contracts inside the repo (the "blast radius" of a change):
- `src/data/destinations.ts` is the content contract: destinations, themes, items, coupons, obstacles, level tuning. Adding an `ItemId` requires an entry in `ITEM_ART` (`src/art/items.ts`) and `DISCOVER_LINES` (`src/game.ts`); adding a `CostumeId` requires both costume records in `src/art/capy.ts`; adding a `ThemeId` requires a `furniture` layer per city in `src/art/scenes.ts`, a `THEME_ICONS` glyph, and an entry in both cities' `themes`.
- `src/scene/types.ts` is the runner contract (`RunnerApi`, `Entity`, `RunnerHandlers`, `LiveEntity`, `RunnerFeel`). Two runners implement it: `src/scene3d/runner3d.ts` (WebGL, default) and `src/scene/runner.ts` (SVG, fallback for no WebGL, `?mode=2d`, `?nowebgl=1`). A new runner capability is added to the interface first and implemented in both, or declared 3D-only with a no-op in 2D. Adding an `ItemId`/`ObstacleId` also needs a model in `src/scene3d/models.ts` (`ITEMS`/`OBSTACLES`); adding a `ThemeId` needs furniture in both worlds in `src/scene3d/world.ts`; a `CostumeId` needs a hat in `models.ts`.
- `window.passportQuest.debug` is read by every script: `entities[].x/y` mean scene x/y in 2D and lateral/distance-ahead in 3D; `toScreen(x, y)` is scene→viewport in 2D and the pointer point that steers to lateral `x` in 3D; `mode`, `gl`, `draws`, `world` and `feel.goldens` exist for the 3D checks. The shared steering lives in `scripts/autopilot.mjs`; `MODE=2d` switches every script to the SVG runner.
- `src/game.ts` owns all mutable state and the single `reset()` path. Anything that adds a listener, timer, tween, DOM node or audio must be torn down there (AbortSignal, `Clock`, `Fx.clear`, `Music.stop`).
- `scripts/e2e.mjs` is the executable spec of the flow. A flow change (new state, new screen, renamed button class) must update it in the same commit.
- Product-promise rules (binding): every balance, coupon and email action is labelled demo/mock; no real business names in coupons; the CTA never navigates; no network requests at runtime.

Consumer search (run before renaming an id, class or state):
```bash
grep -rn "<id-or-class>" src scripts docs --include=*.ts --include=*.css --include=*.mjs --include=*.md
```

Code generation: none.

## Tracker

- Tool: none (take-home). Describe the change in the request; plans are named by date and slug.
- Ticket ID format: n/a

## Git flow

- Base branch for new work: `main` (local repo, no remote yet). Stages 1, 2, 2b and 3 are all merged into `main` (linear history; `stage2/polish-perf` and `stage3/3d-runner` are kept only as history)
- Branch name: `<topic>/<slug>` from `main`; merge back (fast-forward when possible) once `npm run check` is green. Tag `stage1-v1` stays untouched
- Commit message: imperative subject, optional body with the why; end with the `Co-Authored-By` line when an agent wrote the code
- PR: none (no remote). If a remote is added, one PR per change targeting `main`
- Keeping current: n/a (single author)
- QA / staging: none. "Ship to QA" means: `npm run build`, serve `dist/` statically and run `node scripts/e2e.mjs http://localhost:4173/ 320 568`
- Release: `npm run package` → `release/passport-quest-stage1.zip` (the ZIP name and the `RUN.txt` label in `scripts/package.mjs` still say Stage 1; update them when packaging a later stage); tag the delivered commit (`stage1-v1`, `stage2-v1`, `stage3-v1`…). Never move an existing tag.
- Never:
  - Add a runtime network request, CDN, analytics or font link: the brief forbids external requests.
  - Add an npm runtime dependency without asking: the bundle is deliberately dependency-free.
  - Use emoji as game art, or a real brand/business name in coupons.
  - Edit `docs/DEVELOPMENT_NOTE.md` section "AI correction / rejected output — written by developer": the developer writes it.
  - Re-tag or force-push a delivered tag.
- Pre-push check: `npm run build && node scripts/e2e.mjs` must be green.

## Checks per repo

### `.`
- Typecheck: `npx tsc --noEmit`
- Lint: none configured (TypeScript `strict`, `noUnusedLocals`, `noUnusedParameters` act as the lint gate)
- Targeted test: none (no unit runner); the gate is the e2e script below
- Full suite (what the delivery requires): `npx tsc --noEmit && npm run build && node scripts/e2e.mjs http://localhost:5173/ 320 568 && node scripts/e2e.mjs http://localhost:5173/ 390 844 && MODE=2d node scripts/e2e.mjs http://localhost:5173/ 320 568` (dev server running), or `npm run check` against a static preview of `dist/`
- Build: `npm run build`
- Check every task must ship: an assertion in `scripts/e2e.mjs` for behaviour (mode-aware when it concerns the runner), and a screenshot review (`node scripts/playshot.mjs <dir>`, `node scripts/artcheck.mjs <png>` for SVG art, `node scripts/artcheck3d.mjs <png>` for 3D models) for anything visual
- Commands not to run without asking: `npm run package` when `release/` already holds a delivered ZIP (overwrites it)

## Running locally

| Repo | Start command | Health check |
|---|---|---|
| `.` (dev) | `source ~/.nvm/nvm.sh && nvm use && npm run dev` | `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/` |
| `.` (prod build) | `npm run build && npm run serve:dist` | `curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/` |

- Prerequisites: nvm (Node 22), Google Chrome installed at `/Applications/Google Chrome.app` for the headless scripts (`puppeteer-core`, dev-only).
- Data: none (no backend, no storage). `?seed=N` makes spawns deterministic.
- Auth: none.
- Runtime check: open the URL in Chrome DevTools device mode (320×568 and 390×844) or use the Claude in Chrome tools; `window.passportQuest.debug` exposes state for scripts. Headless Chrome renders WebGL with SwiftShader (software): the 3D runner works there but its frame cost is an upper bound. `gallery.html` (dev server only) shows every 3D model.

## Escalate also when

- A change would weaken the Scrambly loop (discover → play & progress → redeem) or remove the fox guide: both are graded requirements of the take-home.
- Adding audio files, images or fonts: they must be bundled, licensed and credited in the README and development note.
- Any copy that could read as a real-earnings or real-reward claim.
- Changing difficulty tuning (`level` in `destinations.ts`) without a playtest note.

## Plans folder

`plans/`
