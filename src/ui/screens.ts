import type { DestinationDef } from '../data/destinations';
import { DESTINATIONS } from '../data/destinations';
import { foxSvg } from '../art/fox';
import { stampSvg, PLANE_SVG } from '../art/passport';
import { ITEM_ART } from '../art/items';
import { $ } from '../lib/dom';

/**
 * Full-screen overlay screens: start, redeem, travel, final.
 * Each render replaces the overlay content; listeners use the game's signal.
 */
const FRAMING = 'With Scrambly, every game you discover and play adds up. Try it with this trip.';
const DEMO_NOTE = 'Demo points — not real earnings.';

export function renderStart(root: HTMLElement, onPlay: () => void, signal: AbortSignal) {
  root.innerHTML = `
    <section class="screen screen--start">
      <div class="start-sky"></div>
      <div class="start-fox">${foxSvg('happy')}</div>
      <div class="passport-motif" aria-hidden="true">
        <div class="passport-cover"><span>PASSPORT</span></div>
      </div>
      <h1 class="title">Passport<span>Quest</span></h1>
      <p class="hook">Travel from Brazil to Portugal with the Scrambly fox and fill your passport.</p>
      <ol class="loop-strip" aria-label="How it works">
        <li><b>1</b><span>Discover</span><small>catch local items</small></li>
        <li><b>2</b><span>Play</span><small>earn demo points</small></li>
        <li><b>3</b><span>Redeem</span><small>collect stamps</small></li>
      </ol>
      <p class="instruction">Move <b>up and down</b> to catch items and dodge obstacles.</p>
      <button class="btn btn--primary btn--play" type="button">Play</button>
      <p class="framing">${FRAMING}</p>
      <p class="demo-note">${DEMO_NOTE}</p>
    </section>`;
  $('.btn--play', root).addEventListener('click', onPlay, { signal });
}

export function renderRedeem(root: HTMLElement, dest: DestinationDef, points: number, isLast: boolean, onContinue: () => void, signal: AbortSignal) {
  root.innerHTML = `
    <section class="screen screen--redeem">
      <div class="card redeem-card">
        <div class="redeem-fox">${foxSvg('cheer')}</div>
        <p class="eyebrow">Destination complete</p>
        <h2>${dest.name} explored!</h2>
        <div class="reward">
          <div class="reward-stamp">${stampSvg(dest.stampLabel, dest.accent)}</div>
          <div class="reward-text">
            <strong>Reward redeemed — demo</strong>
            <span>${dest.stampLabel} stamp added to your passport</span>
            <span class="reward-points">+100 demo pts bonus · total <b>${points}</b></span>
          </div>
        </div>
        <button class="btn btn--primary btn--continue" type="button">${isLast ? 'See my passport' : 'Fly to Portugal'}</button>
        <p class="demo-note">${DEMO_NOTE}</p>
      </div>
    </section>`;
  $('.btn--continue', root).addEventListener('click', onContinue, { signal });
}

export interface TravelParts { plane: HTMLElement; status: HTMLElement; unlock: HTMLElement }

export function renderTravel(root: HTMLElement, from: DestinationDef, to: DestinationDef): TravelParts {
  root.innerHTML = `
    <section class="screen screen--travel">
      <div class="map">
        <svg class="map-svg" viewBox="0 0 320 240" aria-hidden="true">
          <path class="map-route" d="M50 190 Q160 20 270 90" fill="none" stroke="#FFF6E8" stroke-width="3" stroke-dasharray="6 8" opacity="0.6"/>
          <circle cx="50" cy="190" r="10" fill="#1FA463" stroke="#FFF6E8" stroke-width="3"/>
          <circle class="map-dest" cx="270" cy="90" r="10" fill="#2E6FD8" stroke="#FFF6E8" stroke-width="3"/>
          <text x="50" y="222" text-anchor="middle" fill="#FFF6E8" font-size="14" font-weight="600">${from.country}</text>
          <text x="270" y="64" text-anchor="middle" fill="#FFF6E8" font-size="14" font-weight="600">${to.country}</text>
        </svg>
        <div class="travel-plane">${PLANE_SVG}</div>
      </div>
      <p class="travel-status">Flying to ${to.name}…</p>
      <div class="travel-unlock">
        <strong>${to.name} unlocked!</strong>
        <span>${to.tagline}</span>
      </div>
    </section>`;
  return { plane: $('.travel-plane', root), status: $('.travel-status', root), unlock: $('.travel-unlock', root) };
}

export function renderFinal(root: HTMLElement, points: number, onCta: () => void, onRestart: () => void, signal: AbortSignal) {
  root.innerHTML = `
    <section class="screen screen--final">
      <div class="final-fox">${foxSvg('cheer')}</div>
      <p class="eyebrow">Trip complete</p>
      <h2>Your passport is full!</h2>
      <div class="passport-open">
        ${DESTINATIONS.map((d) => `
          <div class="passport-page">
            <span class="passport-page-title">${d.name}</span>
            ${stampSvg(d.stampLabel, d.accent, 'stamp--final')}
            <div class="passport-items">${d.items.map((it) => `<svg viewBox="-28 -28 56 56">${ITEM_ART[it.id]()}</svg>`).join('')}</div>
          </div>`).join('')}
      </div>
      <div class="final-wallet">
        <span class="wallet-coin" aria-hidden="true"></span>
        <strong>${points}</strong> <span>demo points earned</span>
      </div>
      <p class="demo-note">${DEMO_NOTE}</p>
      <p class="final-message">You discovered, played and redeemed. That's the Scrambly loop: discover games, play and progress, then redeem rewards.</p>
      <button class="btn btn--primary btn--cta" type="button">Explore Scrambly</button>
      <div class="cta-confirm" role="status" aria-live="polite"></div>
      <button class="btn btn--ghost btn--restart-final" type="button">Play again</button>
    </section>`;
  $('.btn--cta', root).addEventListener('click', onCta, { signal });
  $('.btn--restart-final', root).addEventListener('click', onRestart, { signal });
}

export function showCtaConfirm(root: HTMLElement) {
  const el = root.querySelector<HTMLElement>('.cta-confirm');
  if (!el) return;
  el.textContent = 'CTA clicked — demo only';
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

export function clearScreen(root: HTMLElement) { root.innerHTML = ''; }
