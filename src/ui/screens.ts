import type { DestinationDef, ItemId } from '../data/destinations';
import { DESTINATIONS, COMPLETION_BONUS, COUPON_BONUS } from '../data/destinations';
import { foxSvg } from '../art/fox';
import { stampSvg, PLANE_SVG } from '../art/passport';
import { ITEM_ART, OBSTACLE_ART, TICKET_SVG } from '../art/items';
import { mapSvg } from '../art/map';
import { $ } from '../lib/dom';

/**
 * Full-screen overlay screens: start, intro, redeem, journal, final.
 * Each render replaces the overlay content; listeners use the game's signal.
 */
const FRAMING = 'With Scrambly, every game you discover and play adds up. Try it with this trip.';
const DEMO_NOTE = 'Demo only — points and coupons are not real earnings or offers.';

export type Counts = Partial<Record<ItemId, number>>;

export function renderStart(root: HTMLElement, onPlay: () => void, signal: AbortSignal) {
  root.innerHTML = `
    <section class="screen screen--start">
      <div class="start-fox">${foxSvg('happy')}</div>
      <div class="passport-motif" aria-hidden="true">
        <div class="passport-cover"><span>PASSPORT</span></div>
      </div>
      <h1 class="title">Passport<span>Quest</span></h1>
      <p class="hook">Run from Brazil to Portugal with the Scrambly fox and fill your passport.</p>
      <ol class="loop-strip" aria-label="How it works">
        <li><b>1</b><span>Discover</span><small>catch local items</small></li>
        <li><b>2</b><span>Play</span><small>earn demo points</small></li>
        <li><b>3</b><span>Redeem</span><small>stamps &amp; coupons</small></li>
      </ol>
      <p class="instruction">Move <b>up and down</b> to catch items and dodge obstacles.</p>
      <button class="btn btn--primary btn--play" type="button">Play</button>
      <p class="framing">${FRAMING}</p>
      <p class="demo-note">${DEMO_NOTE}</p>
    </section>`;
  $('.btn--play', root).addEventListener('click', onPlay, { signal });
}

function couponMarkup(dest: DestinationDef, counts: Counts, unlocked: boolean) {
  const c = dest.coupon;
  const item = dest.items.find((i) => i.id === c.itemId)!;
  const have = Math.min(counts[c.itemId] ?? 0, c.need);
  return `
    <div class="coupon ${unlocked ? 'coupon--unlocked' : 'coupon--locked'}">
      <span class="coupon-icon">${TICKET_SVG}</span>
      <div class="coupon-text">
        <strong>${unlocked ? c.title : 'Coupon missed'}</strong>
        <span>${unlocked ? c.venue : `${have}/${c.need} ${item.label.toLowerCase()}s caught. Next trip!`}</span>
      </div>
      <svg viewBox="-28 -28 56 56" class="coupon-item">${ITEM_ART[c.itemId]()}</svg>
    </div>`;
}

