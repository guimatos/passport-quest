import type { DestinationDef, ThemeDef, ThemeId } from '../data/destinations';
import { SCENE_ART, WATER } from '../art/scenes';
import { MeshBuilder, hex, mix, type RGB } from '../gl/mesh';
import { makeMesh, type Mesh, type Env } from '../gl/renderer';
import { buildItem } from './models';

/**
 * The 3D worlds: Copacabana for Rio, the Ribeira quay for Porto. Each world
 * is a fixed base (ground, water, far landmarks, sky) plus scenery chunks
 * that stream toward the camera and recycle, plus a few "movers" (boats,
 * clouds, the cable car, balloons, a tram). Theme furniture and the night
 * sky of the party themes are baked into the chunks and the sky at build
 * time; nothing here allocates per frame. Palette matches the SVG scenes.
 */
export const CHUNK_LEN = 24;
export const CHUNKS_VISIBLE = 7;
export const WRAP = CHUNK_LEN * CHUNKS_VISIBLE;
/** z of the nearest chunk's origin at scroll 0 (chunks span [origin - CHUNK_LEN, origin]). */
export const CHUNK_NEAR_Z = 14;

export interface Mover {
  mesh: Mesh;
  x: number; y: number; z: number;
  /** Streams with the world (boats, balloons, tram) or stays put (clouds, cable car). */
  scroll: boolean;
  /** Extra z speed (world units/s) on top of the world speed (the tram runs toward the camera). */
  boost?: number;
  bob?: number;
  drift?: number;
  rise?: number;
  riseMax?: number;
  path?: { from: [number, number, number]; to: [number, number, number]; period: number };
  phase: number;
  scale: number;
  rotY: number;
  unlit?: boolean;
}

export interface World {
  name: string;
  night: boolean;
  env: Env;
  sky: Mesh;
  base: Mesh;
  water: Mesh | null;
  waterWave: number;
  far: Mesh;
  chunks: Mesh[];
  movers: Mover[];
}

const INK = hex('#201338'), CREAM = hex('#FFF6E8'), ORANGE = hex('#F58324'), YELLOW = hex('#F2C94C'), GREEN = hex('#1FA463'), RED = hex('#D9534F');
const X = Math.PI / 2;

/** Tiny deterministic generator for scenery placement (independent of the game's seeded RNG). */
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }

// ---------- shared props ----------

function palm(b: MeshBuilder, x: number, z: number, h: number, lean: number, seed: number) {
  const trunk = hex('#8B5A2B'), leaf = hex('#2E8B57'), leaf2 = hex('#3AA66A');
  b.cyl(0.16, 0.11, h, 6, trunk, { p: [x + lean / 2, h / 2, z], r: [0, 0, -Math.atan2(lean, h)] });
  const tx = x + lean, ty = h;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 + seed;
    b.box(1.9, 0.06, 0.5, i % 2 ? leaf : leaf2, { p: [tx + Math.cos(a) * 0.8, ty + 0.1 - 0.25, z + Math.sin(a) * 0.8], r: [0, -a, -0.45] });
  }
  b.sphere(0.14, 5, hex('#7A4B2A'), { p: [tx + 0.1, ty - 0.1, z] });
  b.sphere(0.14, 5, hex('#7A4B2A'), { p: [tx - 0.12, ty - 0.14, z + 0.1] });
}

function umbrella(b: MeshBuilder, x: number, z: number, c1: RGB, c2: RGB) {
  b.box(0.06, 1.7, 0.06, CREAM, { p: [x, 0.85, z] });
  b.cyl(0.95, 0, 0.45, 10, c1, { p: [x, 1.75, z] }, 1, false, c2);
}

function kiosk(b: MeshBuilder, x: number, z: number) {
  b.box(1.8, 1.5, 1.6, CREAM, { p: [x, 0.75, z] });
  b.box(1.84, 0.3, 1.64, GREEN, { p: [x, 1.4, z] });
  b.cyl(1.4, 0, 0.7, 8, ORANGE, { p: [x, 1.9, z] });
  b.box(1.2, 0.5, 0.2, hex('#5EC8F2'), { p: [x + 0.9, 0.95, z] });
  b.box(1.6, 0.12, 0.3, hex('#F3DFA3'), { p: [x + 0.95, 0.65, z] });
}

