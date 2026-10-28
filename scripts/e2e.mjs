// Dev-only end-to-end smoke test using the locally installed Chrome (headless).
// Usage: node scripts/e2e.mjs [url] [width] [height]
import puppeteer from 'puppeteer-core';

const url = process.argv[2] ?? 'http://localhost:5173/';
const W = Number(process.argv[3] ?? 320), H = Number(process.argv[4] ?? 568);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (cond, msg) => { if (!cond) throw new Error('CHECK FAILED: ' + msg); console.log('ok  ', msg); };

/** Tap an item by id using its on-screen center (viewport coords). */
async function tapItem(id, times = 1) {
  const box = await page.$eval(`.item[data-id="${id}"] .hit`, (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; });
  check(box.w >= 44, `${id} hit area ${box.w.toFixed(1)}px >= 44px`);
  for (let i = 0; i < times; i++) await page.touchscreen.tap(box.x, box.y);
}

await shot('01-start');
check((await state()) === 'start', 'starts on start screen');
await page.tap('.btn--play');
await sleep(200);
check((await state()) === 'playing', 'play enters playing');
await shot('02-brazil');

// Hint appears after ~4s inactivity
await sleep(4300);
check((await page.$$('.item.hint')).length === 1, 'hint shown after 4s');
await shot('03-hint');

// Double tap guard
await tapItem('coconut', 3);
await sleep(800);
const pts1 = await page.$eval('.wallet-points', (e) => e.textContent);
check(pts1 === '25', `rapid triple tap on coconut counted once (points=${pts1})`);
check((await page.$$('.item.hint')).length === 0, 'hint cleared after collection');

// Decoy
const decoy = await page.$('.decoy .hit');
if (decoy) { const b = await decoy.boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await sleep(100); check(await page.$eval('.decoy', (e) => e.classList.contains('shake')), 'decoy shakes'); }

await tapItem('football');
await sleep(700);
await tapItem('seashell', 2);
await sleep(1100);
check((await state()) === 'redeem', 'third item completes destination once');
await sleep(1600);
await shot('04-redeem');
check(await page.$eval('.wallet-points', (e) => e.textContent) === '175', 'points 75 + 100 bonus = 175');
check((await page.$('.btn--continue')) !== null, 'redeem card visible');
await page.tap('.btn--continue');
await page.tap('.btn--continue').catch(() => {});
await sleep(200);
check((await state()) === 'travel', 'continue enters travel');
await sleep(1200); await shot('05-travel');
await sleep(2800);
check((await state()) === 'playing', 'travel auto-enters Portugal');
check(await page.$eval('.hud-place-name', (e) => e.textContent) === 'Porto', 'HUD shows Porto');
await shot('06-porto');
await tapItem('azulejo'); await sleep(600);
await tapItem('tram'); await sleep(600);
await tapItem('nata'); await sleep(1600);
check((await state()) === 'redeem', 'Portugal complete');
await page.tap('.btn--continue');
await sleep(300);
check((await state()) === 'final', 'final screen');
await shot('07-final');
check(await page.$eval('.final-wallet strong', (e) => e.textContent) === '350', 'final total 350');
await page.tap('.btn--cta');
await sleep(200);
check(logs.some((l) => l.includes('CTA clicked')), 'CTA console.log');
check(await page.$eval('.cta-confirm', (e) => e.textContent) === 'CTA clicked — demo only', 'CTA confirmation text');
check(page.url() === url, 'CTA did not navigate');

// Restart from final
await page.tap('.btn--restart-final');
await sleep(200);
check((await state()) === 'start', 'restart from final -> start');

// Repeated restarts from various states, including mid-transition
for (let i = 0; i < 12; i++) {
  await page.tap('.btn--play'); await sleep(80);
  await tapItem('coconut'); await sleep(80);
  if (i % 3 === 1) { await tapItem('football'); await tapItem('seashell'); await sleep(1500); await page.tap('.btn--continue'); await sleep(600); check((await state()) === 'travel', `iteration ${i}: in travel`); }
  await page.tap('.btn--restart'); await sleep(60);
  check((await state()) === 'start', `restart iteration ${i} -> start`);
  check(await page.$eval('#fx', (e) => e.childElementCount) === 0, `iteration ${i}: fx cleared`);
  check(await page.$eval('#scene-root', (e) => e.childElementCount) === 0, `iteration ${i}: scene cleared`);
}
// Fresh game after restarts: points reset & flow still works
await page.tap('.btn--play'); await sleep(100);
check(await page.$eval('.wallet-points', (e) => e.textContent) === '0', 'points reset after restarts');
await tapItem('coconut'); await sleep(700);
check(await page.$eval('.wallet-points', (e) => e.textContent) === '25', 'single collect after restarts gives exactly 25 (no duplicate listeners)');

// Visibility pause: hint timer should not fire while hidden
await page.tap('.btn--restart'); await page.tap('.btn--play'); await sleep(100);
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
await sleep(4500);
check((await page.$$('.item.hint')).length === 0, 'no hint while hidden (timers paused)');
check(await page.$eval('#app', (e) => e.classList.contains('paused')), 'paused class while hidden');
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
await sleep(300);
check((await page.$$('.item.hint')).length === 0, 'no immediate hint on resume (no time jump)');
await sleep(4200);
check((await page.$$('.item.hint')).length === 1, 'hint fires ~4s after resume');

// Overflow / external requests
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth || document.documentElement.scrollHeight > window.innerHeight);
check(!overflow, 'no document overflow');
const external = requests.filter((u) => !u.startsWith(new URL(url).origin));
check(external.length === 0, `no external requests (${requests.length} local requests)`);
check(errors.length === 0, `no console/page errors (${errors.length})`);
if (errors.length) console.log(errors);

console.log(`\nALL CHECKS PASSED at ${W}x${H}`);
await browser.close();
