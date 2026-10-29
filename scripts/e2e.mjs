// Dev-only end-to-end smoke test using the locally installed Chrome (headless).
// Usage: node scripts/e2e.mjs [url] [width] [height]
// Steers the fox with an in-page autopilot that dispatches real PointerEvents.
import puppeteer from 'puppeteer-core';

const base = process.argv[2] ?? 'http://localhost:5173/';
const url = base + (base.includes('?') ? '&' : '?') + 'seed=7';
const W = Number(process.argv[3] ?? 320), H = Number(process.argv[4] ?? 568);
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const shots = process.env.SHOTS ?? '';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run'] });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [], logs = [], requests = [];
page.on('console', (m) => { logs.push(`${m.type()}: ${m.text()}`); if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push('REQUEST FAILED ' + r.url()));
page.on('request', (r) => requests.push(r.url()));
await page.goto(url, { waitUntil: 'networkidle0' });

const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
const state = () => page.$eval('#app', (el) => el.dataset.state);
const dbg = () => page.evaluate(() => { const d = window.passportQuest.debug; return { state: d.state, points: d.points, progress: d.progress, fox: d.fox, n: d.entities.length, chosen: d.chosen, coupons: d.coupons, entities: d.entities }; });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (cond, msg) => { if (!cond) throw new Error('CHECK FAILED: ' + msg); console.log('ok  ', msg); };
const hintVisible = () => page.$eval('.hint-hand', (e) => e.getAttribute('visibility') === 'visible');
const feel = () => page.evaluate(() => window.passportQuest.debug.feel);
const FEEL_DASH_SETTLE = 500; // > dashMs (350); polled, since headless frame pacing varies
/** Polls fn every 50 ms; resolves the elapsed ms when it returns true, or null after maxMs. */
const until = async (fn, maxMs) => { const t = Date.now(); while (Date.now() - t < maxMs) { if (await fn()) return Date.now() - t; await sleep(50); } return null; };

// In-page autopilot: steer toward the nearest item (or obstacle when target='obstacle').
// With dashThrough, it presses Space when an obstacle is about to hit (exercises the dash/dodge path).
await page.evaluate(() => {
  window.__autopilot = (ms, target = 'item', dashThrough = false) => new Promise((res) => {
    const g = window.passportQuest, stage = document.getElementById('stage');
    const end = performance.now() + ms;
    const step = () => {
      const d = g.debug;
      if (d.state !== 'playing' || performance.now() > end) return res();
      const ahead = d.entities.filter((e) => e.x > d.fox.x - 10).sort((a, b) => a.x - b.x);
      const wanted = ahead.filter((e) => e.kind === target);
      let ty = wanted.length ? wanted[0].y : null;
      if (ty !== null && target === 'item') {
        for (const o of ahead.filter((e) => e.kind === 'obstacle' && e.x < wanted[0].x + 40)) {
          if (Math.abs(o.y - ty) < 55) ty = o.y + (ty >= o.y ? 75 : -75);
        }
      }
      if (ty !== null) {
        const p = d.toScreen(0, ty);
        stage.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: p.y, isPrimary: true, pointerType: 'mouse', bubbles: true }));
      }
      if (dashThrough) {
        const near = ahead.find((e) => e.kind === 'obstacle' && e.x - d.fox.x < 90 && Math.abs(e.y - d.fox.y) < 40);
        if (near && !d.feel.dashing && !d.feel.cooldown) window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      }
      requestAnimationFrame(step);
    };
    step();
  });
});
const autopilot = (ms, target, dash) => page.evaluate((ms, t, dsh) => window.__autopilot(ms, t, dsh), ms, target, dash);

await shot('01-start');
check((await state()) === 'start', 'starts on start screen');
await page.tap('.btn--play');
await sleep(500);
check((await state()) === 'intro', 'play enters the map hub within the wipe (<= 500 ms)');
check((await page.evaluate(() => window.passportQuest.debug.wipes)) === 1 && !(await page.evaluate(() => window.passportQuest.debug.wiping)), 'play ran exactly one screen wipe and it has released input');
await sleep(400); await shot('01a-map');
check((await page.$$('.dest-btn')).length === 2, 'map offers both destinations');
await page.tap('.dest-btn[data-dest="brazil"]');
await page.tap('.dest-btn[data-dest="portugal"]').catch(() => {});
await sleep(1900); await shot('01b-intro');
check(await page.$eval('.intro-card', (e) => e.classList.contains('show')), 'intro card shown after the plane lands');
check(await page.$eval('.intro-card h2', (e) => e.textContent.startsWith('Rio')), 'first pick (Rio) wins over the second tap');
check((await page.$$('.theme-btn')).length === 3, 'intro offers 3 themes');
await page.tap('.theme-btn[data-theme="food"]');
await page.tap('.theme-btn[data-theme="party"]').catch(() => {});
await sleep(500);
check((await state()) === 'playing', 'choosing a theme enters playing (second tap ignored)');
check((await dbg()).chosen.brazil === 'food', 'chosen theme recorded (food)');
check((await page.$$('.chip')).length === 3, 'HUD shows the 3 items of the chosen theme');
check(await page.evaluate(() => window.passportQuest.debug.waterAlive), 'WebGL water active');
check(await page.$eval('.water-rect', (e) => getComputedStyle(e).display === 'none'), 'SVG water rect hidden under the shader');
await shot('02-brazil');

