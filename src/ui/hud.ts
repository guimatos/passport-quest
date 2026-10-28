import type { DestinationDef, ItemId } from '../data/destinations';
import { DESTINATIONS } from '../data/destinations';
import { ITEM_ART } from '../art/items';
import { $, centerOf } from '../lib/dom';

/**
 * In-game HUD: restart, destination label, demo-points wallet, the three
 * item types as silhouettes that fill in when first discovered, and the
 * passport progress bar.
 */
export class Hud {
  private pointsEl!: HTMLElement;
  private objectivesEl!: HTMLElement;
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
      <div class="hud-objectives">
        <div class="objectives"></div>
        <div class="passport-bar" role="progressbar" aria-label="Passport progress">
          <div class="passport-bar-fill"></div>
          <span class="passport-bar-text">0/0</span>
        </div>
      </div>
      <div class="hud-toast" role="status"></div>
      <div class="hud-trip" aria-label="Trip progress"></div>`;
    this.root.hidden = false;
    this.pointsEl = $('.wallet-points', this.root);
    this.objectivesEl = $('.objectives', this.root);
    this.barFill = $('.passport-bar-fill', this.root);
    this.barText = $('.passport-bar-text', this.root);
    $('.btn--restart', this.root).addEventListener('click', onRestart, { signal });
  }

  setDestination(dest: DestinationDef, completedIds: string[]) {
    $('.hud-place-name', this.root).textContent = dest.shortName;
    $('.hud-place-country', this.root).textContent = dest.country;
    this.objectivesEl.innerHTML = dest.items.map((it) => `
      <div class="objective" data-id="${it.id}" title="${it.label}">
        <svg viewBox="-28 -28 56 56" class="objective-sil">${ITEM_ART[it.id]({ silhouette: true })}</svg>
        <svg viewBox="-28 -28 56 56" class="objective-art">${ITEM_ART[it.id]()}</svg>
        <span class="objective-check" aria-hidden="true"></span>
      </div>`).join('');
    this.setProgress(0, dest.level.goal);
    $('.hud-trip', this.root).innerHTML = DESTINATIONS.map((d) => {
      const state = completedIds.includes(d.id) ? 'done' : d.id === dest.id ? 'active' : 'locked';
      return `<span class="trip-dot trip-dot--${state}" title="${d.name}"></span>`;
    }).join('<span class="trip-line"></span>');
  }

  markDiscovered(id: ItemId) {
    this.root.querySelector(`.objective[data-id="${id}"]`)?.classList.add('found');
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

  /** Big short-lived label in the middle of the screen ("Faster!", "Ouch!"). */
  toast(text: string, cls = '') {
    const el = $('.hud-toast', this.root);
    el.textContent = text;
    el.className = `hud-toast ${cls}`;
    void el.offsetWidth;
    el.classList.add('show');
  }

  walletPoint() { return centerOf($('.wallet-coin', this.root).getBoundingClientRect()); }
  objectivePoint(id: ItemId) {
    const el = this.root.querySelector(`.objective[data-id="${id}"]`);
    return el ? centerOf(el.getBoundingClientRect()) : this.walletPoint();
  }
  barPoint() { return centerOf($('.passport-bar', this.root).getBoundingClientRect()); }

  unmount() { this.root.innerHTML = ''; this.root.hidden = true; }
}