export function renderRedeem(root: HTMLElement, dest: DestinationDef, points: number, counts: Counts, couponUnlocked: boolean, onContinue: () => void, signal: AbortSignal) {
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
            <span class="reward-points">+${COMPLETION_BONUS}${couponUnlocked ? ` +${COUPON_BONUS}` : ''} demo pts · total <b>${points}</b></span>
          </div>
        </div>
        ${couponMarkup(dest, counts, couponUnlocked)}
        <button class="btn btn--primary btn--continue" type="button">Travel journal</button>
        <p class="demo-note">${DEMO_NOTE}</p>
      </div>
    </section>`;
  $('.btn--continue', root).addEventListener('click', onContinue, { signal });
}

export function renderJournal(root: HTMLElement, dest: DestinationDef, counts: Counts, isLast: boolean, onContinue: () => void, signal: AbortSignal) {
  root.innerHTML = `
    <section class="screen screen--journal">
      <div class="card journal-card">
        <p class="eyebrow">Travel journal</p>
        <h2>What you found in ${dest.shortName}</h2>
        <ul class="journal">
          ${dest.items.map((it) => {
            const n = counts[it.id] ?? 0;
            return `
            <li class="journal-row ${n ? '' : 'journal-row--missed'}">
              <svg viewBox="-28 -28 56 56" class="journal-icon">${ITEM_ART[it.id]()}</svg>
              <div class="journal-text">
                <strong>${it.label} <span class="journal-count">×${n}</span></strong>
                <span>${n ? it.blurb : 'Not caught this time. Keep an eye out next trip!'}</span>
              </div>
            </li>`;
          }).join('')}
        </ul>
        <button class="btn btn--primary btn--continue" type="button">${isLast ? 'See my passport' : 'Fly to Portugal'}</button>
      </div>
    </section>`;
  $('.btn--continue', root).addEventListener('click', onContinue, { signal });
}

export interface IntroParts { plane: HTMLElement; card: HTMLElement; map: SVGSVGElement; auto: HTMLElement }

export function renderIntro(root: HTMLElement, dest: DestinationDef, index: number, completed: number[], onStart: () => void, signal: AbortSignal): IntroParts {
  const couponItem = dest.items.find((i) => i.id === dest.coupon.itemId)!;
  root.innerHTML = `
    <section class="screen screen--intro">
      <p class="eyebrow intro-eyebrow">Destination ${index + 1} of ${DESTINATIONS.length}</p>
      <div class="map">
        ${mapSvg(index, completed)}
        <div class="travel-plane">${PLANE_SVG}</div>
      </div>
      <div class="card intro-card">
        <h2>${dest.name}<span>${dest.country}</span></h2>
        <p class="intro-tagline">${dest.tagline}</p>
        <div class="intro-row">
          <span class="intro-label">Catch</span>
          <div class="intro-icons">${dest.items.map((it) => `<svg viewBox="-28 -28 56 56" title="${it.label}">${ITEM_ART[it.id]()}</svg>`).join('')}</div>
        </div>
        <div class="intro-row">
          <span class="intro-label">Coupon</span>
          <div class="intro-coupon"><span class="coupon-icon">${TICKET_SVG}</span><span>${dest.coupon.need} × ${couponItem.label.toLowerCase()} → ${dest.coupon.title.toLowerCase()}</span></div>
        </div>
        <div class="intro-row">
          <span class="intro-label">Avoid</span>
          <div class="intro-icons intro-icons--avoid">${dest.obstacles.map((o) => `<svg viewBox="-28 -28 56 56" title="${o.label}">${OBSTACLE_ART[o.id]}</svg>`).join('')}</div>
        </div>
        <button class="btn btn--primary btn--start" type="button">Let's run!<span class="btn-auto"></span></button>
      </div>
    </section>`;
  $('.btn--start', root).addEventListener('click', onStart, { signal });
  return { plane: $('.travel-plane', root), card: $('.intro-card', root), map: $('.map-svg', root), auto: $('.btn-auto', root) };
}

export function renderFinal(root: HTMLElement, points: number, counts: Counts, coupons: string[], onCta: () => void, onRestart: () => void, signal: AbortSignal) {
  const couponRows = DESTINATIONS.filter((d) => coupons.includes(d.coupon.id));
  root.innerHTML = `
    <section class="screen screen--final">
      <div class="final-fox">${foxSvg('cheer')}</div>
      <p class="eyebrow">Trip complete</p>
      <h2>Your passport is full!</h2>
      <div class="passport-open">
        ${DESTINATIONS.map((d) => `
          <div class="passport-page">
            <span class="passport-page-title">${d.shortName}</span>
            ${stampSvg(d.stampLabel, d.accent, 'stamp--final')}
            <div class="passport-items">${d.items.map((it) => `<svg viewBox="-28 -28 56 56" class="${counts[it.id] ? '' : 'missed'}">${ITEM_ART[it.id]()}</svg>`).join('')}</div>
          </div>`).join('')}
      </div>
      <div class="final-wallet">
        <div class="final-wallet-row"><span class="wallet-coin" aria-hidden="true"></span><strong>${points}</strong> <span>demo points</span></div>
        <div class="final-wallet-row final-coupons">${TICKET_SVG}<span>${couponRows.length ? couponRows.map((d) => d.coupon.title).join(' · ') : 'No coupons this trip'}</span></div>
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
