// Dev-only: renders the 3D model gallery (gallery.html on the dev server) to a PNG for visual review.
// Usage: node scripts/artcheck3d.mjs <out.png> [url]
import puppeteer from 'puppeteer-core';
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = process.argv[2]; const url = process.argv[3] ?? 'http://localhost:5173/gallery.html';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 900, height: 1100, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: out });
if (errors.length) { console.error(errors); process.exit(1); }
console.log('gallery written to', out);
await browser.close();
