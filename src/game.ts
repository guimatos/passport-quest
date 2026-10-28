import { DESTINATIONS, POINTS_PER_ITEM, COMPLETION_BONUS, type DestinationDef, type ItemId } from './data/destinations';
import { ITEM_ART } from './art/items';
import { SCENE_ART } from './art/scenes';
import { Clock, easeInOutCubic, easeOutBack } from './lib/clock';
import { Loop } from './lib/loop';
import { $ } from './lib/dom';
import { createRandom, seedFromUrl } from './lib/random';
import { Runner, type Entity } from './scene/runner';
import { Fx } from './fx/fx';
import { Hud } from './ui/hud';
import { renderStart, renderRedeem, renderTravel, renderFinal, showCtaConfirm, clearScreen } from './ui/screens';

export type GameState = 'start' | 'playing' | 'redeem' | 'travel' | 'final';

const HINT_DELAY = 4000;
const DISCOVER_LINES: Record<ItemId, string> = {
  coconut: 'A coconut! Refreshing.',
  football: 'Goooal! A football.',
  seashell: 'A seashell! Pretty.',
  azulejo: 'An azulejo tile!',
  tram: 'A tiny tram. Ding ding!',
  nata: 'Pastel de nata. Yum!',
};

/**
 * Central game controller: explicit states, all mutable state in one place,
 * and a single reset() path that tears down listeners, timers, effects and
 * DOM before rebuilding the initial screen.
 */
export class Game {
  state: GameState = 'start';
  private destIndex = 0;
  private points = 0;
  private progress = 0;
  private discovered = new Set<ItemId>();
  private completedDests: string[] = [];
  private speedToastShown = false;

  private ac = new AbortController();
  private clock = new Clock();
  private loop: Loop;
  private fx: Fx;
  private hud: Hud;
  private runner: Runner | null = null;
  private random = createRandom(1);
  private hintTimer: number | undefined;
  private bubbleTimer: number | undefined;

  private readonly app = $('#app');
  private readonly stage = $('#stage');
  private readonly sceneRoot = $('#scene-root');
  private readonly overlay = $('#overlay');
  private readonly rotate = $('#rotate');

  constructor() {
    this.loop = new Loop((dt) => this.frame(dt), (paused) => this.app.classList.toggle('paused', paused));
    this.fx = new Fx($('#fx'), this.clock);
    this.hud = new Hud($('#hud'));
  }

  get destination(): DestinationDef { return DESTINATIONS[this.destIndex]; }

  /** Boot (first run) and restart share exactly the same path. */
  reset() {
    this.teardown();
    this.init();
  }

  private teardown() {
    this.ac.abort();
    this.loop.stop();
    this.loop.clearPauses();
    this.clock.clearAll();
    this.hintTimer = this.bubbleTimer = undefined;
    this.fx.clear();
    this.runner?.destroy();
    this.runner = null;
    this.hud.unmount();
    clearScreen(this.overlay);
    this.app.classList.remove('paused');
    this.app.dataset.state = '';
    this.state = 'start';
    this.destIndex = 0;
    this.points = 0;
    this.progress = 0;
    this.discovered = new Set();
    this.completedDests = [];
    this.speedToastShown = false;
  }

  private init() {
    this.ac = new AbortController();
    const { signal } = this.ac;
    this.random = createRandom(seedFromUrl());

    document.addEventListener('visibilitychange', () => {
      this.loop.setPaused('hidden', document.visibilityState === 'hidden');
    }, { signal });
    window.addEventListener('resize', () => this.checkOrientation(), { signal });
    window.addEventListener('orientationchange', () => this.checkOrientation(), { signal });

    this.loop.setPaused('hidden', document.visibilityState === 'hidden');
    this.checkOrientation();
    this.loop.start();
    this.enterStart();
  }