function lightPoles(b: MeshBuilder, x: number, z0: number, z1: number, night: boolean) {
  const n = 2;
  for (let i = 0; i <= n; i++) {
    const z = z0 + (z1 - z0) * (i / n);
    b.box(0.12, 3.2, 0.12, INK, { p: [x, 1.6, z] });
  }
  const span = (z1 - z0) / n;
  for (let i = 0; i < n; i++) {
    const za = z0 + span * i;
    for (let k = 0; k <= 8; k++) {
      const u = k / 8, z = za + span * u, sag = Math.sin(u * Math.PI) * 0.5;
      if (k < 8) b.box(0.03, 0.03, span / 8 + 0.02, INK, { p: [x, 3.1 - sag, z + span / 16] });
      if (k % 2) b.sphere(0.1, 5, night ? YELLOW : CREAM, { p: [x, 3.0 - sag, z] }, night ? 0 : 1);
    }
  }
}

function facade(b: MeshBuilder, x: number, z: number, w: number, h: number, col: RGB, r: () => number) {
  b.box(4.5, h, w, col, { p: [x - 2.25, h / 2, z] });
  b.box(4.7, 0.35, w + 0.2, hex('#B5563C'), { p: [x - 2.25, h + 0.1, z] });
  const rows = Math.max(1, Math.floor(h / 2.6)), cols = w > 3.2 ? 2 : 1;
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const wy = 1.5 + i * 2.6, wz = z + (j - (cols - 1) / 2) * (w / 2.2);
    b.box(0.12, 0.9, 0.6, hex('#2B2A4A'), { p: [x - 0.02, wy, wz] });
    if (r() < 0.6) b.box(0.3, 0.08, 0.8, INK, { p: [x + 0.1, wy - 0.5, wz] });
  }
  if (r() < 0.4) b.box(0.08, 1.2, 1.0, hex('#5B8BD0'), { p: [x + 0.02, h * 0.5, z + w * 0.25] });
}

function cafeTable(b: MeshBuilder, x: number, z: number) {
  b.box(0.06, 0.8, 0.06, INK, { p: [x, 0.4, z] });
  b.cyl(0.45, 0.45, 0.05, 8, CREAM, { p: [x, 0.8, z] });
  b.box(0.05, 2.2, 0.05, CREAM, { p: [x, 1.1, z] });
  b.cyl(0.9, 0, 0.35, 8, RED, { p: [x, 2.25, z] }, 1, false, CREAM);
  for (const s of [-1, 1]) b.box(0.4, 0.45, 0.4, hex('#5A3A20'), { p: [x, 0.22, z + s * 0.6] });
}

function bridge(b: MeshBuilder, z: number) {
  const iron = hex('#4A4F5A');
  const x0 = 5.5, x1 = 44, top = 8.6;
  const dx0 = -12, dx1 = x1 + 4;
  b.box(dx1 - dx0, 0.5, 3.2, iron, { p: [(dx0 + dx1) / 2, top, z] });
  b.box(dx1 - dx0, 0.9, 0.08, iron, { p: [(dx0 + dx1) / 2, top + 0.6, z - 1.6] });
  b.box(dx1 - dx0, 0.9, 0.08, iron, { p: [(dx0 + dx1) / 2, top + 0.6, z + 1.6] });
  const n = 14;
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n;
    const ax = x0 + (x1 - x0) * u0, bx = x0 + (x1 - x0) * u1;
    const ay = top - 0.6 - 7 * Math.pow(2 * u0 - 1, 2), by = top - 0.6 - 7 * Math.pow(2 * u1 - 1, 2);
    const len = Math.hypot(bx - ax, by - ay);
    for (const s of [-1.2, 1.2]) b.box(len + 0.1, 0.5, 0.35, iron, { p: [(ax + bx) / 2, (ay + by) / 2, z + s], r: [0, 0, Math.atan2(by - ay, bx - ax)] });
    if (i % 2) for (const s of [-1.2, 1.2]) b.box(0.18, top - 0.3 - (ay + by) / 2, 0.18, iron, { p: [(ax + bx) / 2, ((ay + by) / 2 + top - 0.3) / 2, z + s] });
  }
  for (const s of [-1.2, 1.2]) { b.box(0.6, 9, 0.6, hex('#8A8F99'), { p: [x0 - 0.6, 4.5, z + s] }); b.box(0.8, 9, 0.8, hex('#8A8F99'), { p: [x1 + 2, 4.5, z + s] }); }
  for (const s of [-1.2, 1.2]) b.box(0.8, 9, 0.8, hex('#8A8F99'), { p: [-9, 4.5, z + s] });
}

