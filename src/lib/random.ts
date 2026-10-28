/** Small seeded PRNG (mulberry32) so test runs can be made deterministic with ?seed=N. */
export function createRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromUrl(): number {
  const s = new URLSearchParams(location.search).get('seed');
  return s ? Number(s) || 1 : (Date.now() ^ (Math.random() * 1e9)) >>> 0;
}
