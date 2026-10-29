import type { DestinationDef, ItemId, ThemeDef, ThemeId } from '../data/destinations';
import { DESTINATIONS, COMPLETION_BONUS, COUPON_BONUS, themeOf } from '../data/destinations';
import { foxSvg } from '../art/fox';
import { capySvg } from '../art/capy';
import { stampSvg, PLANE_SVG, SKYLINE_SVG } from '../art/passport';
import { ITEM_ART, OBSTACLE_ART, TICKET_SVG, THEME_ICONS } from '../art/items';
import { mapSvg } from '../art/map';
import { $ } from '../lib/dom';

/**
 * Full-screen overlay screens: start, intro (map + theme choice), redeem,
 * journal, final. Each render replaces the overlay content; listeners use
 * the game's AbortSignal.
 */
const FRAMING = 'With Scrambly, every game you discover and play adds up. Try it with this trip.';
const DEMO_NOTE = 'Demo only — points and coupons are not real earnings or offers.';

export type Counts = Partial<Record<ItemId, number>>;
export type Chosen = Partial<Record<DestinationDef['id'], ThemeId>>;

const themeIcon = (id: ThemeId) => `<svg viewBox="-14 -14 28 28" class="theme-icon" aria-hidden="true">${THEME_ICONS[id]}</svg>`;

export function renderStart(root: HTMLElement, best: number, onPlay: () => void, signal: AbortSignal) {
  root.innerHTML = `
    <section class="screen screen--start">
      <div class="skyline-wrap">${SKYLINE_SVG}</div>
      <div class="start-duo">
        <div class="start-capy">${capySvg('happy', 'panama')}</div>
        <div class="start-fox">${foxSvg('happy')}</div>
      </div>
      <div class="passport-motif" aria-hidden="true">
        <div class="passport-cover"><span>PASSPORT</span></div>
      </div>
      <h1 class="title">Passport<span>Quest</span></h1>
      <p class="hook">Run Rio and Porto with Capi and the Scrambly fox. Pick what to see, catch it, fill your passport.</p>
      <ol class="loop-strip" aria-label="How it works">
        <li><b>1</b><span>Discover</span><small>pick a theme</small></li>
        <li><b>2</b><span>Play</span><small>catch &amp; earn</small></li>
        <li><b>3</b><span>Redeem</span><small>stamps &amp; coupons</small></li>
      </ol>
      <p class="instruction">Move <b>up and down</b> to catch items. <b>Tap</b> to dash through obstacles.</p>
      ${best > 0 ? `<p class="best-line">Your best: <b>${best}</b> demo pts</p>` : ''}
      <button class="btn btn--primary btn--play" type="button">Play</button>
      <p class="framing">${FRAMING}</p>
      <p class="demo-note">${DEMO_NOTE}</p>
    </section>`;
  $('.btn--play', root).addEventListener('click', onPlay, { signal });
}

export interface IntroParts { plane: HTMLElement; card: HTMLElement; map: SVGSVGElement; where: HTMLElement; destList: HTMLElement }

/**
 * Journey map hub. With `choosing`, the map asks where to go next (markers and
 * buttons are tappable). Otherwise the plane flies to `index` and the theme
 * card for that destination is shown.
 */
export function renderIntro(
  root: HTMLElement,
  completed: number[],
  onPickDestination: (index: number) => void,
  signal: AbortSignal,
): IntroParts {
  const n = completed.length;
  root.innerHTML = `
    <section class="screen screen--intro">
      <p class="eyebrow intro-eyebrow">${n === 0 ? 'Your trip' : `${n} of ${DESTINATIONS.length} stamped`}</p>
      <div class="map">
        ${mapSvg(-1, completed, true)}
        <div class="travel-plane">${PLANE_SVG}</div>
      </div>
      <p class="intro-where">${n === 0 ? 'Where do you want to go first?' : 'Next stop?'}</p>
      <div class="dest-list">
        ${DESTINATIONS.map((d, i) => `<button class="dest-btn ${completed.includes(i) ? 'dest-btn--done' : ''}" type="button" data-dest="${d.id}" data-index="${i}"><strong>${d.name}</strong><span>${d.country}</span></button>`).join('')}
      </div>
      <div class="card intro-card hidden"></div>
    </section>`;
  const pick = (i: number) => { if (!completed.includes(i)) onPickDestination(i); };
  root.querySelectorAll<HTMLButtonElement>('.dest-btn').forEach((b) => b.addEventListener('click', () => pick(Number(b.dataset.index)), { signal }));
  root.querySelectorAll<SVGGElement>('.map-marker--pick').forEach((m) => m.addEventListener('click', () => pick(Number(m.dataset.index)), { signal }));
  return { plane: $('.travel-plane', root), card: $('.intro-card', root), map: $('.map-svg', root), where: $('.intro-where', root), destList: $('.dest-list', root) };
}

