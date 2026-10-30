// Post-build step: folds dist/ into one self-contained index.html so the game runs both from a
// static HTTP server and when index.html is opened directly as a file (double-click).
// Why: a module script with `crossorigin` is blocked by Chrome's CORS policy on file:// (origin "null").
// The bundle is a single ES2019 chunk with no import/export or import.meta, so it runs unchanged as a
// classic script inside a strict-mode function. The stylesheet is inlined with the woff2 fonts as data
// URIs (every target browser reads woff2; the .woff copies are dropped). The assets/ folder is removed.
// Usage: node scripts/inline.mjs   (npm run build runs it after vite build)
import { readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = resolve(new URL('../dist', import.meta.url).pathname);
const assets = join(dist, 'assets');
const htmlPath = join(dist, 'index.html');
let html = readFileSync(htmlPath, 'utf8');

const scriptTag = html.match(/<script type="module"[^>]*src="\.\/assets\/([^"]+)"><\/script>\s*/);
const styleTag = html.match(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+)">\s*/);
if (!scriptTag || !styleTag) { console.error('inline: expected one module script and one stylesheet in dist/index.html'); process.exit(1); }

let js = readFileSync(join(assets, scriptTag[1]), 'utf8');
if (/\bimport\s*[.(]|^\s*(import|export)\b/m.test(js)) { console.error('inline: bundle still uses module syntax'); process.exit(1); }
js = js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--'); // never close the tag or open an HTML comment from inside the script

let css = readFileSync(join(assets, styleTag[1]), 'utf8');
css = css.replace(/src:([^;}]+)/g, (m, srcs) => {
  const woff2 = srcs.match(/url\(([^)]+\.woff2)\)/);
  if (!woff2) return m;
  const file = woff2[1].replace(/^["']?\.\//, '').replace(/["']$/, '');
  const data = readFileSync(join(assets, file)).toString('base64');
  return `src:url(data:font/woff2;base64,${data}) format("woff2")`;
}).replace(/<\/style/gi, '<\\/style');

html = html.replace(scriptTag[0], '').replace(styleTag[0], `<style>${css}</style>\n    `);
html = html.replace(/\s*<\/body>/, `\n    <script>(function(){"use strict";\n${js}\n})();</script>\n  </body>`);
writeFileSync(htmlPath, html);
rmSync(assets, { recursive: true, force: true });
console.log(`inline: dist/index.html is self-contained, ${statSync(htmlPath).size} bytes`);
