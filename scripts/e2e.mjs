// Dev-only end-to-end smoke test using the locally installed Chrome (headless).
// Usage: node scripts/e2e.mjs [url] [width] [height]
// Steers the fox with an in-page autopilot that dispatches real PointerEvents.
import puppeteer from 'puppeteer-core';

const base = process.argv[2] ?? 'http://localhost:5173/';
const url = base + (base.includes('?') ? '&' : '?') + 'seed=7';
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
const dbg = () => page.evaluate(() => { const d = window.passportQuest.debug; return { state: d.state, points: d.points, progress: d.progress, fox: d.fox, n: d.entities.length }; });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (cond, msg) => { if (!cond) throw new Error('CHECK FAILED: ' + msg); console.log('ok  ', msg); };
const hintVisible = () => page.$eval('.hint-hand', (e) => e.getAttribute('visibility') === 'visible');

// In-page autopilot: steer toward the nearest item (or obstacle when target='obstacle').
await page.evaluate(() => {
  window.__autopilot = (ms, target = 'item') => new Promise((res) => {
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
      requestAnimationFrame(step);
    };
    step();
  });
});
const autopilot = (ms, target) => page.evaluate((ms, t) => window.__autopilot(ms, t), ms, target);

await shot('01-start');
check((await state()) === 'start', 'starts on start screen');
await page.tap('.btn--play');
await sleep(200);
check((await state()) === 'playing', 'play enters playing');
await shot('02-brazil');

// Real pointer: fox follows the mouse Y
const before = (await dbg()).fox.y;
await page.mouse.move(150, H * 0.9);
await sleep(600);
const after = (await dbg()).fox.y;
check(after > before + 40, `fox follows real mouse move (y ${before.toFixed(0)} -> ${after.toFixed(0)})`);

// Hint appears after ~4s without a collection (fox parked at the bottom, items may still hit it, so allow either)
await sleep(4300);
await shot('03-hint');
const d0 = await dbg();
check((await hintVisible()) || d0.progress > 0, 'hint shown after 4s without a collection');

// Hit an obstacle: progress never goes negative, points unchanged
const p0 = await dbg();
await autopilot(6000, 'obstacle');
const p1 = await dbg();
check(p1.progress >= 0, `progress stays >= 0 after obstacle hunting (progress=${p1.progress}, was ${p0.progress})`);
check(logs.filter((l) => l.startsWith('error')).length === 0, 'no errors during obstacle hits');

// Play Brazil to completion
const t0 = Date.now();
await autopilot(90000, 'item');
check((await state()) !== 'playing', `Brazil completed via autopilot in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
await sleep(1500);
await shot('04-redeem');
const r1 = await dbg();
check(r1.state === 'redeem', 'redeem state after completion');
check(r1.progress === 15, "progress capped at goal (15)");
check(r1.points >= 15 * 10, `points include bonus (${r1.points})`);
check((await page.$('.btn--continue')) !== null, 'redeem card visible');
await page.tap('.btn--continue');
await page.tap('.btn--continue').catch(() => {});
await sleep(200);
check((await state()) === 'travel', 'continue enters travel (double tap ignored)');
await sleep(1200); await shot('05-travel');
await sleep(2800);
check((await state()) === 'playing', 'travel auto-enters Portugal');
check(await page.$eval('.hud-place-name', (e) => e.textContent) === 'Porto', 'HUD shows Porto');
await shot('06-porto');
const t1 = Date.now();
await autopilot(90000, 'item');
check((await state()) !== 'playing', `Portugal completed via autopilot in ${((Date.now() - t1) / 1000).toFixed(1)}s`);
await sleep(1500);
await page.tap('.btn--continue');
await sleep(300);
check((await state()) === 'final', 'final screen');
await shot('07-final');
const finalPts = await page.$eval('.final-wallet strong', (e) => Number(e.textContent));
check(finalPts >= 33 * 10 + 200, `final total shown (${finalPts})`);
await page.tap('.btn--cta');
await sleep(200);
check(logs.some((l) => l.includes('CTA clicked')), 'CTA console.log');
check(await page.$eval('.cta-confirm', (e) => e.textContent) === 'CTA clicked — demo only', 'CTA confirmation text');
check(page.url() === url, 'CTA did not navigate');

// Restart from final
await page.tap('.btn--restart-final');
await sleep(200);
check((await state()) === 'start', 'restart from final -> start');

// Repeated restarts from various states, including mid-redeem and mid-travel
for (let i = 0; i < 12; i++) {
  await page.tap('.btn--play'); await sleep(80);
  if (i % 3 === 1) {
    await autopilot(90000, 'item'); await sleep(1200);
    await page.tap('.btn--continue'); await sleep(500);
    check((await state()) === 'travel', `iteration ${i}: in travel`);
  } else if (i % 3 === 2) {
    await autopilot(1500, 'item');
  }
  await page.tap('.btn--restart'); await sleep(60);
  check((await state()) === 'start', `restart iteration ${i} -> start`);
  check(await page.$eval('#fx', (e) => e.childElementCount) === 0, `iteration ${i}: fx cleared`);
  check(await page.$eval('#scene-root', (e) => e.childElementCount) === 0, `iteration ${i}: scene cleared`);
}
await page.tap('.btn--play'); await sleep(100);
check((await dbg()).points === 0, 'points reset after restarts');

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

console.log(`\nALL CHECKS PASSED at ${W}x${H}`);
await browser.close();
