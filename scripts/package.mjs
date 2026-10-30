// Builds the delivery ZIP: index.html at the ZIP root (runnable production build)
// plus readable source, docs and run instructions. Verifies root structure and byte size.
// Usage: node scripts/package.mjs [stageN]   (run `npm run build` first; `npm run package -- stage3` does both)
// The stage argument (default stage3) names the ZIP and the RUN.txt label; earlier stages' ZIPs are left in place.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const dist = join(root, 'dist');
const out = join(root, 'release');
const stage = join(out, 'stage');
const stageId = (process.argv[2] ?? process.env.STAGE ?? 'stage3').toLowerCase();
if (!/^stage\d+[a-z]?$/.test(stageId)) { console.error(`stage must look like stage3, got "${stageId}"`); process.exit(1); }
const stageLabel = stageId.replace(/^stage/, 'Stage ');
const zipName = `passport-quest-${stageId}.zip`;
const zipPath = join(out, zipName);
const LIMIT = 5_000_000;

if (!existsSync(join(dist, 'index.html'))) { console.error('dist/index.html missing: run `npm run build` first'); process.exit(1); }

rmSync(stage, { recursive: true, force: true }); // only the staging folder: other stages' ZIPs stay
mkdirSync(stage, { recursive: true });

// 1. Runnable build at the ZIP root.
cpSync(dist, stage, { recursive: true });

// 2. Readable source and project files under source/.
const src = join(stage, 'source');
mkdirSync(src, { recursive: true });
for (const f of ['src', 'scripts', 'docs', 'plans', '.claude', '.github', 'index.html', 'gallery.html', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', '.nvmrc', 'README.md']) {
  if (existsSync(join(root, f))) cpSync(join(root, f), join(src, f), { recursive: true });
}
cpSync(join(root, 'README.md'), join(stage, 'README.md'));

// 3. Run instructions at the root.
writeFileSync(join(stage, 'RUN.txt'), `Passport Quest — ${stageLabel} build

RUN THE GAME
  Double-click index.html (it is self-contained: one file, no server needed), or serve this folder:
  python3 -m http.server 8080        # then open http://localhost:8080/
  or: npx serve .

Open it in a mobile viewport (e.g. Chrome DevTools device mode, 320x568 or 390x844) or on a phone on the same network.
The run is a WebGL 3D world by default; add ?mode=2d to the URL for the SVG runner (also used automatically without WebGL).

CONTENTS
  index.html            production build: JS, CSS and fonts inlined in one file; no external requests
  source/               readable TypeScript source, scripts, docs, configs
  README.md             build/run instructions, testing results, credits

REBUILD FROM SOURCE
  cd source && nvm use && npm install && npm run build
`);

// 4. Zip with relative paths so index.html sits at the ZIP root.
execSync(`cd "${stage}" && rm -f "${zipPath}" && zip -qr -X "${zipPath}" .`, { stdio: 'inherit' });
rmSync(stage, { recursive: true, force: true });

// 5. Verify.
const size = statSync(zipPath).size;
const listing = execSync(`unzip -Z1 "${zipPath}"`).toString().trim().split('\n');
const rootEntries = [...new Set(listing.map((p) => p.split('/')[0]))].sort();
const ok = listing.includes('index.html') && size <= LIMIT;
console.log(`ZIP: ${zipPath}`);
console.log(`Size: ${size} bytes (limit ${LIMIT})`);
console.log(`Root entries: ${rootEntries.join(', ')}`);
console.log(`Files: ${listing.length}`);
console.log(ok ? 'OK: index.html at root and within size limit' : 'FAIL: structure or size check');
if (!ok) process.exit(1);