function cellar(b: MeshBuilder, x: number, y: number, z: number, w: number, h: number, ry: number) {
  b.box(w, h, w * 0.8, CREAM, { p: [x, y + h / 2, z], r: [0, ry, 0] });
  b.box(w + 0.4, 0.5, w * 0.8 + 0.4, hex('#B5563C'), { p: [x, y + h + 0.1, z], r: [0, ry, 0] });
}

// ---------- sky and water ----------

function skyMesh(top: RGB, horizon: RGB, night: boolean, sun: { x: number; y: number; col: RGB; r: number }) {
  const s = new MeshBuilder();
  const strips = 24;
  for (let i = 0; i < strips; i++) {
    const y0 = -40 + (i / strips) * 220, y1 = -40 + ((i + 1) / strips) * 220;
    const k = Math.pow(i / (strips - 1), 0.65);
    s.quad([-420, y0, -150], [420, y0, -150], [420, y1, -150], [-420, y1, -150], mix(horizon, top, k), 0);
  }
  s.disc(sun.r, 14, sun.col, { p: [sun.x, sun.y, -149], r: [X, 0, 0] }, 0);
  if (night) {
    s.disc(sun.r * 0.8, 12, mix(top, hex('#4B2A8C'), 0.5), { p: [sun.x + sun.r * 0.45, sun.y + sun.r * 0.3, -148.5], r: [X, 0, 0] }, 0);
    const r = rng(7);
    for (let i = 0; i < 80; i++) s.disc(0.5 + r() * 0.5, 4, CREAM, { p: [-300 + r() * 600, 14 + r() * 110, -149], r: [X, 0, 0] }, 0);
  } else {
    s.disc(sun.r * 1.35, 14, mix(horizon, sun.col, 0.35), { p: [sun.x, sun.y, -149.5], r: [X, 0, 0] }, 0);
  }
  return makeMesh(s.build());
}

function waterMesh(x0: number, deep: RGB, light: RGB) {
  const b = new MeshBuilder();
  const w = 110, d = 200;
  b.plane(w, d, deep, { p: [x0 + w / 2, -0.06, -70] }, 1, 14, 40, (ix) => mix(light, deep, Math.min(1, ix / 6)));
  return makeMesh(b.build());
}

function cloudMesh() {
  const b = new MeshBuilder();
  b.sphere(2.2, 8, CREAM, { p: [0, 0, 0], s: [1.6, 0.7, 1] }, 0.25);
  b.sphere(1.6, 8, CREAM, { p: [2.4, 0.4, 0], s: [1.2, 0.8, 1] }, 0.25);
  b.sphere(1.4, 8, CREAM, { p: [-2.4, 0.3, 0] }, 0.25);
  return makeMesh(b.build());
}

// ---------- Rio ----------

