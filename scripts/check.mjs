// Runs every gate in order: typecheck, build, bundle budget, static preview server, e2e at two sizes (3D) and once in 2D,
// layout checks, perf measurement (printed, never fails the run). Exits non-zero on the first red step.
// Usage: npm run check   (CHROME_PATH=/path/to/chrome overrides the browser used by the scripts)
import { spawn, spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BUDGET = 300_000; // bytes on disk for dist/, fonts included
const PORT = 4173;
const url = `http://localhost:${PORT}/`;

const run = (cmd, args, env = {}) => {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.status !== 0) { console.error(`\nFAILED: ${cmd} ${args.join(' ')}`); process.exit(r.status ?? 1); }
};

run('npx', ['tsc', '--noEmit']);
run('npx', ['vite', 'build']);

const size = (d) => readdirSync(d).reduce((n, f) => { const p = join(d, f); return n + (statSync(p).isDirectory() ? size(p) : statSync(p).size); }, 0);
const total = size('dist');
console.log(`\nBundle: ${total} bytes on disk (budget ${BUDGET})`);
if (total > BUDGET) { console.error('FAILED: bundle over budget'); process.exit(1); }

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const up = async () => {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(url)).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`preview server did not start on ${PORT}`);
};
try {
  await up();
  run('node', ['scripts/e2e.mjs', url, '320', '568']);
  run('node', ['scripts/e2e.mjs', url, '390', '844']);
  run('node', ['scripts/e2e.mjs', url, '320', '568'], { MODE: '2d' }); // the SVG fallback runner
  run('node', ['scripts/layoutcheck.mjs', url]);
  console.log('\n$ node scripts/perfcheck.mjs (informational)');
  spawnSync('node', ['scripts/perfcheck.mjs', url, '8'], { stdio: 'inherit' });
  console.log('\nALL GATES GREEN');
} finally {
  server.kill();
}