/** Marks the chosen destination on the map and hides the choice UI while the plane flies. */
export function markIntroDestination(parts: IntroParts, index: number) {
  parts.where.textContent = `Flying to ${DESTINATIONS[index].name}…`;
  parts.destList.hidden = true;
  parts.map.querySelectorAll('.map-marker').forEach((m) => {
    m.classList.remove('map-marker--pick', 'map-marker--locked', 'map-marker--active');
    m.classList.add(Number((m as SVGGElement).dataset.index) === index ? 'map-marker--active' : m.classList.contains('map-marker--done') ? 'map-marker--done' : 'map-marker--locked');
  });
}

/** Fills the theme card for a destination (called once the plane has landed). */
export function renderThemeCard(parts: IntroParts, dest: DestinationDef, onChoose: (theme: ThemeId) => void, signal: AbortSignal) {
  parts.where.hidden = true;
  parts.card.classList.remove('hidden');
  parts.card.innerHTML = `
        <h2>${dest.name}<span>${dest.country}</span></h2>
        <p class="intro-question">What do you want to see here?</p>
        <div class="theme-list">
          ${dest.themes.map((t) => `
            <button class="theme-btn" type="button" data-theme="${t.id}">
              <div class="theme-capy">${capySvg('happy', t.costume)}</div>
              <div class="theme-text">
                <strong>${t.label}</strong>
                <span>${t.pitch}</span>
                <em>Coupon: ${t.coupon.title}</em>
              </div>
              <div class="theme-side">${themeIcon(t.id)}<div class="theme-items">${t.items.map((it) => `<svg viewBox="-28 -28 56 56" aria-hidden="true">${ITEM_ART[it.id]()}</svg>`).join('')}</div></div>
            </button>`).join('')}
        </div>
        <div class="intro-avoid"><span class="intro-label">Avoid</span>${dest.obstacles.map((o) => `<svg viewBox="-28 -28 56 56" title="${o.label}">${OBSTACLE_ART[o.id]}</svg>`).join('')}</div>`;
  parts.card.querySelectorAll<HTMLButtonElement>('.theme-btn').forEach((b) => b.addEventListener('click', () => onChoose(b.dataset.theme as ThemeId), { signal }));
}

