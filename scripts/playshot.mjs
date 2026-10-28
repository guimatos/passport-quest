// Dev-only: captures mid-play frames for visual review. Usage: node scripts/playshot.mjs <outdir> [w] [h]
import puppeteer from 'puppeteer-core';
const out = process.argv[2]; const W = Number(process.argv[3] ?? 320), H = Number(process.argv[4] ?? 568);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto('http://localhost:5173/?seed=11', { waitUntil: 'networkidle0' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.evaluate(() => {
  window.__autopilot = (ms) => new Promise((res) => {
    const g = window.passportQuest, stage = document.getElementById('stage'); const end = performance.now() + ms;
    const step = () => { const d = g.debug; if (d.state !== 'playing' || performance.now() > end) return res();
      const ahead = d.entities.filter((e) => e.x > d.fox.x - 10 && e.kind === 'item').sort((a, b) => a.x - b.x);
      if (ahead.length) { const p = d.toScreen(0, ahead[0].y); stage.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: p.y, isPrimary: true, pointerType: 'mouse', bubbles: true })); }
      requestAnimationFrame(step); }; step(); });
});
await page.tap('.btn--play'); await sleep(1800); await page.screenshot({ path: `${out}/intro-rio.png` }); await page.tap('.theme-btn[data-theme="party"]'); await sleep(3000);
await page.evaluate(() => window.__autopilot(2500));
await page.screenshot({ path: `${out}/play-rio-a.png` });
await page.evaluate(() => window.__autopilot(1200));
await page.screenshot({ path: `${out}/play-rio-b.png` });
await page.evaluate(() => window.__autopilot(60000));
await sleep(600); await page.screenshot({ path: `${out}/play-rio-done.png` });
await sleep(1200); await page.tap('.btn--continue'); await sleep(300); await page.tap('.btn--continue'); await sleep(2800); await page.screenshot({ path: `${out}/intro-porto.png` }); await page.tap('.theme-btn[data-theme="culture"]'); await sleep(3200);
await page.evaluate(() => window.__autopilot(2500));
await page.screenshot({ path: `${out}/play-porto-a.png` });
await page.evaluate(() => window.__autopilot(6000));
await page.screenshot({ path: `${out}/play-porto-b.png` });
await browser.close();
