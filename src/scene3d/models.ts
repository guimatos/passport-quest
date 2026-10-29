import type { CostumeId, ItemId, ObstacleId } from '../data/destinations';
import { MeshBuilder, hex, type RGB } from '../gl/mesh';
import { makeMesh, type Mesh } from '../gl/renderer';
import { COSTUME_COLORS } from '../art/capy';

/**
 * Low-poly models for the 3D runner, built from primitives with vertex
 * colours (no textures, no assets); the palette matches the SVG art. Capi is
 * split into body, head, leg and arm meshes so the runner can animate limbs
 * with matrices. Items are about 0.6 units across and centred on the origin
 * (they spin, so every side is drawn); obstacles stand on the ground at y=0
 * and face the camera (+z).
 */
const FUR = hex('#A5713F'), FUR_DARK = hex('#7E5430'), FUR_LIGHT = hex('#C99263'), INK = hex('#201338'), CREAM = hex('#FFF6E8');
const ORANGE = hex('#F58324'), PURPLE = hex('#7845D8'), YELLOW = hex('#F2C94C'), GREEN = hex('#1FA463'), RED = hex('#D9534F'), BLUE = hex('#2E6FD8');
const WOOD = hex('#8B5A2B'), WOOD_DARK = hex('#3E2412'), SILVER = hex('#C0C7D0'), SKY_GLASS = hex('#9ED5F5');
const X = Math.PI / 2;

export interface CapiMeshes { body: Mesh; head: Mesh; leg: Mesh; arm: Mesh }

function hat(h: MeshBuilder, costume: CostumeId) {
  switch (costume) {
    case 'chef':
      h.cyl(0.27, 0.27, 0.14, 12, CREAM, { p: [0, 0.32, 0] });
      h.sphere(0.3, 10, CREAM, { p: [0, 0.5, 0], s: [1.05, 0.7, 1.05] });
      break;
    case 'carnival':
      h.box(0.68, 0.1, 0.62, YELLOW, { p: [0, 0.3, 0] });
      for (const [i, c] of [PURPLE, GREEN, YELLOW, ORANGE, PURPLE].entries()) h.box(0.07, 0.55, 0.03, c, { p: [(i - 2) * 0.12, 0.58, 0], r: [0.15, 0, (2 - i) * 0.28] });
      h.box(0.1, 0.1, 0.1, CREAM, { p: [0, 0.32, -0.3] });
      break;
    case 'panama':
      h.cyl(0.43, 0.43, 0.04, 14, hex('#F3E3B8'), { p: [0, 0.28, 0] });
      h.cyl(0.25, 0.23, 0.22, 12, hex('#F3E3B8'), { p: [0, 0.4, 0] });
      h.cyl(0.26, 0.26, 0.06, 12, INK, { p: [0, 0.33, 0] });
      break;
    case 'saojoao':
      h.cyl(0.34, 0.34, 0.06, 14, GREEN, { p: [0, 0.29, 0] });
      for (let i = 0; i < 6; i++) h.sphere(0.06, 6, i % 2 ? YELLOW : RED, { p: [Math.cos(i / 6 * Math.PI * 2) * 0.33, 0.33, Math.sin(i / 6 * Math.PI * 2) * 0.33] });
      break;
    case 'conductor':
      h.cyl(0.28, 0.27, 0.16, 12, hex('#2B2A4A'), { p: [0, 0.34, 0] });
      h.box(0.34, 0.03, 0.2, INK, { p: [0, 0.27, -0.36] });
      h.box(0.08, 0.08, 0.03, YELLOW, { p: [0, 0.36, -0.28] });
      h.cyl(0.29, 0.29, 0.03, 12, YELLOW, { p: [0, 0.27, 0] });
      break;
  }
}

