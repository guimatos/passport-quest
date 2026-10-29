/**
 * Minimal column-major 4x4 matrix helpers for the 3D runner (WebGL 1).
 * Only what the renderer and the scene need: perspective, lookAt, TRS
 * composition and point projection. No dependency, no generics.
 */
export type Mat4 = Float32Array;
export type Vec3 = [number, number, number];

export const mat4 = (): Mat4 => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; };

export function identity(m: Mat4): Mat4 { m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; return m; }

/** out = a * b. out may alias a or b. */
export function multiply(out: Mat4, a: Mat4, b: Mat4): Mat4 {
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  for (let i = 0; i < 4; i++) {
    const b0 = b[i * 4], b1 = b[i * 4 + 1], b2 = b[i * 4 + 2], b3 = b[i * 4 + 3];
    out[i * 4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[i * 4 + 1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[i * 4 + 2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[i * 4 + 3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  }
  return out;
}

export function perspective(out: Mat4, fovy: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  out.fill(0);
  out[0] = f / aspect; out[5] = f; out[10] = (far + near) * nf; out[11] = -1; out[14] = 2 * far * near * nf;
  return out;
}

export function lookAt(out: Mat4, eye: Vec3, target: Vec3, up: Vec3 = [0, 1, 0]): Mat4 {
  let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
  let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
  let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
  l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
  out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
  out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  out[15] = 1;
  return out;
}

/** out = T(p) * Ry(ry) * Rx(rx) * Rz(rz) * S(s): the model matrix for a translated, rotated, scaled thing. */
export function trs(out: Mat4, px: number, py: number, pz: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx): Mat4 {
  const cx = Math.cos(rx), sxn = Math.sin(rx), cy = Math.cos(ry), syn = Math.sin(ry), cz = Math.cos(rz), szn = Math.sin(rz);
  // R = Ry * Rx * Rz
  const r00 = cy * cz + syn * sxn * szn, r01 = cx * szn, r02 = -syn * cz + cy * sxn * szn;
  const r10 = -cy * szn + syn * sxn * cz, r11 = cx * cz, r12 = syn * szn + cy * sxn * cz;
  const r20 = syn * cx, r21 = -sxn, r22 = cy * cx;
  out[0] = r00 * sx; out[1] = r01 * sx; out[2] = r02 * sx; out[3] = 0;
  out[4] = r10 * sy; out[5] = r11 * sy; out[6] = r12 * sy; out[7] = 0;
  out[8] = r20 * sz; out[9] = r21 * sz; out[10] = r22 * sz; out[11] = 0;
  out[12] = px; out[13] = py; out[14] = pz; out[15] = 1;
  return out;
}

/** Transforms a point; returns [x, y, z, w]. */
export function transform(m: Mat4, x: number, y: number, z: number): [number, number, number, number] {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
    m[3] * x + m[7] * y + m[11] * z + m[15],
  ];
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
