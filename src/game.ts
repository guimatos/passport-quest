import { DESTINATIONS, POINTS_PER_ITEM, COMPLETION_BONUS, type DestinationDef, type ItemId } from './data/destinations';
import { ITEM_ART } from './art/items';
import { SCENE_ART } from './art/scenes';
import { Clock, easeInOutCubic, easeOutBack } from './lib/clock';
import { Loop } from './lib/loop';
import { $, centerOf } from './lib/dom';
import { buildScene, type Scene } from './scene/scene';
import { Fx } from './fx/fx';
import { Hud } from './ui/hud';
import { renderStart, renderRedeem, renderTravel, renderFinal, showCtaConfirm, clearScreen } from './ui/screens';

export type GameState = 'start' | 'playing' | 'redeem' | 'travel' | 'final';

const HINT_DELAY = 4000;
const FOX_LINES: Record<ItemId, string> = {
  coconut: 'A coconut! Refreshing find.',
  football: 'Goooal! Nice spot.',
  seashell: 'A seashell. You have sharp eyes!',
  azulejo: 'An azulejo tile. Beautiful!',
  tram: 'A tiny tram. Ding ding!',
  nata: 'Pastel de nata. Delicious!',
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
  private collected = new Set<ItemId>();
  private completedDests: string[] = [];
  private completing = false;

  private ac = new AbortController();
  private clock = new Clock();
  private loop: Loop;
  private fx: Fx;
  private hud: Hud;
  private scene: Scene | null = null;
  private hintTimer: number | undefined;
  private bubbleTimer: number | undefined;
  private lastPointer: { x: number; y: number } | null = null;

  private readonly app = $('#app');
  private readonly sceneRoot = $('#scene-root');
  private readonly overlay = $('#overlay');
  private readonly rotate = $('#rotate');

  constructor() {
    this.loop = new Loop((dt) => this.clock.tick(dt), (paused) => this.app.classList.toggle('paused', paused));
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
    this.scene?.destroy();
    this.scene = null;
    this.hud.unmount();
    clearScreen(this.overlay);
    this.app.classList.remove('paused');
    this.app.dataset.state = '';
    this.state = 'start';
    this.destIndex = 0;
    this.points = 0;
    this.collected = new Set();
    this.completedDests = [];
    this.completing = false;
    this.lastPointer = null;
  }

  private init() {
    this.ac = new AbortController();
    const { signal } = this.ac;

    document.addEventListener('visibilitychange', () => {
      this.loop.setPaused('hidden', document.visibilityState === 'hidden');
    }, { signal });
    window.addEventListener('blur', () => { /* keep running on blur; only hidden pauses */ }, { signal });
    window.addEventListener('resize', () => this.checkOrientation(), { signal });
    window.addEventListener('orientationchange', () => this.checkOrientation(), { signal });
    this.app.addEventListener('pointerdown', (ev) => { this.lastPointer = { x: ev.clientX, y: ev.clientY }; }, { signal, passive: true });
    // Pointer leaving / cancelled: nothing is "held", but clear the tracking point.
    this.app.addEventListener('pointercancel', () => { this.lastPointer = null; }, { signal });

    this.loop.setPaused('hidden', document.visibilityState === 'hidden');
    this.checkOrientation();
    this.loop.start();
    this.enterStart();
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
    this.collected = new Set();
    this.completing = false;
    this.scene?.destroy();
    clearScreen(this.overlay);
    this.setState('playing');

    const dest = this.destination;
    this.app.style.setProperty('--scene-bg', SCENE_ART[dest.id].bg);
    this.scene = buildScene(dest, {
      onItem: (id, el, ev) => this.collect(id, el, ev),
      onDecoy: (_id, el) => this.shakeDecoy(el),
    }, this.ac.signal);
    this.sceneRoot.appendChild(this.scene.el);

    if (!$('#hud').childElementCount) this.hud.mount(() => this.reset(), this.ac.signal);
    this.hud.setDestination(dest, this.completedDests);
    this.hud.setPoints(this.points);
    this.say(index === 0 ? `Welcome to ${dest.name}! Find 3 hidden items.` : `Welcome to ${dest.name}! 3 more to find.`, 2600);
    this.armHint();
  }

  private collect(id: ItemId, el: SVGGElement, ev: PointerEvent) {
    if (this.state !== 'playing' || this.collected.has(id) || this.completing) return;
    this.collected.add(id);
    this.scene!.markCollected(id);
    this.clock.cancel(this.hintTimer);

    const from = centerOf(el.getBoundingClientRect());
    const to = this.hud.objectivePoint(id);
    this.fx.burst(ev.clientX, ev.clientY, this.destination.accent);
    this.fx.floatText(from.x, from.y - 10, `+${POINTS_PER_ITEM}`);
    this.fx.fly(from, to, ITEM_ART[id](), () => {
      this.hud.markCollected(id, this.collected.size);
      this.addPoints(POINTS_PER_ITEM);
    });
    this.say(FOX_LINES[id], 1800);

    if (this.collected.size >= this.destination.items.length) {
      this.completing = true; // blocks any further input immediately
      this.clock.after(900, () => this.completeDestination());
    } else {
      this.armHint();
    }
  }

  private addPoints(n: number) {
    this.points += n;
    this.hud.setPoints(this.points, true);
  }

  private shakeDecoy(el: SVGGElement) {
    if (this.state !== 'playing') return;
    el.classList.remove('shake');
    void (el as unknown as HTMLElement).getBoundingClientRect();
    el.classList.add('shake');
    this.say('Not this one!', 1200, 'think');
  }

  private completeDestination() {
    if (this.state !== 'playing') return;
    this.setState('redeem');
    const dest = this.destination;
    this.completedDests.push(dest.id);
    this.addPoints(COMPLETION_BONUS);
    this.fx.confetti();
    this.hud.setDestination(dest, this.completedDests);
    dest.items.forEach((it) => this.hud.markCollected(it.id, dest.items.length));
    this.say(`${dest.name} complete! Reward time.`, 2500, 'cheer');
    const isLast = this.destIndex === DESTINATIONS.length - 1;
    this.clock.after(500, () => {
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
    this.scene?.destroy();
    this.scene = null;
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
      const r = mapEl.getBoundingClientRect();
      const s = r.width / 320;
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
    this.scene?.destroy();
    this.scene = null;
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

  private say(text: string, ms: number, mood: 'happy' | 'cheer' | 'think' = 'happy') {
    if (this.state === 'start' || this.state === 'final') return;
    this.clock.cancel(this.bubbleTimer);
    this.hud.say(text, mood);
    this.bubbleTimer = this.clock.after(ms, () => this.hud.hush());
  }

  /** After HINT_DELAY without a collection, wiggle the nearest uncollected item. */
  private armHint() {
    this.clock.cancel(this.hintTimer);
    this.scene?.setHint(null);
    this.hintTimer = this.clock.after(HINT_DELAY, () => {
      if (this.state !== 'playing' || !this.scene) return;
      const remaining = this.destination.items.filter((it) => !this.collected.has(it.id));
      if (!remaining.length) return;
      let target = remaining[0];
      if (this.lastPointer) {
        const r = this.scene.el.getBoundingClientRect();
        // Convert last pointer to scene units (slice: uniform scale, centered).
        const s = Math.max(r.width / 360, r.height / 720);
        const px = (this.lastPointer.x - r.left - (r.width - 360 * s) / 2) / s;
        const py = (this.lastPointer.y - r.top - (r.height - 720 * s) / 2) / s;
        target = remaining.reduce((a, b) => (Math.hypot(a.x - px, a.y - py) <= Math.hypot(b.x - px, b.y - py) ? a : b));
      }
      this.scene.setHint(target.id);
      this.say('Psst… look closer!', 1600, 'think');
    });
  }

  private checkOrientation() {
    const landscape = window.innerWidth > window.innerHeight;
    const tooShort = window.innerHeight < 480;
    const block = landscape && tooShort;
    this.rotate.hidden = !block;
    this.loop.setPaused('rotate', block);
  }
}
