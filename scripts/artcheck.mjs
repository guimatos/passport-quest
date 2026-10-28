// Renders art pieces large for visual inspection.
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto('http://localhost:5173/?seed=3', { waitUntil: 'networkidle0' });
const out = process.argv[2];
await page.evaluate(async () => {
  const m = await import('/src/art/fox.ts');
  const c = await import('/src/art/capy.ts');
  const it = await import('/src/art/items.ts');
  const d = await import('/src/data/destinations.ts');
  const costumes = ['chef', 'carnival', 'panama', 'saojoao', 'conductor'];
  const html = `
   <div style="position:fixed;inset:0;background:#FFF6E8;z-index:999;padding:10px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start">
     ${costumes.map((k) => `<svg viewBox="-70 -80 140 150" width="120" height="128" style="background:#F3DFA3"><g>${c.capyGroup('run', k)}</g></svg>`).join('')}
     <svg viewBox="-70 -80 140 150" width="120" height="128" style="background:#F3DFA3"><g>${c.capyGroup('ouch', 'panama')}</g></svg>
     ${costumes.map((k) => `<svg viewBox="-64 -88 128 150" width="90" height="105" style="background:#201338">${c.capyPortrait('happy', k)}</svg>`).join('')}
     <svg viewBox="-64 -88 128 150" width="90" height="105" style="background:#201338">${c.capyPortrait('cheer', 'carnival')}</svg>
     <svg viewBox="-60 -66 120 136" width="90" height="102" style="background:#201338">${m.foxPortrait('happy')}</svg>
     ${d.ALL_ITEMS.map(i => `<svg viewBox="-30 -30 60 60" width="70" height="70" style="background:#E9CF8A;border-radius:8px">${it.ITEM_ART[i.id]()}</svg>`).join('')}
     ${d.ALL_ITEMS.map(i => `<svg viewBox="-30 -30 60 60" width="40" height="40" style="background:#201338;color:#777;border-radius:8px">${it.ITEM_ART[i.id]({silhouette:true})}</svg>`).join('')}
     ${Object.keys(it.OBSTACLE_ART).map(k => `<svg viewBox="-30 -30 60 60" width="70" height="70" style="background:#C9C2B4;border-radius:8px">${it.OBSTACLE_ART[k]}</svg>`).join('')}
   </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
});
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: out });
await browser.close();
