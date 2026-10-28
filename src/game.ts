import { DESTINATIONS, POINTS_PER_ITEM, COMPLETION_BONUS, COUPON_BONUS, themeOf, type DestinationDef, type ItemId, type ThemeDef, type ThemeId } from './data/destinations';
import { ITEM_ART } from './art/items';
import { SCENE_ART } from './art/scenes';
import { Clock, easeInOutCubic, easeOutBack } from './lib/clock';
import { Loop } from './lib/loop';
import { $ } from './lib/dom';
import { createRandom, seedFromUrl } from './lib/random';
import { Runner, type Entity } from './scene/runner';
import { Fx } from './fx/fx';
import { Hud } from './ui/hud';
import { renderStart, renderRedeem, renderJournal, renderIntro, markIntroDestination, renderThemeCard, renderFinal, showCtaConfirm, clearScreen, type Counts, type Chosen } from './ui/screens';
import { Music } from './audio/music';
import { MAP_POINTS, MAP_W } from './art/map';

export type GameState = 'start' | 'intro' | 'playing' | 'redeem' | 'journal' | 'final';

const HINT_DELAY = 4000;
const DISCOVER_LINES: Record<ItemId, string> = {
  coconut: 'A coconut! Refreshing.',
  acai: 'Açaí bowl! Energy.',
  brigadeiro: 'Brigadeiro! Sweet.',
  bondinho: 'The cable car! Up we go.',
  violao: 'A guitar! Bossa nova time.',
  football: 'Goooal! A football.',
  pandeiro: 'A pandeiro! Feel the beat.',
  mask: 'A Carnival mask!',
  apito: 'A samba whistle! Tweet!',
  nata: 'Pastel de nata. Yum!',
  francesinha: 'A francesinha! Hearty.',
  sardine: 'A grilled sardine!',
  azulejo: 'An azulejo tile!',
  tram: 'A tiny tram. Ding ding!',
  rabelo: 'A rabelo boat!',
  martelinho: 'A squeaky hammer!',
  balloon: 'A paper balloon!',
  manjerico: 'A basil pot! Sweet verse.',
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
  private counts: Counts = {};
  private allCountsStore: Counts = {};
  private chosen: Chosen = {};
  private completedDests: string[] = [];
  private coupons: string[] = [];
  private speedToastShown = false;

  private ac = new AbortController();
  private clock = new Clock();
  private loop: Loop;
  private fx: Fx;
  private hud: Hud;
  private music = new Music();
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
  get theme(): ThemeDef { return themeOf(this.destination, this.chosen[this.destination.id] ?? this.destination.themes[0].id); }

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
    this.music.stop();
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
    this.counts = {};
    this.allCountsStore = {};
    this.chosen = {};
    this.completedDests = [];
    this.coupons = [];
    this.speedToastShown = false;
    this.flying = false;
  }

  private init() {
    this.ac = new AbortController();
    const { signal } = this.ac;
    this.random = createRandom(seedFromUrl());

    document.addEventListener('visibilitychange', () => {
      const hidden = document.visibilityState === 'hidden';
      this.loop.setPaused('hidden', hidden);
      this.music.setHidden(hidden);
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
    if (this.runner && (this.state === 'playing' || this.state === 'redeem' || this.state === 'journal')) {
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
    renderStart(this.overlay, () => { this.music.unlock(); this.music.play('menu'); this.enterMap(); }, this.ac.signal);
  }

  private mountHud() {
    if (!$('#hud').childElementCount) {
      this.hud.mount(() => this.reset(), () => { this.music.setMuted(!this.music.muted); return this.music.muted; }, this.music.muted, this.ac.signal);
    }
  }

  /**
   * Map hub: shows the journey map and asks where to go. When only one
   * destination remains it is selected automatically. Picking a destination
   * flies the plane there and shows that city's theme card.
   */
  private enterMap() {
    this.allCountsStore = { ...this.allCountsStore, ...this.counts };
    this.runner?.destroy();
    this.runner = null;
    this.setState('intro');
    this.app.style.setProperty('--scene-bg', '#7845D8');
    this.mountHud();
    this.hud.setPoints(this.points);
    this.music.play('menu');

    const completed = this.completedDests.map((id) => DESTINATIONS.findIndex((d) => d.id === id));
    const remaining = DESTINATIONS.map((_, i) => i).filter((i) => !completed.includes(i));
    const parts = renderIntro(this.overlay, completed, (i) => this.flyTo(parts, i, completed), this.ac.signal);
    if (remaining.length === 1) this.clock.after(900, () => this.flyTo(parts, remaining[0], completed));
  }

  private flying = false;

  private flyTo(parts: ReturnType<typeof renderIntro>, index: number, completed: number[]) {
    if (this.state !== 'intro' || this.flying) return; // double-tap guard
    this.flying = true;
    this.destIndex = index;
    const dest = this.destination;
    this.hud.setDestination(dest, this.completedDests);
    markIntroDestination(parts, index);

    // Plane flight along a quadratic curve in map coordinates: from the previous
    // city if there is one, otherwise from off-screen.
    const prev = completed.length ? completed[completed.length - 1] : -1;
    const P2 = index === 0 ? MAP_POINTS.rio : MAP_POINTS.porto;
    const P0 = prev >= 0 ? (prev === 0 ? MAP_POINTS.rio : MAP_POINTS.porto) : (index === 0 ? MAP_POINTS.entry : MAP_POINTS.entryRight);
    const P1 = prev >= 0 ? MAP_POINTS.routeControl : (index === 0 ? MAP_POINTS.entryControl : MAP_POINTS.entryRightControl);
    const duration = prev >= 0 ? 2200 : 1500;
    this.clock.tween(duration, (t) => {
      const e = easeInOutCubic(t);
      const x = (1 - e) ** 2 * P0.x + 2 * (1 - e) * e * P1.x + e ** 2 * P2.x;
      const y = (1 - e) ** 2 * P0.y + 2 * (1 - e) * e * P1.y + e ** 2 * P2.y;
      const dx = 2 * (1 - e) * (P1.x - P0.x) + 2 * e * (P2.x - P1.x);
      const dy = 2 * (1 - e) * (P1.y - P0.y) + 2 * e * (P2.y - P1.y);
      const s = parts.map.getBoundingClientRect().width / MAP_W;
      parts.plane.style.transform = `translate(${x * s}px, ${y * s}px) rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`;
    }, () => {
      this.flying = false;
      parts.plane.classList.add('landed');
      parts.map.querySelector('.map-marker--active')?.classList.add('arrived');
      renderThemeCard(parts, dest, (theme) => this.startLevel(index, theme), this.ac.signal);
      parts.card.classList.add('show');
      this.clock.tween(500, (t) => { parts.card.style.transform = `translateY(${(1 - easeOutBack(t)) * 60}px)`; parts.card.style.opacity = String(Math.min(1, t * 2)); });
    });
  }

  private startLevel(index: number, theme: ThemeId) {
    if (this.state !== 'intro') return; // double-tap guard
    this.chosen[this.destination.id] = theme;
    this.enterPlaying(index);
  }

  private enterPlaying(index: number) {
    this.destIndex = index;
    this.progress = 0;
    this.counts = {};
    this.speedToastShown = false;
    this.runner?.destroy();
    clearScreen(this.overlay);
    this.setState('playing');

    const dest = this.destination;
    const theme = this.theme;
    this.app.style.setProperty('--scene-bg', SCENE_ART[dest.id].variants[theme.id]?.bg ?? SCENE_ART[dest.id].bg);
    this.runner = new Runner(dest, theme, {
      onCollect: (e, screen) => this.collect(e, screen),
      onHit: (e, screen) => this.hit(e, screen),
    }, this.random, this.ac.signal, this.stage);
    this.sceneRoot.appendChild(this.runner.el);

    this.mountHud();
    this.hud.setDestination(dest, this.completedDests);
    this.hud.setTheme(theme);
    this.hud.setPoints(this.points);
    this.music.play(dest.id === 'brazil' ? 'rio' : 'porto');
    const couponItem = theme.items.find((i) => i.id === theme.coupon.itemId)!;
    this.say(this.completedDests.length === 0 ? 'Move up and down to guide Capi!' : `${dest.name}! Faster this time.`, 2400);
    this.clock.after(2600, () => this.say(`Catch ${theme.coupon.need} ${couponItem.label.toLowerCase()}s for a coupon!`, 2600));
    this.armHint();
  }

  private collect(e: Entity, screen: { x: number; y: number }) {
    if (this.state !== 'playing') return;
    const id = e.id as ItemId;
    const dest = this.destination;
    const theme = this.theme;
    const first = !this.counts[id];
    const count = (this.counts[id] = (this.counts[id] ?? 0) + 1);
    this.progress = Math.min(dest.level.goal, this.progress + 1);
    this.armHint();

    const isCouponItem = id === theme.coupon.itemId;
    const couponJustUnlocked = isCouponItem && count === theme.coupon.need;

    this.fx.burst(screen.x, screen.y, dest.accent, 8);
    this.fx.floatText(screen.x, screen.y - 14, `+${POINTS_PER_ITEM}`);
    const to = first || isCouponItem ? this.hud.chipPoint(id) : this.hud.barPoint();
    this.fx.fly(screen, to, ITEM_ART[id](), () => {
      this.hud.setCount(id, count, isCouponItem ? theme.coupon.need : undefined, isCouponItem && count >= theme.coupon.need);
      this.hud.setProgress(this.progress, dest.level.goal, 'up');
      this.addPoints(POINTS_PER_ITEM);
    });
    if (couponJustUnlocked) {
      this.coupons.push(`${dest.id}:${theme.id}`);
      this.addPoints(COUPON_BONUS);
      this.hud.toast('Coupon unlocked!', 'toast--coupon');
      this.fx.confetti(18);
      this.say(`${theme.coupon.title} — yours!`, 2000);
    } else if (first) {
      this.say(DISCOVER_LINES[id], 1600);
    }

    if (this.progress >= dest.level.goal) this.completeDestination();
  }

  private hit(_e: Entity, screen: { x: number; y: number }) {
    if (this.state !== 'playing') return;
    const dest = this.destination;
    this.progress = Math.max(0, this.progress - dest.level.penalty);
    this.hud.setProgress(this.progress, dest.level.goal, 'down');
    this.fx.floatText(screen.x, screen.y - 14, 'Ouch!', 'float-text--bad');
    this.fx.burst(screen.x, screen.y, '#201338', 6);
    this.say('Ouch! Watch out, Capi.', 1000, 'think');
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
    const theme = this.theme;
    this.completedDests.push(dest.id);
    this.runner?.finish();
    this.say(`${dest.shortName} complete! Reward time.`, 3000, 'cheer');
    this.hud.toast('Passport stamped!', 'toast--done');
    this.music.jingle();
    this.fx.confetti();
    this.hud.setDestination(dest, this.completedDests);
    this.hud.setTheme(theme);
    const couponUnlocked = this.coupons.includes(`${dest.id}:${theme.id}`);
    for (const it of theme.items) {
      const isCoupon = it.id === theme.coupon.itemId;
      if (this.counts[it.id]) this.hud.setCount(it.id, this.counts[it.id]!, isCoupon ? theme.coupon.need : undefined, isCoupon && couponUnlocked);
    }
    this.hud.setProgress(dest.level.goal, dest.level.goal);
    const isLast = this.destIndex === DESTINATIONS.length - 1;
    this.clock.after(900, () => {
      this.addPoints(COMPLETION_BONUS);
      renderRedeem(this.overlay, dest, theme, this.points, this.counts, couponUnlocked, () => {
        if (this.state !== 'redeem') return; // double-tap guard
        this.setState('journal');
        renderJournal(this.overlay, dest, theme, this.counts, isLast, () => {
          if (this.state !== 'journal') return;
          if (isLast) this.enterFinal(); else this.enterMap();
        }, this.ac.signal);
      }, this.ac.signal);
    });
  }

  private enterFinal() {
    this.setState('final');
    this.runner?.destroy();
    this.runner = null;
    this.hud.unmount();
    this.app.style.setProperty('--scene-bg', '#201338');
    const allCounts: Counts = { ...this.allCountsStore, ...this.counts };
    this.music.play('menu');
    renderFinal(this.overlay, this.points, allCounts, this.chosen, this.coupons, {
      onCta: () => this.onCta(),
      onRestart: () => this.reset(),
      onSendCoupons: (email) => this.onSendCoupons(email),
    }, this.ac.signal);
    this.fx.confetti(36);
  }

  /** Mock only: nothing leaves the page. Logged so reviewers can see the call. */
  private onSendCoupons(email: string) {
    const titles = DESTINATIONS.flatMap((d) => d.themes.filter((t) => this.coupons.includes(`${d.id}:${t.id}`)).map((t) => t.coupon.title));
    console.log('[Passport Quest] mock: would send coupons', titles, 'to', email, '(demo — no request made)');
  }

  private onCta() {
    console.log('[Passport Quest] CTA clicked — demo only (no navigation)');
    showCtaConfirm(this.overlay);
  }

  // ---------- helpers ----------

  private say(text: string, ms: number, mood: 'happy' | 'cheer' | 'think' = 'happy') {
    if (this.state !== 'playing' && this.state !== 'redeem') return;
    this.clock.cancel(this.bubbleTimer);
    this.hud.say(text, mood);
    this.bubbleTimer = this.clock.after(ms, () => this.hud.hush());
  }

  /** After HINT_DELAY without a collection, show the move-up-and-down nudge. */
  private armHint() {
    this.clock.cancel(this.hintTimer);
    this.runner?.setHint(false);
    this.hintTimer = this.clock.after(HINT_DELAY, () => {
      if (this.state !== 'playing' || !this.runner) return;
      this.runner.setHint(true);
      this.say('Move up and down to catch items!', 2000, 'think');
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
      counts: this.counts,
      chosen: this.chosen,
      coupons: this.coupons,
      entities: this.runner?.liveEntities() ?? [],
      fox: this.runner?.foxPosition ?? null,
      toScreen: (x: number, y: number) => this.runner?.toScreen(x, y) ?? null,
    };
  }
}
