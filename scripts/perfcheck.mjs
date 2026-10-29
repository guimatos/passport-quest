// Dev-only: measures fps/frame time/node count at 6x CPU throttle during the busiest scene (Rio Party at night).
// Usage: node scripts/perfcheck.mjs [url] [seconds]
import puppeteer from 'puppeteer-core';
import { MODE, withMode, installAutopilot, chromeArgs } from './autopilot.mjs';
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const base = process.argv[2] ?? 'http://localhost:5173/';
const url = withMode(base + (base.includes('?') ? '&' : '?') + 'seed=7&perf=1');
const seconds = Number(process.argv[3] ?? 15);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: chromeArgs('--enable-precise-memory-info') });
const page = await browser.newPage();
await page.setViewport({ width: 320, height: 568, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto(url, { waitUntil: 'networkidle0' });
await installAutopilot(page);
await page.tap('.btn--play'); await sleep(500); await page.tap('.dest-btn[data-dest="brazil"]'); await sleep(1900); await page.tap('.theme-btn[data-theme="party"]'); await sleep(500);
const cdp = await page.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
await cdp.send('Performance.enable');
// Main-thread cost over the window: renderer task/script/style/layout durations (cumulative seconds, so take deltas).
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
const m0 = await metrics();
const samples = [];
const run = page.evaluate((ms) => window.__autopilot(ms), seconds * 1000);
for (let i = 0; i < seconds * 2; i++) { await sleep(500); samples.push(await page.evaluate(() => window.passportQuest.debug.perf)); }
await run;
const m1 = await metrics();
const delta = (k) => +((m1[k] - m0[k]) * 1000).toFixed(0); // ms
const mem = await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
const valid = samples.filter((s) => s && s.fps > 0);
const avg = (k) => valid.reduce((n, s) => n + s[k], 0) / valid.length;
const result = { mode: MODE, throttle: '6x', seconds, fpsAvg: +avg('fps').toFixed(1), fpsMin: +Math.min(...valid.map((s) => s.fps)).toFixed(1), frameAvgMs: +avg('avgMs').toFixed(2), frameWorstMs: +Math.max(...valid.map((s) => s.worstMs)).toFixed(0), jsAvgMs: +avg('workMs').toFixed(2), jsWorstMs: +Math.max(...valid.map((s) => s.workWorstMs)).toFixed(1), nodesAvg: Math.round(avg('nodes')), draws: await page.evaluate(() => window.passportQuest.debug.draws), mainThreadMs: { task: delta('TaskDuration'), script: delta('ScriptDuration'), style: delta('RecalcStyleDuration'), layout: delta('LayoutDuration') }, busyPct: +((m1.TaskDuration - m0.TaskDuration) / seconds * 100).toFixed(1), heapMB: mem };
console.log(JSON.stringify(result));
await browser.close();