function rio(theme: ThemeId, night: boolean): World {
  const art = SCENE_ART.brazil, w = { ...WATER.brazil, ...art.variants[theme]?.water };
  const sand = hex('#F2DEA6'), sandDark = hex('#E4C98B'), wet = hex('#D9C58E');
  const skyTop = night ? hex('#1A1040') : hex('#3FB3EE'), horizon = night ? hex('#8A4FA8') : hex('#CDEFFB');
  const sky = skyMesh(skyTop, horizon, night, night ? { x: 26, y: 50, col: hex('#FFF0C2'), r: 7 } : { x: 44, y: 60, col: hex('#FFE07A'), r: 10 });

  const base = new MeshBuilder();
  base.plane(160, 200, sand, { p: [0, -0.05, -70] });
  base.plane(1.4, 200, wet, { p: [3.9, -0.03, -70] });                                   // wet sand
  base.plane(0.5, 200, CREAM, { p: [4.5, -0.02, -70] }, 0.6);                            // foam line
  base.plane(3.2, 200, hex('#5A5A66'), { p: [-8.2, -0.03, -70] });                       // avenue
  base.plane(0.3, 200, CREAM, { p: [-8.2, -0.02, -70] });                                // lane line
  const far = new MeshBuilder();
  const rock = night ? hex('#3C3558') : hex('#6E8B6A'), rock2 = night ? hex('#2F2A48') : hex('#5E7A5C');
  far.sphere(1, 12, rock, { p: [30, -4, -120], s: [8, 17, 8] });                         // Sugarloaf
  far.sphere(1, 10, rock2, { p: [20, -3, -118], s: [6, 9, 6] });                         // Morro da Urca
  far.box(0.5, 10, 0.5, INK, { p: [-8, 5, -112] });                                      // cable pylon
  far.box(39, 0.14, 0.14, INK, { p: [11, 15.5, -114], r: [0, 0, Math.atan2(13, 38)] }); // cable to the summit
  for (const [x, sx, sy] of [[-70, 30, 9], [-40, 22, 7], [-12, 16, 5], [50, 24, 6], [85, 30, 8]]) far.sphere(1, 10, night ? hex('#2A2446') : hex('#4E8B57'), { p: [x, -1, -125], s: [sx, sy, 14] });
  for (let i = 0; i < 10; i++) { const x = -70 + i * 7; far.box(4, 8 + (i % 3) * 4, 4, night ? hex('#2E2650') : hex('#E8E2D6'), { p: [x, 4 + (i % 3) * 2, -100] }); }

  const chunks: Mesh[] = [];
  for (let v = 0; v < 3; v++) {
    const r = rng(11 + v);
    const b = new MeshBuilder();
    // Copacabana wave mosaic on the promenade
    b.plane(3.2, CHUNK_LEN, CREAM, { p: [-4.8, 0, -CHUNK_LEN / 2] }, 1, 6, 24, (_ix, _iz, x, z) => (((x + 4.8 + Math.sin((z + v * CHUNK_LEN) * 0.4) * 1.6 + 100) % 2.4) < 1.2 ? INK : CREAM));
    for (const x of [-3.0, 3.0]) b.plane(1.0, CHUNK_LEN, sandDark, { p: [x, -0.01, -CHUNK_LEN / 2] }, 1, 1, 12, (_ix, iz) => (iz % 2 ? sandDark : sand));
    for (let i = 0; i < 3; i++) palm(b, -3.6 - r() * 0.4, -2 - i * 8 - r() * 3, 3.2 + r() * 1.6, (r() - 0.5) * 1.2, r() * 6);
    for (let i = 0; i < 2; i++) umbrella(b, 3.5 + r() * 0.3, -5 - i * 11 - r() * 4, i % 2 ? ORANGE : hex('#5EC8F2'), CREAM);
    for (let i = 0; i < 3; i++) { const x = -11 - r() * 10, h = 5 + r() * 9; b.box(4 + r() * 3, h, 5, night ? hex('#3A3160') : mix(CREAM, hex('#F6C9A8'), r()), { p: [x, h / 2, -4 - i * 8] }); }
    if (theme === 'food' && v !== 1) kiosk(b, -5.2, -14 - v * 2);
    if (theme === 'party') lightPoles(b, -3.3, -CHUNK_LEN + 1, -1, night);
    if (theme === 'culture' && v === 1) { b.box(0.08, 1.2, 4, CREAM, { p: [3.4, 1.0, -12] }); b.box(0.1, 1.6, 0.1, INK, { p: [3.4, 0.8, -14] }); b.box(0.1, 1.6, 0.1, INK, { p: [3.4, 0.8, -10] }); } // footvolley net
    chunks.push(makeMesh(b.build()));
  }

  const movers: Mover[] = [];
  const cloud = cloudMesh();
  for (let i = 0; i < 4; i++) movers.push({ mesh: cloud, x: -60 + i * 40, y: 30 + (i % 2) * 8, z: -120 - i * 5, scroll: false, drift: 0.6 + i * 0.2, phase: i, scale: 1.6 + (i % 3) * 0.5, rotY: 0 });
  const boat = new MeshBuilder();
  boat.box(1.6, 0.3, 0.7, CREAM, { p: [0, 0.1, 0] }); boat.box(0.06, 1.6, 0.06, INK, { p: [0, 0.9, 0] }); boat.tri([0.05, 1.6, 0], [0.75, 0.4, 0], [0.05, 0.3, 0], ORANGE); boat.tri([0.05, 1.6, 0], [0.05, 0.3, 0], [0.75, 0.4, 0], ORANGE);
  const boatMesh = makeMesh(boat.build());
  for (let i = 0; i < 3; i++) movers.push({ mesh: boatMesh, x: 12 + i * 9, y: 0, z: -30 - i * 55, scroll: true, bob: 0.08, phase: i * 2, scale: 1 + i * 0.2, rotY: 0.4 + i });
  if (theme === 'culture') { const cab = buildItem('bondinho'); movers.push({ mesh: cab, x: 0, y: 0, z: 0, scroll: false, path: { from: [-8, 9.5, -112], to: [30, 22.5, -116], period: 26 }, phase: 0, scale: 3.5, rotY: 0.3 }); }

  return {
    name: `brazil:${theme}:${night ? 'night' : 'day'}`, night,
    env: { horizon, light: [-0.5, 1, 0.6], ambient: night ? 0.5 : 0.62, intensity: night ? 0.68 : 1, fogNear: 45, fogFar: 135 },
    sky, base: makeMesh(base.build()), water: waterMesh(4.6, hex(w.deep), hex(w.light)), waterWave: 0.09, far: makeMesh(far.build()), chunks, movers,
  };
}

