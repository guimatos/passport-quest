import { trs, transform, type Mat4 } from './math';

/**
 * Low-poly mesh builder: boxes, cylinders, cones, spheres, discs and planes
 * with flat normals and a colour per face. Everything a model needs is merged
 * into one interleaved buffer (position 3, normal 3, colour 4) so each model
 * is a single draw call. The colour's 4th component is the "lit" factor:
 * 1 = shaded by the light, 0 = emissive (lamps, stars, sun).
 */
export type RGB = [number, number, number];
export interface Placement { p?: [number, number, number]; r?: [number, number, number]; s?: number | [number, number, number] }
export interface MeshData { data: Float32Array; count: number }

export const STRIDE = 10;

export const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const shade = (c: RGB, k: number): RGB => [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)];

type P3 = [number, number, number];
const tmp = new Float32Array(16) as Mat4;

function placementMatrix(t?: Placement): Mat4 | null {
  if (!t) return null;
  const p = t.p ?? [0, 0, 0], r = t.r ?? [0, 0, 0];
  const s = t.s === undefined ? [1, 1, 1] : typeof t.s === 'number' ? [t.s, t.s, t.s] : t.s;
  return trs(tmp, p[0], p[1], p[2], r[0], r[1], r[2], s[0], s[1], s[2]);
}

export class MeshBuilder {
  private v: number[] = [];
  get triangles() { return this.v.length / STRIDE / 3; }

  /** One flat-shaded triangle (counter-clockwise = front). */
  tri(a: P3, b: P3, c: P3, col: RGB, lit = 1, m: Mat4 | null = null) {
    if (m) { a = transform(m, a[0], a[1], a[2]).slice(0, 3) as P3; b = transform(m, b[0], b[1], b[2]).slice(0, 3) as P3; c = transform(m, c[0], c[1], c[2]).slice(0, 3) as P3; }
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (const p of [a, b, c]) this.v.push(p[0], p[1], p[2], nx, ny, nz, col[0], col[1], col[2], lit);
  }

  quad(a: P3, b: P3, c: P3, d: P3, col: RGB, lit = 1, m: Mat4 | null = null) { this.tri(a, b, c, col, lit, m); this.tri(a, c, d, col, lit, m); }

  /** Axis-aligned box centred on the origin, then placed. `faces` darkens the sides slightly for a low-poly read. */
  box(sx: number, sy: number, sz: number, col: RGB, t?: Placement, lit = 1) {
    const m = placementMatrix(t);
    const x = sx / 2, y = sy / 2, z = sz / 2;
    const side = shade(col, 0.88), bottom = shade(col, 0.7);
    this.quad([-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z], col, lit, m);           // top
    this.quad([-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z], bottom, lit, m);    // bottom
    this.quad([-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z], col, lit, m);           // front (+z)
    this.quad([x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z], side, lit, m);      // back
    this.quad([x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z], side, lit, m);          // right
    this.quad([-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z], side, lit, m);      // left
  }

  /** Cylinder (or cone when rTop = 0) along +y, centred on the origin. */
  cyl(rBottom: number, rTop: number, h: number, segs: number, col: RGB, t?: Placement, lit = 1, caps = true) {
    const m = placementMatrix(t);
    const y0 = -h / 2, y1 = h / 2;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const b0: P3 = [c0 * rBottom, y0, s0 * rBottom], b1: P3 = [c1 * rBottom, y0, s1 * rBottom];
      const t0: P3 = [c0 * rTop, y1, s0 * rTop], t1: P3 = [c1 * rTop, y1, s1 * rTop];
      const sideCol = shade(col, 0.86 + 0.14 * Math.abs(Math.cos(a0 + 0.4)));
      if (rTop > 0) this.quad(b1, b0, t0, t1, sideCol, lit, m); else this.tri(b1, b0, t0, sideCol, lit, m);
      if (caps) {
        if (rBottom > 0) this.tri([0, y0, 0], b0, b1, shade(col, 0.7), lit, m);
        if (rTop > 0) this.tri([0, y1, 0], t1, t0, col, lit, m);
      }
    }
  }

  /** Flat disc in the xz plane facing +y (ground shadows, sun, plates). */
  disc(r: number, segs: number, col: RGB, t?: Placement, lit = 1) {
    const m = placementMatrix(t);
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      this.tri([0, 0, 0], [Math.cos(a1) * r, 0, Math.sin(a1) * r], [Math.cos(a0) * r, 0, Math.sin(a0) * r], col, lit, m);
    }
  }

  /** Low-poly sphere: `segs` around, `segs/2` bands; faceted on purpose. */
  sphere(r: number, segs: number, col: RGB, t?: Placement, lit = 1) {
    const m = placementMatrix(t);
    const bands = Math.max(2, Math.round(segs / 2));
    for (let j = 0; j < bands; j++) {
      const p0 = (j / bands) * Math.PI, p1 = ((j + 1) / bands) * Math.PI;
      const y0 = Math.cos(p0) * r, y1 = Math.cos(p1) * r, r0 = Math.sin(p0) * r, r1 = Math.sin(p1) * r;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const A: P3 = [c0 * r0, y0, s0 * r0], B: P3 = [c1 * r0, y0, s1 * r0], C: P3 = [c1 * r1, y1, s1 * r1], D: P3 = [c0 * r1, y1, s0 * r1];
        const k = 0.9 + 0.1 * Math.cos(p0);
        if (j === 0) this.tri(A, C, D, shade(col, k), lit, m);
        else if (j === bands - 1) this.tri(A, B, C, shade(col, k), lit, m);
        else this.quad(A, B, C, D, shade(col, k), lit, m);
      }
    }
  }

  /** Plane in the xz plane facing +y, centred, subdivided nx by nz; `colorAt` may vary the colour per cell. */
  plane(w: number, d: number, col: RGB, t?: Placement, lit = 1, nx = 1, nz = 1, colorAt?: (ix: number, iz: number, x: number, z: number) => RGB) {
    const m = placementMatrix(t);
    for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
      const x0 = -w / 2 + (ix / nx) * w, x1 = -w / 2 + ((ix + 1) / nx) * w, z0 = -d / 2 + (iz / nz) * d, z1 = -d / 2 + ((iz + 1) / nz) * d;
      const c = colorAt ? colorAt(ix, iz, (x0 + x1) / 2, (z0 + z1) / 2) : col;
      this.quad([x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], c, lit, m);
    }
  }

  /** Appends another builder's triangles, optionally placed (normals are recomputed from the moved vertices). */
  merge(other: MeshBuilder, t?: Placement) {
    const m = placementMatrix(t), o = other.v;
    for (let i = 0; i < o.length; i += STRIDE * 3) {
      const p = (k: number): P3 => [o[i + k * STRIDE], o[i + k * STRIDE + 1], o[i + k * STRIDE + 2]];
      this.tri(p(0), p(1), p(2), [o[i + 6], o[i + 7], o[i + 8]], o[i + 9], m);
    }
  }

  build(): MeshData { return { data: new Float32Array(this.v), count: this.v.length / STRIDE }; }
}