// Real pointer: fox follows the mouse Y
const before = (await dbg()).fox.y;
await page.mouse.move(150, H * 0.9);
await sleep(600);
const after = (await dbg()).fox.y;
check(after > before + 40, `fox follows real mouse move (y ${before.toFixed(0)} -> ${after.toFixed(0)})`);

// Keyboard: ArrowUp held moves Capi up; Space dashes (once, then cooldown)
const k0 = (await dbg()).fox.y;
await page.keyboard.down('ArrowUp'); await sleep(500); await page.keyboard.up('ArrowUp');
const k1 = (await dbg()).fox.y;
check(k1 < k0 - 40, `ArrowUp moves Capi up (y ${k0.toFixed(0)} -> ${k1.toFixed(0)})`);
await page.keyboard.press('Space'); await page.keyboard.press('Space');
const feel0 = await feel();
check(feel0.dashes === 1 && feel0.dashing, 'Space dashes once; second press inside the cooldown is ignored');
check(await page.$eval('.runner-root', (e) => e.classList.contains('dashing')), 'dashing class while dashing');
const dashEndedAt = await until(async () => !(await feel()).dashing, FEEL_DASH_SETTLE * 3);
check(dashEndedAt !== null && !(await page.$eval('.runner-root', (e) => e.classList.contains('dashing'))), `dash ends after its window (${dashEndedAt} ms wall time, class removed)`);

// Hint appears after ~4s without a collection (fox parked at the bottom, items may still hit it, so allow either)
await sleep(4300);
await shot('03-hint');
const d0 = await dbg();
check((await hintVisible()) || d0.progress > 0, 'hint shown after 4s without a collection');

// Hit an obstacle: progress never goes negative, points unchanged; a hit resets the combo
const p0 = await dbg();
const comboState = () => page.evaluate(() => { const d = window.passportQuest.debug; return { combo: d.combo, mult: d.multiplier, hits: d.hits, badge: document.querySelector('.wallet-combo')?.classList.contains('show') ?? false, badgeText: document.querySelector('.wallet-combo')?.textContent ?? '' }; });
const hunt = autopilot(6000, 'obstacle');
let prevHits = (await comboState()).hits, sawReset = false;
for (let i = 0; i < 55; i++) { await sleep(100); const s = await comboState(); if (s.hits > prevHits && s.combo <= 1) sawReset = true; prevHits = s.hits; } // <= 1: a catch may land in the same 100 ms sample
await hunt;
const p1 = await dbg();
check(prevHits > 0 && sawReset, `a hit resets the combo (${prevHits} hits)`);
check(p1.progress >= 0, `progress stays >= 0 after obstacle hunting (progress=${p1.progress}, was ${p0.progress})`);
check(logs.filter((l) => l.startsWith('error')).length === 0, 'no errors during obstacle hits');
await autopilot(5000, 'obstacle', true);
const feel1 = await feel();
check(feel1.dodges > 0, `dash passes through obstacles (${feel1.dodges} dodged, ${feel1.dashes} dashes)`);