function couponMarkup(theme: ThemeDef, counts: Counts, unlocked: boolean) {
  const c = theme.coupon;
  const item = theme.items.find((i) => i.id === c.itemId)!;
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

export function renderRedeem(root: HTMLElement, dest: DestinationDef, theme: ThemeDef, points: number, counts: Counts, couponUnlocked: boolean, onContinue: () => void, signal: AbortSignal) {
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
            <span>${dest.stampLabel} stamp · ${theme.label}</span>
            <span class="reward-points">+${COMPLETION_BONUS}${couponUnlocked ? ` +${COUPON_BONUS}` : ''} demo pts · total <b>${points}</b></span>
          </div>
        </div>
        ${couponMarkup(theme, counts, couponUnlocked)}
        <button class="btn btn--primary btn--continue" type="button">Travel journal</button>
        <p class="demo-note">${DEMO_NOTE}</p>
      </div>
    </section>`;
  $('.btn--continue', root).addEventListener('click', onContinue, { signal });
}

export function renderJournal(root: HTMLElement, dest: DestinationDef, theme: ThemeDef, counts: Counts, isLast: boolean, onContinue: () => void, signal: AbortSignal) {
  const others = dest.themes.filter((t) => t.id !== theme.id).map((t) => t.label).join(' or ');
  root.innerHTML = `
    <section class="screen screen--journal">
      <div class="card journal-card">
        <p class="eyebrow">Travel journal</p>
        <h2>What you found in ${dest.shortName}</h2>
        <div class="journal-theme">${themeIcon(theme.id)}${theme.label}</div>
        <ul class="journal">
          ${theme.items.map((it) => {
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
        <p class="journal-next">Next time, try ${others}.</p>
        <button class="btn btn--primary btn--continue" type="button">${isLast ? 'See my passport' : 'Back to the map'}</button>
      </div>
    </section>`;
  $('.btn--continue', root).addEventListener('click', onContinue, { signal });
}

export interface FinalHandlers { onCta: () => void; onRestart: () => void; onSendCoupons: (email: string) => void }

export interface FinalScore { best: number; newBest: boolean }

export function renderFinal(root: HTMLElement, points: number, counts: Counts, chosen: Chosen, coupons: string[], score: FinalScore, h: FinalHandlers, signal: AbortSignal) {
  const lastDest = DESTINATIONS[DESTINATIONS.length - 1];
  const lastCostume = themeOf(lastDest, chosen[lastDest.id] ?? lastDest.themes[0].id).costume;
  const won = DESTINATIONS.flatMap((d) => d.themes.filter((t) => coupons.includes(`${d.id}:${t.id}`)).map((t) => t.coupon.title));
  root.innerHTML = `
    <section class="screen screen--final">
      <div class="skyline-wrap skyline-wrap--final">${SKYLINE_SVG}</div>
      <div class="start-duo final-duo">
        <div class="start-capy">${capySvg('cheer', lastCostume)}</div>
        <div class="start-fox">${foxSvg('cheer')}</div>
      </div>
      <p class="eyebrow">Trip complete</p>
      <h2>Your passport is full!</h2>
      <div class="passport-open">
        ${DESTINATIONS.map((d) => {
          const theme = chosen[d.id] ? themeOf(d, chosen[d.id]!) : d.themes[0];
          return `
          <div class="passport-page">
            <span class="passport-page-title">${d.shortName}</span>
            ${stampSvg(d.stampLabel, d.accent, 'stamp--final')}
            <span class="passport-theme">${theme.label}</span>
            <div class="passport-items">${theme.items.map((it) => `<svg viewBox="-28 -28 56 56" class="${counts[it.id] ? '' : 'missed'}">${ITEM_ART[it.id]()}</svg>`).join('')}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="final-wallet">
        <div class="final-wallet-row"><span class="wallet-coin" aria-hidden="true"></span><strong>${points}</strong> <span>demo points</span></div>
        <div class="final-wallet-row final-coupons">${TICKET_SVG}<span>${won.length ? won.join(' · ') : 'No coupons this trip'}</span></div>
        <div class="final-wallet-row final-best ${score.newBest ? 'final-best--new' : ''}">${score.newBest ? 'New best!' : `Best: ${score.best} demo pts`}</div>
      </div>
      <p class="demo-note">${DEMO_NOTE}</p>
      <form class="email-form" novalidate>
        <input class="email-input" type="email" inputmode="email" autocomplete="email" placeholder="your@email.com" aria-label="Email for coupons" ${won.length ? '' : 'disabled'} />
        <button class="btn btn--send" type="submit" ${won.length ? '' : 'disabled'}>Send coupons</button>
      </form>
      <p class="email-note">${won.length ? 'Mock only — nothing is sent or stored.' : 'Unlock a coupon to try the mock email send.'}</p>
      <div class="email-confirm" role="status" aria-live="polite"></div>
      <p class="final-message">You discovered, played and redeemed. That's the Scrambly loop: discover games, play and progress, then redeem rewards.</p>
      <button class="btn btn--primary btn--cta" type="button">Explore Scrambly</button>
      <div class="cta-confirm" role="status" aria-live="polite"></div>
      <button class="btn btn--ghost btn--restart-final" type="button">Play again · try other themes</button>
    </section>`;
  $('.btn--cta', root).addEventListener('click', h.onCta, { signal });
  $('.btn--restart-final', root).addEventListener('click', h.onRestart, { signal });
  const form = $<HTMLFormElement>('.email-form', root);
  const input = $<HTMLInputElement>('.email-input', root);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const email = input.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    input.classList.remove('invalid');
    if (!valid) { void input.offsetWidth; input.classList.add('invalid'); input.focus(); return; }
    h.onSendCoupons(email);
    $('.email-confirm', root).textContent = `Sent to ${email} (demo, nothing really sent)`;
    input.blur();
  }, { signal });
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
