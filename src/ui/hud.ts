import type { DestinationDef, ItemId, ThemeDef } from '../data/destinations';
import { DESTINATIONS } from '../data/destinations';
import { ITEM_ART, TICKET_SVG } from '../art/items';
import { $, centerOf } from '../lib/dom';

/**
 * In-game HUD: restart, destination label, demo-points wallet, the passport
 * progress bar, and one chip per item of the chosen theme (silhouette until
 * first caught, then a running count). The coupon's signature item shows
 * "n/need" and turns orange when the coupon unlocks.
 */
export class Hud {
  private pointsEl!: HTMLElement;
  private chipsEl!: HTMLElement;
  private barFill!: HTMLElement;
  private barText!: HTMLElement;

  constructor(private root: HTMLElement) {}

  mount(onRestart: () => void, signal: AbortSignal) {
    this.root.innerHTML = `
      <div class="hud-top">
        <button class="btn btn--icon btn--restart" type="button" aria-label="Restart game" title="Restart">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.3 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M5 3v6h6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Restart</span>
        </button>
        <div class="hud-place">
          <strong class="hud-place-name"></strong>
          <span class="hud-place-country"></span>
        </div>
        <div class="wallet" aria-live="polite">
          <span class="wallet-coin" aria-hidden="true"></span>
          <span class="wallet-points">0</span>
          <span class="wallet-label">demo pts</span>
        </div>
      </div>
      <div class="hud-row2">
        <div class="passport-bar" role="progressbar" aria-label="Passport progress">
          <div class="passport-bar-fill"></div>
          <span class="passport-bar-text">0/0</span>
        </div>
        <div class="chips"></div>
      </div>
      <div class="hud-toast" role="status"></div>
      <div class="hud-trip" aria-label="Trip progress"></div>`;
    this.root.hidden = false;
    this.pointsEl = $('.wallet-points', this.root);
    this.chipsEl = $('.chips', this.root);
    this.barFill = $('.passport-bar-fill', this.root);
    this.barText = $('.passport-bar-text', this.root);
    $('.btn--restart', this.root).addEventListener('click', onRestart, { signal });
  }

  /** Shows the destination header and trip dots; chips are set by setTheme once the theme is chosen. */
  setDestination(dest: DestinationDef, completedIds: string[]) {
    $('.hud-place-name', this.root).textContent = dest.shortName;
    $('.hud-place-country', this.root).textContent = dest.country;
    this.chipsEl.innerHTML = '';
    this.setProgress(0, dest.level.goal);
    $('.hud-trip', this.root).innerHTML = DESTINATIONS.map((d) => {
      const state = completedIds.includes(d.id) ? 'done' : d.id === dest.id ? 'active' : 'locked';
      return `<span class="trip-dot trip-dot--${state}" title="${d.name}"></span>`;
    }).join('<span class="trip-line"></span>');
  }

  setTheme(theme: ThemeDef) {
    this.chipsEl.innerHTML = theme.items.map((it) => {
      const isCoupon = it.id === theme.coupon.itemId;
      return `
      <div class="chip ${isCoupon ? 'chip--coupon' : ''}" data-id="${it.id}" title="${it.label}${isCoupon ? ` · ${theme.coupon.need} unlock: ${theme.coupon.title}` : ''}">
        <svg viewBox="-28 -28 56 56" class="chip-sil">${ITEM_ART[it.id]({ silhouette: true })}</svg>
        <svg viewBox="-28 -28 56 56" class="chip-art">${ITEM_ART[it.id]()}</svg>
        <span class="chip-count">${isCoupon ? `0/${theme.coupon.need}` : '0'}</span>
        ${isCoupon ? `<span class="chip-ticket">${TICKET_SVG}</span>` : ''}
      </div>`;
    }).join('');
  }

  setCount(id: ItemId, count: number, couponNeed?: number, couponDone = false) {
    const chip = this.root.querySelector<HTMLElement>(`.chip[data-id="${id}"]`);
    if (!chip) return;
    chip.classList.add('found');
    chip.classList.toggle('chip--done', couponDone);
    $('.chip-count', chip).textContent = couponNeed ? `${Math.min(count, couponNeed)}/${couponNeed}` : String(count);
    chip.classList.remove('bump');
    void chip.offsetWidth;
    chip.classList.add('bump');
  }

  setProgress(value: number, goal: number, flash: 'up' | 'down' | null = null) {
    this.barFill.style.width = `${(value / goal) * 100}%`;
    this.barText.textContent = `${value}/${goal}`;
    const bar = $('.passport-bar', this.root);
    bar.classList.remove('flash-up', 'flash-down');
    if (flash) { void bar.offsetWidth; bar.classList.add(`flash-${flash}`); }
  }

  setPoints(points: number, animate = false) {
    this.pointsEl.textContent = String(points);
    if (animate) {
      const w = $('.wallet', this.root);
      w.classList.remove('pulse');
      void w.offsetWidth;
      w.classList.add('pulse');
    }
  }

  /** Big short-lived label in the middle of the screen ("Faster!", "Coupon unlocked!"). */
  toast(text: string, cls = '') {
    const el = $('.hud-toast', this.root);
    el.textContent = text;
    el.className = `hud-toast ${cls}`;
    void el.offsetWidth;
    el.classList.add('show');
  }

  walletPoint() { return centerOf($('.wallet-coin', this.root).getBoundingClientRect()); }
  chipPoint(id: ItemId) {
    const el = this.root.querySelector(`.chip[data-id="${id}"]`);
    return el ? centerOf(el.getBoundingClientRect()) : this.walletPoint();
  }
  barPoint() { return centerOf($('.passport-bar', this.root).getBoundingClientRect()); }

  unmount() { this.root.innerHTML = ''; this.root.hidden = true; }
}
