/**
 * Dev-only contact sheet of the 3D models (gallery.html, served by Vite in
 * dev; not part of the production build). Capi in the five costumes, every
 * item and every obstacle on a grid, lit like the game, slowly turning.
 */
import { mat4, perspective, lookAt, trs, multiply } from '../gl/math';
import { Renderer } from '../gl/renderer';
import { buildCapi, buildItem, buildObstacle, buildShadow, MODEL_IDS } from '../scene3d/models';
import { hex } from '../gl/mesh';
import type { CostumeId } from '../data/destinations';

const canvas = document.querySelector('canvas')!;
canvas.width = innerWidth * Math.min(2, devicePixelRatio); canvas.height = innerHeight * Math.min(2, devicePixelRatio);
const r = Renderer.create(canvas);
if (!r) throw new Error('no webgl');
const costumes: CostumeId[] = ['chef', 'carnival', 'panama', 'saojoao', 'conductor'];
const capis = costumes.map(buildCapi);
const items = MODEL_IDS.items.map(buildItem);
const obstacles = MODEL_IDS.obstacles.map(buildObstacle);
const shadow = buildShadow();
const proj = mat4(), view = mat4(), m = mat4(), m2 = mat4();
const COLS = 6, CELL = 1.4;
const rows = 1 + Math.ceil((items.length + obstacles.length) / COLS);
const frame = (now: number) => {
  const t = now / 1000, spin = t * 0.6;
  perspective(proj, 44 * Math.PI / 180, r.aspect, 0.5, 100);
  const cz = (rows - 1) * CELL / 2;
  lookAt(view, [0, 9, cz + 9.5], [0, 0.2, cz - 0.3]);
  r.begin(proj, view, { horizon: hex('#DDEEFF'), light: [-0.5, 1, 0.6], ambient: 0.62, fogNear: 50, fogFar: 100 }, t);
  const place = (col: number, row: number) => [(col - (COLS - 1) / 2) * CELL, row * CELL] as const;
  capis.forEach((c, i) => {
    const [x, z] = place(i + 0.5, 0);
    trs(m, x, 0, z, 0, spin + 0.5, 0, 0.55);
    r.draw(shadow, trs(m2, x, 0.01, z, 0, 0, 0, 0.6), { alpha: 0.25 });
    const part = (mesh: typeof c.body, px: number, py: number, pz: number, rx = 0) => { trs(m2, px, py, pz, rx); r.draw(mesh, multiply(m2, m, m2)); };
    part(c.body, 0, 0, 0); part(c.head, 0, 1.62, -0.04); part(c.leg, -0.17, 0.56, 0, 0.5); part(c.leg, 0.17, 0.56, 0, -0.5); part(c.arm, -0.46, 1.22, 0, -0.4); part(c.arm, 0.46, 1.22, 0, 0.4);
  });
  [...items, ...obstacles].forEach((mesh, i) => {
    const [x, z] = place(i % COLS, 1 + Math.floor(i / COLS));
    const item = i < items.length;
    r.draw(shadow, trs(m2, x, 0.01, z, 0, 0, 0, 0.5), { alpha: 0.22 });
    r.draw(mesh, trs(m, x, item ? 0.5 : 0, z, 0, spin, 0, 0.9));
  });
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
