import type { DestinationDef, ItemId } from '../data/destinations';
import { DESTINATIONS } from '../data/destinations';
import { ITEM_ART } from '../art/items';
import { foxSvg, type FoxMood } from '../art/fox';
import { $, centerOf } from '../lib/dom';

/**
 * In-game HUD: restart, destination label, demo-points wallet, objectives
 * (silhouettes that fill in) and the fox guide with a speech bubble.
 */
export class Hud {
  private pointsEl!: HTMLElement;
  private bubbleEl!: HTMLElement;
  private foxEl!: HTMLElement;
  private objectivesEl!: HTMLElement;

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
        <span class="hud-objectives-title">Find</span>
        <div class="objectives"></div>
        <span class="hud-progress"><b class="hud-progress-n">0</b>/3</span>
      </div>
      <div class="hud-fox">
        <div class="hud-bubble" role="status"></div>
        <div class="hud-fox-avatar">${foxSvg('idle')}</div>
      </div>
      <div class="hud-trip" aria-label="Trip progress"></div>`;
    this.root.hidden = false;
    this.pointsEl = $('.wallet-points', this.root);
    this.bubbleEl = $('.hud-bubble', this.root);
    this.foxEl = $('.hud-fox-avatar', this.root);
    this.objectivesEl = $('.objectives', this.root);
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
    $('.hud-progress-n', this.root).textContent = '0';
    $('.hud-trip', this.root).innerHTML = DESTINATIONS.map((d) => {
      const state = completedIds.includes(d.id) ? 'done' : d.id === dest.id ? 'active' : 'locked';
      return `<span class="trip-dot trip-dot--${state}" title="${d.name}"></span>`;
    }).join('<span class="trip-line"></span>');
  }

  markCollected(id: ItemId, count: number) {
    const obj = this.root.querySelector<HTMLElement>(`.objective[data-id="${id}"]`);
    obj?.classList.add('found');
    $('.hud-progress-n', this.root).textContent = String(count);
  }

  setPoints(points: number, animate = false) {
    this.pointsEl.textContent = String(points);
    if (animate) {
      const w = $('.wallet', this.root);
      w.classList.remove('pulse');
      void w.offsetWidth; // restart animation
      w.classList.add('pulse');
    }
  }

  say(text: string, mood: FoxMood = 'happy') {
    this.bubbleEl.textContent = text;
    this.bubbleEl.classList.add('show');
    this.foxEl.innerHTML = foxSvg(mood);
    this.foxEl.classList.remove('bounce');
    void this.foxEl.offsetWidth;
    this.foxEl.classList.add('bounce');
  }

  hush() {
    this.bubbleEl.classList.remove('show');
    this.foxEl.innerHTML = foxSvg('idle');
  }

  walletPoint() { return centerOf($('.wallet-coin', this.root).getBoundingClientRect()); }
  objectivePoint(id: ItemId) {
    const el = this.root.querySelector(`.objective[data-id="${id}"]`);
    return el ? centerOf(el.getBoundingClientRect()) : this.walletPoint();
  }

  unmount() { this.root.innerHTML = ''; this.root.hidden = true; }
}