  private frame(dt: number) {
    this.clock.tick(dt);
    if (this.runner && (this.state === 'playing' || this.state === 'redeem')) {
      this.runner.update(dt);
      if (this.state === 'playing' && !this.speedToastShown && this.runner.progressRamp > 0.45) {
        this.speedToastShown = true;
        this.hud.toast('Faster!', 'toast--speed');
      }
    }
  }

  // ---------- states ----------

  private setState(s: GameState) {
    this.state = s;
    this.app.dataset.state = s;
  }

  private enterStart() {
    this.setState('start');
    this.app.style.setProperty('--scene-bg', '#201338');
    renderStart(this.overlay, () => this.enterPlaying(0), this.ac.signal);
  }

  private enterPlaying(index: number) {
    this.destIndex = index;
    this.progress = 0;
    this.discovered = new Set();
    this.speedToastShown = false;
    this.runner?.destroy();
    clearScreen(this.overlay);
    this.setState('playing');

    const dest = this.destination;
    this.app.style.setProperty('--scene-bg', SCENE_ART[dest.id].bg);
    this.runner = new Runner(dest, {
      onCollect: (e, screen) => this.collect(e, screen),
      onHit: (e, screen) => this.hit(e, screen),
    }, this.random, this.ac.signal, this.stage);
    this.sceneRoot.appendChild(this.runner.el);

    if (!$('#hud').childElementCount) this.hud.mount(() => this.reset(), this.ac.signal);
    this.hud.setDestination(dest, this.completedDests);
    this.hud.setPoints(this.points);
    this.say(index === 0 ? 'Move up and down to catch items!' : `${dest.name}! Faster this time.`, 2800);
    this.armHint();
  }

  private collect(e: Entity, screen: { x: number; y: number }) {
    if (this.state !== 'playing') return;
    const id = e.id as ItemId;
    const dest = this.destination;
    const first = !this.discovered.has(id);
    this.discovered.add(id);
    this.progress = Math.min(dest.level.goal, this.progress + 1);
    this.armHint();

    this.fx.burst(screen.x, screen.y, dest.accent, 8);
    this.fx.floatText(screen.x, screen.y - 14, `+${POINTS_PER_ITEM}`);
    const to = first ? this.hud.objectivePoint(id) : this.hud.barPoint();
    this.fx.fly(screen, to, ITEM_ART[id](), () => {
      if (first) this.hud.markDiscovered(id);
      this.hud.setProgress(this.progress, dest.level.goal, 'up');
      this.addPoints(POINTS_PER_ITEM);
    });
    if (first) this.say(DISCOVER_LINES[id], 1600);

    if (this.progress >= dest.level.goal) this.completeDestination();
  }

  private hit(_e: Entity, screen: { x: number; y: number }) {
    if (this.state !== 'playing') return;
    const dest = this.destination;
    this.progress = Math.max(0, this.progress - dest.level.penalty);
    this.hud.setProgress(this.progress, dest.level.goal, 'down');
    this.fx.floatText(screen.x, screen.y - 14, 'Ouch!', 'float-text--bad');
    this.fx.burst(screen.x, screen.y, '#201338', 6);
    this.say('Ouch! Watch out.', 1000);
  }

  private addPoints(n: number) {
    this.points += n;
    this.hud.setPoints(this.points, true);
  }

  private completeDestination() {
    if (this.state !== 'playing') return; // double-completion guard
    this.setState('redeem');
    this.clock.cancel(this.hintTimer);
    const dest = this.destination;
    this.completedDests.push(dest.id);
    this.runner?.finish();
    this.runner?.say(`${dest.shortName} complete!`);
    this.fx.confetti();
    this.hud.setDestination(dest, this.completedDests);
    dest.items.forEach((it) => this.hud.markDiscovered(it.id));
    this.hud.setProgress(dest.level.goal, dest.level.goal);
    const isLast = this.destIndex === DESTINATIONS.length - 1;
    this.clock.after(900, () => {
      this.addPoints(COMPLETION_BONUS);
      renderRedeem(this.overlay, dest, this.points, isLast, () => {
        if (this.state !== 'redeem') return; // double-tap guard
        if (isLast) this.enterFinal(); else this.enterTravel();
      }, this.ac.signal);
    });
  }