export function buildCapi(costume: CostumeId): CapiMeshes {
  const c = COSTUME_COLORS[costume];
  const shirt = hex(c.shirt), accent = hex(c.shirtAccent), shorts = hex(c.shorts);
  const body = new MeshBuilder();
  body.box(0.72, 0.62, 0.46, shirt, { p: [0, 1.0, 0] });
  body.box(0.74, 0.14, 0.48, accent, { p: [0, 1.25, 0] });
  body.box(0.7, 0.3, 0.44, shorts, { p: [0, 0.62, 0] });
  body.box(0.2, 0.12, 0.1, FUR, { p: [0, 1.32, 0.02] });                    // neck
  const head = new MeshBuilder();
  head.box(0.62, 0.52, 0.56, FUR, { p: [0, 0, 0] });
  head.box(0.42, 0.3, 0.3, FUR_LIGHT, { p: [0, -0.1, -0.36] });              // snout (faces -z)
  head.box(0.18, 0.09, 0.1, INK, { p: [0, -0.02, -0.52] });                  // nose
  head.box(0.1, 0.1, 0.06, INK, { p: [-0.18, 0.1, -0.29] });                 // eyes
  head.box(0.1, 0.1, 0.06, INK, { p: [0.18, 0.1, -0.29] });
  head.box(0.04, 0.04, 0.02, CREAM, { p: [-0.16, 0.12, -0.33] });            // eye highlights
  head.box(0.04, 0.04, 0.02, CREAM, { p: [0.2, 0.12, -0.33] });
  head.box(0.14, 0.14, 0.1, FUR, { p: [-0.24, 0.3, 0.05] });                 // ears
  head.box(0.14, 0.14, 0.1, FUR, { p: [0.24, 0.3, 0.05] });
  head.box(0.08, 0.08, 0.04, FUR_DARK, { p: [-0.24, 0.3, 0.0] });
  head.box(0.08, 0.08, 0.04, FUR_DARK, { p: [0.24, 0.3, 0.0] });
  hat(head, costume);
  const leg = new MeshBuilder();
  leg.box(0.2, 0.5, 0.24, FUR, { p: [0, -0.25, 0] });
  leg.box(0.22, 0.12, 0.34, INK, { p: [0, -0.52, -0.04] });                 // sneaker
  leg.box(0.23, 0.04, 0.35, CREAM, { p: [0, -0.56, -0.04] });                // sole
  const arm = new MeshBuilder();
  arm.box(0.16, 0.46, 0.18, FUR, { p: [0, -0.23, 0] });
  arm.box(0.18, 0.14, 0.2, FUR_LIGHT, { p: [0, -0.5, 0] });                  // paw
  return { body: makeMesh(body.build()), head: makeMesh(head.build()), leg: makeMesh(leg.build()), arm: makeMesh(arm.build()) };
}

/** Two-sided triangle (sails, feathers seen from both sides). */
function tri2(b: MeshBuilder, a: [number, number, number], c: [number, number, number], d: [number, number, number], col: RGB) { b.tri(a, c, d, col); b.tri(a, d, c, col); }