// Combo grows while catching: sample during a 9 s item run, then play Brazil to completion
const t0 = Date.now();
let probing = true;
const probe = autopilot(9000, 'item').then(() => { probing = false; }); // resolves early if the level completes
let maxCombo = 0, badgeSeen = false;
while (probing) { await sleep(100); const s = await comboState(); maxCombo = Math.max(maxCombo, s.combo); if (s.mult > 1 && s.badge && s.badgeText === `x${s.mult}`) badgeSeen = true; }
await probe;
check(maxCombo >= 5, `combo grows while catching (max ${maxCombo})`);
check(badgeSeen, 'combo badge shows the multiplier on the wallet');
await autopilot(90000, 'item');
check((await state()) !== 'playing', `Brazil completed via autopilot in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
const feel2 = await feel();
check(feel2.patterns.length >= 3, `spawn patterns seen: ${feel2.patterns.join(', ')}`);
await sleep(1500);
await shot('04-redeem');
const r1 = await dbg();
check(r1.state === 'redeem', 'redeem state after completion');
check((await page.evaluate(() => window.passportQuest.debug.particles)) > 0, 'canvas particles active (confetti) after completion');
check(r1.progress === 16, 'progress capped at goal (16)');
check(r1.points >= 16 * 10 + 100, `points include multiplier gains and the completion bonus (${r1.points})`);
check((await page.$('.btn--continue')) !== null, 'redeem card visible');
check((await page.evaluate(() => window.passportQuest.debug.pool)) > 0, 'entity nodes are pooled and reused');
await page.tap('.btn--continue');
await page.tap('.btn--continue').catch(() => {});
await sleep(200);
check((await state()) === 'journal', 'continue enters journal (double tap ignored)');
await shot('04b-journal');
check((await page.$$('.journal-row')).length === 3, 'journal lists the 3 themed items');
check((await dbg()).entities.every((e) => e.kind === 'obstacle' || ['coconut', 'acai', 'brigadeiro'].includes(e.id)), 'only food-theme items spawned in Rio');
await page.tap('.btn--continue');
await sleep(500);
check((await state()) === 'intro', 'journal continue returns to the map');
await sleep(3400); await shot('05-intro-porto');
check(await page.$$eval('.map-marker--done', (els) => els.length) === 1, 'map shows Rio as done');
check(await page.$eval('.intro-card h2', (e) => e.textContent.startsWith('Porto')), 'remaining destination auto-selected (Porto)');
await page.tap('.theme-btn[data-theme="party"]'); await sleep(500);
check((await state()) === 'playing' && (await dbg()).chosen.portugal === 'party', 'Porto theme chosen (party)');
check(await page.$eval('.hud-place-name', (e) => e.textContent) === 'Porto', 'HUD shows Porto');
await shot('06-porto');
const t1 = Date.now();
await autopilot(90000, 'item');
check((await state()) !== 'playing', `Portugal completed via autopilot in ${((Date.now() - t1) / 1000).toFixed(1)}s`);
await sleep(1500);
await page.tap('.btn--continue'); await sleep(200);
await page.tap('.btn--continue'); await sleep(500);
check((await state()) === 'final', 'final screen');
await shot('07-final');
const finalPts = await page.$eval('.final-wallet strong', (e) => Number(e.textContent));
check(finalPts >= 34 * 10 + 200, `final total shown (${finalPts})`);
await page.tap('.btn--cta');
await sleep(200);
check(logs.some((l) => l.includes('CTA clicked')), 'CTA console.log');
check(await page.$eval('.cta-confirm', (e) => e.textContent) === 'CTA clicked — demo only', 'CTA confirmation text');
check(page.url() === url, 'CTA did not navigate');

// Email mock
await page.type('.email-input', 'not-an-email');
await page.tap('.btn--send'); await sleep(100);
check(await page.$eval('.email-input', (e) => e.classList.contains('invalid')), 'invalid email rejected');
await page.$eval('.email-input', (e) => { e.value = ''; });
await page.type('.email-input', 'test@example.com');
await page.tap('.btn--send'); await sleep(150);
check((await page.$eval('.email-confirm', (e) => e.textContent)).includes('test@example.com'), 'mock send confirmation shown');
check(logs.some((l) => l.includes('mock') && l.includes('coupons')), 'mock send logged, nothing sent');
check(requests.filter((u) => !u.startsWith(new URL(url).origin)).length === 0, 'no network request from the email mock');
await shot('07b-email');
// Restart from final
await page.tap('.btn--restart-final');
await sleep(200);
check((await state()) === 'start', 'restart from final -> start');

// Repeated restarts from various states, including mid-intro, mid-redeem and mid-journal
for (let i = 0; i < 12; i++) {
  await page.tap('.btn--play'); await sleep(350);
  if (i % 4 === 2) { await page.tap('.dest-btn[data-dest="portugal"]'); await sleep(2200); check(await page.$eval('.intro-card h2', (e) => e.textContent.startsWith('Porto')), `iteration ${i}: Porto chosen first`); await page.tap('.btn--restart'); await sleep(60); check((await state()) === 'start', `restart iteration ${i} -> start`); continue; }
  await page.tap('.dest-btn[data-dest="brazil"]'); await sleep(50);
  if (i % 4 === 3) { check((await state()) === 'intro', `iteration ${i}: restart from intro`); await page.tap('.btn--restart'); await sleep(60); check((await state()) === 'start', `restart iteration ${i} -> start`); continue; }
  await sleep(1750); await page.tap(`.theme-btn[data-theme="${['food', 'party', 'culture'][i % 3]}"]`); await sleep(400);
  if (i % 3 === 1) {
    await autopilot(90000, 'item'); await sleep(1200);
    await page.tap('.btn--continue'); await sleep(300);
    if (i % 2 === 0) {
      await page.tap('.btn--continue'); await sleep(500);
      check((await state()) === 'intro', `iteration ${i}: in intro`);
    } else {
      check((await state()) === 'journal', `iteration ${i}: in journal`);
    }
  } else if (i % 3 === 2) {
    await autopilot(1500, 'item');
  }
  await page.tap('.btn--restart'); await sleep(60);
  check((await state()) === 'start', `restart iteration ${i} -> start`);
  check(await page.$eval('#fx', (e) => e.childElementCount) === 0, `iteration ${i}: fx cleared`);
  check(await page.$eval('#scene-root', (e) => e.childElementCount) === 0, `iteration ${i}: scene cleared`);
  check(await page.evaluate(() => window.passportQuest.debug.particles === 0 && getComputedStyle(document.getElementById('stage')).transform === 'none' && document.getElementById('wipe').className === ''), `iteration ${i}: particles cleared, shake and wipe reset`);
  check(await page.evaluate(() => !window.passportQuest.debug.waterAlive && document.getElementById('water') === null), `iteration ${i}: water torn down (no canvas, no context)`);
  check((await feel()) === null, `iteration ${i}: runner gone (no dash/keyboard state)`);
  check(await page.evaluate(() => { const d = window.passportQuest.debug; return d.combo === 0 && d.hitStop === 0 && d.dodges === 0; }), `iteration ${i}: combo, hit-stop and dodges reset`);
}
// prefers-reduced-motion: class applied on restart and followed live
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.tap('.btn--play'); await sleep(350); await page.tap('.btn--restart'); await sleep(60);
check(await page.$eval('#app', (e) => e.classList.contains('reduced-motion')), 'reduced-motion class applied');
check((await page.evaluate(() => window.passportQuest.debug.reducedMotion)) === true, 'reduced motion reported to the game');
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
await sleep(50);
check(!(await page.$eval('#app', (e) => e.classList.contains('reduced-motion'))), 'reduced-motion class removed when the preference changes');

await page.tap('.btn--play'); await sleep(350); await page.tap('.dest-btn[data-dest="brazil"]'); await sleep(1700); await page.tap('.theme-btn[data-theme="party"]'); await sleep(400);
check((await state()) === 'playing' && (await dbg()).points === 0, 'points reset after restarts');
await autopilot(2500, 'item');
check((await page.evaluate(() => window.passportQuest.debug.particles)) > 0, 'canvas particles active during play (dust/sparkles)');

// Visibility pause: hint timer and world should not advance while hidden
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
const hiddenA = await dbg();
await sleep(4500);
const hiddenB = await dbg();
check(!(await hintVisible()), 'no hint while hidden (timers paused)');
check(hiddenA.n === hiddenB.n && hiddenA.progress === hiddenB.progress, 'world frozen while hidden');
check(await page.$eval('#app', (e) => e.classList.contains('paused')), 'paused class while hidden');
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
await sleep(300);
check(!(await hintVisible()), 'no immediate hint on resume (no time jump)');
await sleep(4200);
check((await hintVisible()) || (await dbg()).progress > 0, 'hint fires ~4s after resume');

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth || document.documentElement.scrollHeight > window.innerHeight);
check(!overflow, 'no document overflow');
const external = requests.filter((u) => !u.startsWith(new URL(url).origin));
check(external.length === 0, `no external requests (${requests.length} local requests)`);
check(errors.length === 0, `no console/page errors (${errors.length})`);
if (errors.length) console.log(errors);

// WebGL fallback: with ?nowebgl=1 the SVG gradient water shows and nothing errors
await page.goto(url + '&nowebgl=1', { waitUntil: 'networkidle0' });
await page.tap('.btn--play'); await sleep(350); await page.tap('.dest-btn[data-dest="brazil"]'); await sleep(1700); await page.tap('.theme-btn[data-theme="food"]'); await sleep(400);
check((await state()) === 'playing', 'fallback run enters playing');
check(!(await page.evaluate(() => window.passportQuest.debug.waterAlive)) && (await page.$('#water')) === null, 'no WebGL water with ?nowebgl=1');
check(await page.$eval('.water-rect', (e) => getComputedStyle(e).display !== 'none'), 'SVG water rect visible in fallback');
check(errors.length === 0, `no errors in the fallback run (${errors.length})`);

console.log(`\nALL CHECKS PASSED at ${W}x${H}`);
await browser.close();