  private enterTravel() {
    this.setState('travel');
    const from = this.destination;
    const to = DESTINATIONS[this.destIndex + 1];
    this.runner?.destroy();
    this.runner = null;
    this.app.style.setProperty('--scene-bg', '#7845D8');
    const parts = renderTravel(this.overlay, from, to);

    // Quadratic arc in map coordinates (320x240 viewBox) matched to the dashed route.
    const P0 = { x: 50, y: 190 }, P1 = { x: 160, y: 20 }, P2 = { x: 270, y: 90 };
    const mapEl = $('.map-svg', this.overlay);
    this.clock.tween(2200, (t) => {
      const e = easeInOutCubic(t);
      const x = (1 - e) ** 2 * P0.x + 2 * (1 - e) * e * P1.x + e ** 2 * P2.x;
      const y = (1 - e) ** 2 * P0.y + 2 * (1 - e) * e * P1.y + e ** 2 * P2.y;
      const dx = 2 * (1 - e) * (P1.x - P0.x) + 2 * e * (P2.x - P1.x);
      const dy = 2 * (1 - e) * (P1.y - P0.y) + 2 * e * (P2.y - P1.y);
      const s = mapEl.getBoundingClientRect().width / 320;
      parts.plane.style.transform = `translate(${x * s}px, ${y * s}px) rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`;
    }, () => {
      parts.status.textContent = 'Landed!';
      parts.unlock.classList.add('show');
      this.overlay.querySelector('.map-dest')?.classList.add('unlocked');
      this.clock.tween(500, (t) => { parts.unlock.style.transform = `scale(${easeOutBack(t)})`; });
      this.clock.after(1500, () => this.enterPlaying(this.destIndex + 1));
    });
  }

  private enterFinal() {
    this.setState('final');
    this.runner?.destroy();
    this.runner = null;
    this.hud.unmount();
    this.app.style.setProperty('--scene-bg', '#201338');
    renderFinal(this.overlay, this.points, () => this.onCta(), () => this.reset(), this.ac.signal);
    this.fx.confetti(36);
  }

  private onCta() {
    console.log('[Passport Quest] CTA clicked — demo only (no navigation)');
    showCtaConfirm(this.overlay);
  }

  // ---------- helpers ----------

  private say(text: string, ms: number) {
    if (!this.runner || this.state !== 'playing') return;
    this.clock.cancel(this.bubbleTimer);
    this.runner.say(text);
    this.bubbleTimer = this.clock.after(ms, () => this.runner?.say(null));
  }

  /** After HINT_DELAY without a collection, show the move-up-and-down nudge. */
  private armHint() {
    this.clock.cancel(this.hintTimer);
    this.runner?.setHint(false);
    this.hintTimer = this.clock.after(HINT_DELAY, () => {
      if (this.state !== 'playing' || !this.runner) return;
      this.runner.setHint(true);
      this.say('Move up and down to catch items!', 2000);
    });
  }

  private checkOrientation() {
    const landscape = window.innerWidth > window.innerHeight;
    const tooShort = window.innerHeight < 480;
    const block = landscape && tooShort;
    this.rotate.hidden = !block;
    this.loop.setPaused('rotate', block);
  }

  /** Test/debug hooks (used by scripts/e2e.mjs). */
  get debug() {
    return {
      state: this.state,
      points: this.points,
      progress: this.progress,
      entities: this.runner?.liveEntities() ?? [],
      fox: this.runner?.foxPosition ?? null,
      toScreen: (x: number, y: number) => this.runner?.toScreen(x, y) ?? null,
    };
  }
}