// ---------- Porto ----------

function porto(theme: ThemeId, night: boolean): World {
  const art = SCENE_ART.portugal, w = { ...WATER.portugal, ...art.variants[theme]?.water };
  const quay = hex('#B8B1A3'), quayDark = hex('#A39C8E'), curb = hex('#CFC8BA');
  const skyTop = night ? hex('#14123A') : hex('#7FA7E8'), horizon = night ? hex('#7A3F6E') : hex('#FFE1B8');
  const sky = skyMesh(skyTop, horizon, night, night ? { x: -30, y: 48, col: hex('#FFF0C2'), r: 7 } : { x: -40, y: 26, col: hex('#FFE8A8'), r: 11 });

  const base = new MeshBuilder();
  base.plane(160, 200, quay, { p: [0, -0.05, -70] });
  base.plane(1.0, 200, curb, { p: [3.7, -0.02, -70] });                                  // granite curb
  base.plane(2.0, 200, hex('#CBC4B6'), { p: [-4.2, -0.03, -70] });                       // pavement
  const far = new MeshBuilder();
  far.sphere(1, 12, night ? hex('#2A2446') : hex('#6E8B5A'), { p: [48, -4, -118], s: [46, 12, 26] });   // Gaia hillside
  const fr = rng(3);
  for (let i = 0; i < 9; i++) cellar(far, 20 + i * 6 + fr() * 3, 2 + Math.sin(i) * 1.5 + i * 0.5, -108 - fr() * 6, 3 + fr() * 2, 2.5 + fr() * 2, fr() * 0.4);
  for (let i = 0; i < 9; i++) { const h = 8 + (i % 4) * 4; far.box(5, h, 5, night ? hex('#2E2650') : mix(hex('#E8B04B'), CREAM, (i % 3) / 2), { p: [-60 + i * 6.5, h / 2, -104] }); }
  far.box(0.6, 26, 0.6, night ? hex('#3A3160') : hex('#D8D2C4'), { p: [-30, 13, -106] });               // Clérigos tower
  far.box(1.2, 2, 1.2, hex('#B5563C'), { p: [-30, 27, -106] });

  const chunks: Mesh[] = [];
  const facadeCols = [hex('#E8B04B'), CREAM, hex('#5B8BD0'), hex('#E9A3A3'), hex('#C96A3F'), hex('#F3E3B8')];
  for (let v = 0; v < 3; v++) {
    const r = rng(21 + v);
    const b = new MeshBuilder();
    b.plane(6.4, CHUNK_LEN, quay, { p: [0, 0, -CHUNK_LEN / 2] }, 1, 12, 60, () => mix(quay, quayDark, r() * 0.7));   // cobbles
    for (let i = 0; i < 4; i++) b.cyl(0.14, 0.12, 0.6, 6, hex('#3E3A44'), { p: [3.9, 0.3, -2 - i * 6] });       // bollards
    let z = -0.5;
    while (z > -CHUNK_LEN + 2) { const bw = 2.6 + r() * 1.6; facade(b, -5.2, z - bw / 2, bw, 5 + r() * 5, facadeCols[Math.floor(r() * facadeCols.length)], r); z -= bw + 0.15; }
    if (theme === 'food') for (let i = 0; i < 2; i++) cafeTable(b, -4.0, -5 - i * 10 - r() * 3);
    if (theme === 'party') lightPoles(b, -3.3, -CHUNK_LEN + 1, -1, night);
    if (theme === 'culture') { b.box(0.08, 0.05, CHUNK_LEN, hex('#6B6B75'), { p: [-3.75, 0.0, -CHUNK_LEN / 2] }); b.box(0.08, 0.05, CHUNK_LEN, hex('#6B6B75'), { p: [-4.45, 0.0, -CHUNK_LEN / 2] }); }   // tram rails
    if (v === 2) bridge(b, -12);
    chunks.push(makeMesh(b.build()));
  }

  const movers: Mover[] = [];
  const rab = new MeshBuilder();
  rab.box(2.6, 0.4, 0.9, hex('#8B5A2B'), { p: [0, 0.15, 0] }); rab.box(0.08, 2.2, 0.08, hex('#3E2412'), { p: [0.2, 1.2, 0] });
  rab.tri([0.25, 2.2, 0], [1.4, 1.1, 0], [0.25, 0.5, 0], CREAM); rab.tri([0.25, 2.2, 0], [0.25, 0.5, 0], [1.4, 1.1, 0], CREAM);
  for (const x of [-0.8, -0.3, 0.2]) rab.cyl(0.18, 0.18, 0.4, 6, hex('#5A3A20'), { p: [x, 0.45, 0], r: [0, 0, X] });
  const rabMesh = makeMesh(rab.build());
  for (let i = 0; i < 3; i++) movers.push({ mesh: rabMesh, x: 9 + i * 7, y: 0, z: -20 - i * 50, scroll: true, bob: 0.06, phase: i * 1.7, scale: 1, rotY: 0.2 + i * 0.5 });
  if (theme === 'party') {
    const bal = buildItem('balloon');
    for (let i = 0; i < 5; i++) movers.push({ mesh: bal, x: 5 + i * 4, y: 3 + i * 2.5, z: -15 - i * 30, scroll: true, rise: 0.5, riseMax: 24, phase: i, scale: 2.4, rotY: i, unlit: night });
  }
  if (theme === 'culture') movers.push({ mesh: buildItem('tram'), x: -4.1, y: 0.45, z: -140, scroll: true, boost: 6, phase: 0, scale: 3.2, rotY: X });
  const cloud = cloudMesh();
  for (let i = 0; i < 3; i++) movers.push({ mesh: cloud, x: -50 + i * 50, y: 34 + (i % 2) * 6, z: -125, scroll: false, drift: 0.5 + i * 0.2, phase: i, scale: 1.4 + (i % 2) * 0.6, rotY: 0 });

  return {
    name: `portugal:${theme}:${night ? 'night' : 'day'}`, night,
    env: { horizon, light: [-0.6, 1, 0.5], ambient: night ? 0.5 : 0.6, intensity: night ? 0.66 : 1, fogNear: 45, fogFar: 135 },
    sky, base: makeMesh(base.build()), water: waterMesh(4.2, hex(w.deep), hex(w.light)), waterWave: 0.035, far: makeMesh(far.build()), chunks, movers,
  };
}

export function buildWorld(dest: DestinationDef, theme: ThemeDef): World {
  const night = !!SCENE_ART[dest.id].variants[theme.id]?.bg;
  return dest.id === 'brazil' ? rio(theme.id, night) : porto(theme.id, night);
}