const ITEMS: Record<ItemId, (b: MeshBuilder) => void> = {
  coconut: (b) => {
    b.sphere(0.3, 10, hex('#5FAF4E'));
    b.cyl(0.17, 0.17, 0.04, 10, hex('#F4EBC8'), { p: [0, 0.24, 0] });
    b.box(0.05, 0.4, 0.05, ORANGE, { p: [0.08, 0.38, 0], r: [0, 0, -0.3] });
  },
  acai: (b) => {
    b.cyl(0.18, 0.3, 0.26, 12, CREAM, { p: [0, -0.06, 0] });
    b.cyl(0.29, 0.29, 0.06, 12, hex('#5B2A86'), { p: [0, 0.1, 0] });
    for (const [x, z] of [[-0.12, 0.02], [0.02, -0.1], [0.12, 0.08]]) b.sphere(0.07, 6, hex('#F7E27A'), { p: [x, 0.17, z] });
    for (const [x, z] of [[0.14, -0.1], [-0.08, -0.14], [-0.16, 0.12]]) b.box(0.06, 0.05, 0.06, hex('#A86D37'), { p: [x, 0.15, z] });
    b.box(0.04, 0.34, 0.04, ORANGE, { p: [0.18, 0.26, 0], r: [0, 0, -0.35] });
  },
  brigadeiro: (b) => {
    b.cyl(0.17, 0.3, 0.2, 12, ORANGE, { p: [0, -0.16, 0] });
    b.sphere(0.24, 10, hex('#4A2A12'), { p: [0, 0.04, 0] });
    for (let i = 0; i < 8; i++) { const a = i * 0.8; b.box(0.05, 0.05, 0.05, hex('#6B4323'), { p: [Math.cos(a) * 0.22, 0.06 + Math.sin(i) * 0.1, Math.sin(a) * 0.22] }); }
  },
  bondinho: (b) => {
    b.box(0.9, 0.03, 0.03, INK, { p: [0, 0.4, 0] });
    b.box(0.04, 0.14, 0.04, INK, { p: [0, 0.32, 0] });
    b.box(0.6, 0.46, 0.4, CREAM, { p: [0, 0, 0] });
    b.box(0.62, 0.14, 0.42, BLUE, { p: [0, 0.18, 0] });
    b.box(0.62, 0.07, 0.42, ORANGE, { p: [0, -0.2, 0] });
    for (const x of [-0.14, 0.14]) { b.box(0.18, 0.2, 0.44, SKY_GLASS, { p: [x, -0.02, 0] }); }
  },
  violao: (b) => {
    b.cyl(0.28, 0.28, 0.1, 12, hex('#E8B04B'), { p: [0, -0.16, 0], r: [X, 0, 0] });
    b.cyl(0.21, 0.21, 0.1, 12, hex('#E8B04B'), { p: [0, 0.08, 0], r: [X, 0, 0] });
    b.cyl(0.07, 0.07, 0.02, 8, hex('#3E2412'), { p: [0, -0.04, 0.06], r: [X, 0, 0] });
    b.box(0.09, 0.5, 0.06, hex('#5A3A20'), { p: [0, 0.42, 0] });
    b.box(0.14, 0.12, 0.08, INK, { p: [0, 0.66, 0] });
    b.box(0.16, 0.05, 0.03, hex('#3E2412'), { p: [0, -0.3, 0.06] });
  },
  football: (b) => {
    b.sphere(0.28, 10, CREAM);
    for (const [y, a] of [[0.27, 0], [0.08, 0.6], [0.08, 2.7], [0.08, 4.8], [-0.14, 1.8], [-0.14, 3.9], [-0.27, 0]] as [number, number][]) {
      const r = Math.sqrt(Math.max(0, 0.28 * 0.28 - y * y));
      b.box(0.12, 0.12, 0.04, INK, { p: [Math.cos(a) * r, y, Math.sin(a) * r], r: [Math.asin(y / 0.28) * (Math.abs(y) > 0.2 ? 1 : 0.3), -a + X, 0] });
    }
  },
  pandeiro: (b) => {
    b.cyl(0.32, 0.32, 0.1, 14, hex('#C98A3A'), { p: [0, 0, 0], r: [X, 0, 0], s: 1 }, 1, false);
    b.cyl(0.3, 0.3, 0.02, 14, hex('#F6E3C0'), { p: [0, 0, 0.04], r: [X, 0, 0] });
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; b.box(0.08, 0.08, 0.12, SILVER, { p: [Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0], r: [0, 0, a] }); }
  },
  mask: (b) => {
    b.box(0.6, 0.36, 0.08, PURPLE, { p: [0, -0.04, 0] });
    b.box(0.62, 0.05, 0.1, YELLOW, { p: [0, 0.15, 0] });
    for (const x of [-0.15, 0.15]) b.box(0.16, 0.1, 0.1, INK, { p: [x, -0.02, 0] });
    for (const [i, c] of [YELLOW, PURPLE, GREEN, PURPLE, YELLOW].entries()) b.box(0.05, 0.36, 0.02, c, { p: [(i - 2) * 0.11, 0.34, 0], r: [0, 0, (2 - i) * 0.35] });
    b.box(0.03, 0.03, 0.36, INK, { p: [0.33, -0.18, 0], r: [0, 0, 0.6] });
  },
  apito: (b) => {
    b.box(0.46, 0.26, 0.26, SILVER, { p: [-0.1, 0, 0] });
    b.cyl(0.19, 0.19, 0.28, 10, SILVER, { p: [0.14, -0.02, 0], r: [X, 0, 0] });
    b.sphere(0.07, 6, INK, { p: [0.14, -0.02, 0.1] });
    b.box(0.08, 0.26, 0.28, hex('#9AA3AD'), { p: [-0.33, 0, 0] });
    for (const [x, z] of [[-0.2, 0.0], [-0.08, 0.1], [0.02, -0.06]]) b.sphere(0.05, 6, GREEN, { p: [x, 0.2, z] });
    b.box(0.03, 0.4, 0.03, YELLOW, { p: [-0.4, -0.1, 0], r: [0, 0, 0.2] });
  },
  nata: (b) => {
    b.cyl(0.2, 0.3, 0.16, 12, hex('#C98A3A'), { p: [0, -0.06, 0] });
    b.cyl(0.25, 0.25, 0.05, 12, hex('#F6D98A'), { p: [0, 0.04, 0] });
    b.cyl(0.17, 0.17, 0.03, 10, hex('#FFE8A6'), { p: [0, 0.08, 0] });
    b.box(0.09, 0.03, 0.07, hex('#7A3F12'), { p: [-0.06, 0.1, 0.02] });
    b.box(0.06, 0.03, 0.05, hex('#A05A1E'), { p: [0.07, 0.1, -0.04] });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.sphere(0.05, 5, hex('#E0A552'), { p: [Math.cos(a) * 0.28, 0.03, Math.sin(a) * 0.28] }); }
  },
  francesinha: (b) => {
    b.box(0.56, 0.1, 0.5, hex('#E8B04B'), { p: [0, -0.24, 0] });
    b.box(0.54, 0.08, 0.48, hex('#A5503A'), { p: [0, -0.15, 0] });
    b.box(0.6, 0.06, 0.54, hex('#F6D98A'), { p: [0, -0.08, 0] });
    b.box(0.54, 0.08, 0.48, hex('#C96A3F'), { p: [0, -0.01, 0] });
    b.box(0.56, 0.14, 0.5, hex('#E8B04B'), { p: [0, 0.1, 0] });
    b.box(0.6, 0.05, 0.54, hex('#F7A072'), { p: [0, 0.2, 0] });
    b.cyl(0.16, 0.16, 0.03, 10, CREAM, { p: [0.04, 0.24, 0.02] });
    b.sphere(0.07, 6, YELLOW, { p: [0.04, 0.27, 0.02] });
    b.box(0.05, 0.3, 0.05, YELLOW, { p: [-0.36, -0.12, 0.12], r: [0, 0, 0.15] });
    b.box(0.05, 0.3, 0.05, YELLOW, { p: [-0.36, -0.1, -0.08], r: [0, 0, -0.1] });
  },
  sardine: (b) => {
    b.sphere(0.3, 10, hex('#7F9AB3'), { p: [0, 0.04, 0], s: [1.1, 0.42, 0.3] });
    b.box(0.3, 0.1, 0.06, hex('#B9CBDB'), { p: [-0.05, 0.0, 0.06] });
    b.box(0.14, 0.22, 0.04, hex('#7F9AB3'), { p: [0.36, 0.04, 0], r: [0, 0, 0.5] });
    b.sphere(0.04, 5, INK, { p: [-0.22, 0.08, 0.08] });
    b.box(0.72, 0.05, 0.05, hex('#5A3A20'), { p: [0, -0.12, 0] });
  },
  azulejo: (b) => {
    b.box(0.56, 0.56, 0.06, CREAM, { p: [0, 0, 0] });
    b.box(0.6, 0.6, 0.04, BLUE, { p: [0, 0, 0] });
    b.sphere(0.07, 6, BLUE, { p: [0, 0, 0.04] });
    for (const [x, y] of [[0, 0.17], [0, -0.17], [0.17, 0], [-0.17, 0]]) b.box(0.08, 0.14, 0.03, BLUE, { p: [x, y, 0.04], r: [0, 0, x ? X : 0] });
    for (const x of [-0.2, 0.2]) for (const y of [-0.2, 0.2]) b.box(0.05, 0.05, 0.03, BLUE, { p: [x, y, 0.04] });
  },
  tram: (b) => {
    b.box(0.66, 0.34, 0.3, YELLOW, { p: [0, 0, 0] });
    b.box(0.68, 0.1, 0.32, CREAM, { p: [0, 0.2, 0] });
    b.box(0.7, 0.05, 0.34, RED, { p: [0, -0.16, 0] });
    for (const x of [-0.2, 0, 0.2]) b.box(0.14, 0.16, 0.34, SKY_GLASS, { p: [x, 0.0, 0] });
    for (const x of [-0.18, 0.18]) b.cyl(0.07, 0.07, 0.36, 8, INK, { p: [x, -0.2, 0], r: [X, 0, 0] });
    b.box(0.03, 0.14, 0.03, INK, { p: [0, 0.32, 0] });
    b.box(0.3, 0.03, 0.03, INK, { p: [0, 0.38, 0] });
  },
  rabelo: (b) => {
    b.box(0.74, 0.14, 0.26, WOOD, { p: [0, -0.1, 0] });
    b.box(0.6, 0.08, 0.2, hex('#A86D37'), { p: [0, -0.02, 0] });
    b.box(0.04, 0.5, 0.04, WOOD_DARK, { p: [0.05, 0.2, 0] });
    tri2(b, [0.07, 0.42, 0], [0.4, 0.14, 0], [0.07, 0.02, 0], CREAM);
    for (const x of [-0.26, -0.12, 0.02]) b.cyl(0.06, 0.06, 0.12, 8, hex('#5A3A20'), { p: [x, 0.06, 0], r: [0, 0, X] });
    b.box(0.03, 0.2, 0.03, WOOD_DARK, { p: [-0.36, 0.04, 0], r: [0, 0, 0.6] });
  },
  martelinho: (b) => {
    b.box(0.56, 0.26, 0.26, RED, { p: [0, 0.12, 0] });
    for (const x of [-0.23, 0.23]) b.box(0.14, 0.28, 0.28, BLUE, { p: [x, 0.12, 0] });
    b.box(0.1, 0.42, 0.1, YELLOW, { p: [0, -0.18, 0] });
    for (const x of [-0.12, 0.12]) b.box(0.05, 0.05, 0.03, CREAM, { p: [x, 0.16, 0.14] });
  },
  balloon: (b) => {
    b.sphere(0.27, 10, ORANGE, { p: [0, 0.1, 0], s: [1, 1.2, 1] });
    for (const a of [0.6, 2.2, 3.8, 5.4]) b.box(0.05, 0.5, 0.05, YELLOW, { p: [Math.cos(a) * 0.26, 0.1, Math.sin(a) * 0.26], r: [0, -a, 0] });
    b.box(0.14, 0.1, 0.14, WOOD, { p: [0, -0.34, 0] });
    for (const x of [-0.07, 0.07]) b.box(0.02, 0.14, 0.02, hex('#5A3A20'), { p: [x, -0.26, 0] });
    b.sphere(0.05, 6, hex('#FFD966'), { p: [0, -0.24, 0] }, 0);
  },
  manjerico: (b) => {
    b.cyl(0.15, 0.21, 0.24, 10, hex('#C96A3F'), { p: [0, -0.2, 0] });
    b.cyl(0.24, 0.24, 0.05, 10, hex('#E8B04B'), { p: [0, -0.08, 0] });
    for (const [x, y, z] of [[-0.12, 0.04, 0.02], [0.12, 0.04, -0.02], [0, 0.14, 0], [0, 0.02, 0.1], [0.02, 0.0, -0.12]]) b.sphere(0.14, 7, hex('#3AA66A'), { p: [x, y, z] });
    b.box(0.02, 0.3, 0.02, hex('#8C4F1D'), { p: [0.08, 0.3, 0] });
    b.sphere(0.07, 6, RED, { p: [0.08, 0.46, 0] });
    b.box(0.16, 0.12, 0.02, CREAM, { p: [-0.1, 0.3, 0.04], r: [0, 0, -0.2] });
  },
};

