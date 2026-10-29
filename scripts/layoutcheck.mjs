// Dev-only: landscape rotate prompt, desktop frame, and mid-game resize/orientation checks.
import puppeteer from 'puppeteer-core';
import { MODE, withMode, chromeArgs } from './autopilot.mjs';
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = withMode((process.argv[2] ?? 'http://localhost:4173/') + '?seed=5');
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: chromeArgs() });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (c, m) => { if (!c) throw new Error('CHECK FAILED: ' + m); console.log('ok  ', m); };
const rotateShown = () => page.$eval('#rotate', (e) => !e.hidden);
const paused = () => page.$eval('#app', (e) => e.classList.contains('paused'));

await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(url, { waitUntil: 'networkidle0' });
check(await rotateShown(), 'phone landscape (844x390): rotate prompt shown');
check(await paused(), 'phone landscape: game paused');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(200);
check(!(await rotateShown()) && !(await paused()), 'back to portrait: prompt hidden, game resumed');

// Desktop landscape adapts (phone-sized frame), no prompt
await page.setViewport({ width: 1280, height: 800 });
await sleep(200);
check(!(await rotateShown()), 'desktop landscape (1280x800): no prompt, framed stage');
const stageW = await page.$eval('#stage', (e) => e.getBoundingClientRect().width);
check(stageW < 500, `desktop frame width ${stageW.toFixed(0)}px (phone-sized)`);

// Mid-game resize: start a run, resize, confirm the fox still follows and no errors
await page.setViewport({ width: 320, height: 568, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(200);
await page.tap('.btn--play'); await sleep(500);
await page.tap('.dest-btn[data-dest="brazil"]'); await sleep(1800);
await page.tap('.theme-btn[data-theme="food"]'); await sleep(500);
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(300);
if (MODE === '2d') {
  const before = await page.evaluate(() => window.passportQuest.debug.fox.y);
  await page.mouse.move(200, 760); await sleep(600);
  const after = await page.evaluate(() => window.passportQuest.debug.fox.y);
  check(after > before + 30, `after resize the fox still follows the pointer (y ${before.toFixed(0)} -> ${after.toFixed(0)})`);
} else {
  await page.mouse.move(40, 600); await sleep(600);
  const before = await page.evaluate(() => window.passportQuest.debug.fox.x);
  await page.mouse.move(350, 600); await sleep(600);
  const after = await page.evaluate(() => window.passportQuest.debug.fox.x);
  check(before < -0.8 && after > before + 1.5, `after resize Capi still follows the pointer (x ${before.toFixed(2)} -> ${after.toFixed(2)})`);
}
await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(200);
check(await rotateShown() && await paused(), 'rotating mid-game: prompt shown and game paused');
const n1 = await page.evaluate(() => window.passportQuest.debug.entities.map((e) => e.x).join());
await sleep(800);
const n2 = await page.evaluate(() => window.passportQuest.debug.entities.map((e) => e.x).join());
check(n1 === n2, 'world frozen while the rotate prompt is up');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(400);
check(!(await paused()), 'rotating back resumes');
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth || document.documentElement.scrollHeight > window.innerHeight);
check(!overflow, 'no document overflow after resizes');
check(errors.length === 0, `no errors (${errors.length})`);
console.log(`\nLAYOUT CHECKS PASSED (${MODE})`);
await browser.close();
