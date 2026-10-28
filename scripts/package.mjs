// Builds the delivery ZIP: index.html at the ZIP root (runnable production build)
// plus readable source, docs and run instructions. Verifies root structure and byte size.
// Usage: node scripts/package.mjs   (run `npm run build` first; `npm run package` does both)
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const dist = join(root, 'dist');
const out = join(root, 'release');
const stage = join(out, 'stage');
const zipName = 'passport-quest-stage1.zip';
const zipPath = join(out, zipName);
const LIMIT = 5_000_000;

if (!existsSync(join(dist, 'index.html'))) { console.error('dist/index.html missing: run `npm run build` first'); process.exit(1); }

rmSync(out, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

// 1. Runnable build at the ZIP root.
cpSync(dist, stage, { recursive: true });

// 2. Readable source and project files under source/.
const src = join(stage, 'source');
mkdirSync(src, { recursive: true });
for (const f of ['src', 'scripts', 'docs', '.claude', 'index.html', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', '.nvmrc', 'README.md']) {
  if (existsSync(join(root, f))) cpSync(join(root, f), join(src, f), { recursive: true });
}
cpSync(join(root, 'README.md'), join(stage, 'README.md'));

// 3. Run instructions at the root.
writeFileSync(join(stage, 'RUN.txt'), `Passport Quest — Stage 1 build

RUN THE GAME (static server; file:// will not work because of ES modules):
  python3 -m http.server 8080        # from this folder, then open http://localhost:8080/
  or: npx serve .

Open it in a mobile viewport (e.g. Chrome DevTools device mode, 320x568 or 390x844) or on a phone on the same network.

CONTENTS
  index.html, assets/   production build (bundled JS, CSS, fonts; no external requests)
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