const OBSTACLES: Record<ObstacleId, (b: MeshBuilder) => void> = {
  crab: (b) => {
    const red = hex('#E0533B');
    b.sphere(0.3, 10, red, { p: [0, 0.2, 0], s: [1.2, 0.6, 0.9] });
    for (const s of [-1, 1]) for (const [i, z] of [-0.12, 0.0, 0.12].entries()) b.box(0.3, 0.05, 0.05, hex('#C7402E'), { p: [s * 0.4, 0.1, z], r: [0, 0, s * (0.5 + i * 0.1)] });
    for (const s of [-1, 1]) b.sphere(0.1, 7, red, { p: [s * 0.4, 0.22, 0.2] });
    for (const s of [-1, 1]) { b.box(0.04, 0.16, 0.04, red, { p: [s * 0.1, 0.42, 0.1] }); b.sphere(0.06, 6, CREAM, { p: [s * 0.1, 0.52, 0.1] }); b.sphere(0.03, 5, INK, { p: [s * 0.1, 0.52, 0.15] }); }
  },
  urchin: (b) => {
    b.sphere(0.26, 10, hex('#4E3A78'), { p: [0, 0.28, 0] });
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4, e = (i % 3) * 0.5 + 0.2;
      const dx = Math.cos(a) * Math.cos(e), dy = Math.sin(e), dz = Math.sin(a) * Math.cos(e);
      b.cyl(0.04, 0, 0.3, 5, hex('#3A2A5A'), { p: [dx * 0.36, 0.28 + dy * 0.36, dz * 0.36], r: [Math.atan2(Math.hypot(dx, dz), dy) * (dz >= 0 ? 1 : -1) * (dz === 0 ? 1 : 1), -Math.atan2(dz, dx) + X, 0] });
    }
  },
  gull: (b) => {
    b.sphere(0.3, 10, CREAM, { p: [0, 0, 0], s: [0.9, 0.5, 0.55] });
    b.sphere(0.13, 8, CREAM, { p: [0, 0.1, 0.24] });
    b.cyl(0.05, 0, 0.16, 6, ORANGE, { p: [0, 0.08, 0.4], r: [X, 0, 0] });
    b.sphere(0.03, 5, INK, { p: [0.06, 0.14, 0.3] });
    for (const s of [-1, 1]) b.box(0.56, 0.03, 0.22, CREAM, { p: [s * 0.4, 0.08, -0.02], r: [0, 0, s * 0.35] });
    b.box(0.1, 0.03, 0.2, hex('#9AA3AD'), { p: [0, 0.02, -0.32] });
  },
  crate: (b) => {
    b.box(0.6, 0.56, 0.6, hex('#B07A3E'), { p: [0, 0.28, 0] });
    for (const y of [0.1, 0.28, 0.46]) b.box(0.62, 0.04, 0.62, hex('#5A3A20'), { p: [0, y, 0] });
    for (const r of [0.8, -0.8]) b.box(0.08, 0.7, 0.02, hex('#8C5A2E'), { p: [0, 0.28, 0.31], r: [0, 0, r] });
    b.box(0.24, 0.14, 0.03, CREAM, { p: [0, 0.3, 0.32] });
  },
};

export function buildItem(id: ItemId): Mesh { const b = new MeshBuilder(); ITEMS[id](b); return makeMesh(b.build()); }
export function buildObstacle(id: ObstacleId): Mesh { const b = new MeshBuilder(); OBSTACLES[id](b); return makeMesh(b.build()); }

/** Soft ground shadow: a dark disc drawn with alpha, unlit. */
export function buildShadow(): Mesh {
  const b = new MeshBuilder();
  b.disc(0.5, 12, INK, undefined, 0);
  return makeMesh(b.build());
}

export const MODEL_IDS = { items: Object.keys(ITEMS) as ItemId[], obstacles: Object.keys(OBSTACLES) as ObstacleId[] };
