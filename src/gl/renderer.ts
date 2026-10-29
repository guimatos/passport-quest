import { mat4, multiply, transform, type Mat4 } from './math';
import { STRIDE, type MeshData, type RGB } from './mesh';

/**
 * One-program WebGL 1 renderer for the 3D runner: per-vertex colour, one
 * directional light with ambient, distance fog toward the horizon colour,
 * an unlit mode for sky and emissive things, a per-draw tint and alpha for
 * golden items, stun flashes, ghosts and fades, and a vertex wave for water.
 * Meshes keep their CPU data so a lost-and-restored context re-uploads them.
 */
export interface Mesh extends MeshData { vbo: WebGLBuffer | null; gen: number }
export interface Env {
  /** Horizon colour: also the fog colour and the clear colour. */
  horizon: RGB;
  light: [number, number, number];
  ambient: number;
  /** Multiplies lit colours (night scenes dim the world without touching the palette). */
  intensity?: number;
  fogNear: number;
  fogFar: number;
}
export interface DrawOpts { tint?: RGB; tintMix?: number; alpha?: number; wave?: number; unlit?: boolean }

const VERT = `attribute vec3 aPos; attribute vec3 aNrm; attribute vec4 aCol;
uniform mat4 uProj, uView, uModel; uniform float uTime, uWave;
varying vec4 vCol; varying float vFog; varying vec3 vNrm;
void main(){
  vec4 wp = uModel * vec4(aPos, 1.0);
  if (uWave > 0.0) wp.y += (sin(wp.x * 1.1 + uTime * 1.7) + sin(wp.z * 0.7 - uTime * 2.3) * 0.6) * uWave;
  vec4 vp = uView * wp;
  gl_Position = uProj * vp;
  vNrm = mat3(uModel) * aNrm;
  vCol = aCol;
  vFog = -vp.z;
}`;
const FRAG = `precision mediump float;
varying vec4 vCol; varying float vFog; varying vec3 vNrm;
uniform vec3 uLight; uniform float uAmbient; uniform vec3 uFogCol; uniform vec2 uFogRange;
uniform vec4 uTint; uniform float uAlpha; uniform float uUnlit; uniform float uIntensity;
void main(){
  vec3 n = normalize(vNrm);
  float d = max(dot(n, uLight), 0.0);
  float lit = vCol.a * (1.0 - uUnlit);
  float l = mix(1.0, (uAmbient + (1.0 - uAmbient) * d) * uIntensity, lit);
  vec3 col = mix(vCol.rgb * l, uTint.rgb, uTint.a);
  float f = clamp((vFog - uFogRange.x) / (uFogRange.y - uFogRange.x), 0.0, 1.0) * (1.0 - uUnlit);
  col = mix(col, uFogCol, f);
  gl_FragColor = vec4(col, uAlpha);
}`;

export const makeMesh = (d: MeshData): Mesh => ({ ...d, vbo: null, gen: -1 });

export class Renderer {
  static create(canvas: HTMLCanvasElement): Renderer | null {
    let gl: WebGLRenderingContext | null = null;
    try { gl = canvas.getContext('webgl', { alpha: false, antialias: true, depth: true, premultipliedAlpha: false, powerPreference: 'high-performance' }); } catch { gl = null; }
    if (!gl) return null;
    try { return new Renderer(canvas, gl); } catch { gl.getExtension('WEBGL_lose_context')?.loseContext(); return null; }
  }

  /** Draw calls issued in the current frame (debug/perf). */
  draws = 0;
  private gen = 0;
  private lostFlag = false;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private attr = { pos: 0, nrm: 0, col: 0 };
  private proj = mat4();
  private view = mat4();
  private viewProj = mat4();
  private dpr = 1;
  private blending = false;
  private onLost = (e: Event) => { e.preventDefault(); this.lostFlag = true; this.canvas.classList.add('gl-lost'); };
  private onRestored = () => { this.gen++; this.init(); this.lostFlag = false; this.canvas.classList.remove('gl-lost'); };

  private constructor(readonly canvas: HTMLCanvasElement, private gl: WebGLRenderingContext) {
    this.init();
    canvas.addEventListener('webglcontextlost', this.onLost);
    canvas.addEventListener('webglcontextrestored', this.onRestored);
  }

  private init() {
    const gl = this.gl;
    const mk = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) throw new Error('shader');
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const prog = gl.createProgram();
    if (!prog) throw new Error('program');
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(prog);
    this.attr = { pos: gl.getAttribLocation(prog, 'aPos'), nrm: gl.getAttribLocation(prog, 'aNrm'), col: gl.getAttribLocation(prog, 'aCol') };
    gl.enableVertexAttribArray(this.attr.pos); gl.enableVertexAttribArray(this.attr.nrm); gl.enableVertexAttribArray(this.attr.col);
    for (const n of ['uProj', 'uView', 'uModel', 'uTime', 'uWave', 'uLight', 'uAmbient', 'uFogCol', 'uFogRange', 'uTint', 'uAlpha', 'uUnlit', 'uIntensity']) this.u[n] = gl.getUniformLocation(prog, n);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.BLEND); this.blending = false;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  get lost() { return this.lostFlag; }
  get aspect() { return this.canvas.width / Math.max(1, this.canvas.height); }

  /** Backing store at the CSS size times the device pixel ratio, capped at 1.5 (same cap as the particle canvas). */
  resize(cssW: number, cssH: number) {
    this.dpr = Math.min(1.5, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.round(cssW * this.dpr));
    this.canvas.height = Math.max(1, Math.round(cssH * this.dpr));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Starts a frame: clears to the horizon colour and sets camera, light and fog. */
  begin(proj: Mat4, view: Mat4, env: Env, time: number) {
    const gl = this.gl;
    this.draws = 0;
    this.proj.set(proj); this.view.set(view); multiply(this.viewProj, proj, view);
    gl.clearColor(env.horizon[0], env.horizon[1], env.horizon[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(this.u.uProj, false, proj);
    gl.uniformMatrix4fv(this.u.uView, false, view);
    const l = env.light, len = Math.hypot(l[0], l[1], l[2]) || 1;
    gl.uniform3f(this.u.uLight, l[0] / len, l[1] / len, l[2] / len);
    gl.uniform1f(this.u.uAmbient, env.ambient);
    gl.uniform1f(this.u.uIntensity, env.intensity ?? 1);
    gl.uniform3f(this.u.uFogCol, env.horizon[0], env.horizon[1], env.horizon[2]);
    gl.uniform2f(this.u.uFogRange, env.fogNear, env.fogFar);
    gl.uniform1f(this.u.uTime, time);
  }

  draw(mesh: Mesh, model: Mat4, o: DrawOpts = {}) {
    if (this.lostFlag || mesh.count === 0) return;
    const gl = this.gl;
    if (!mesh.vbo || mesh.gen !== this.gen) {
      mesh.vbo = gl.createBuffer();
      mesh.gen = this.gen;
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
    }
    const bytes = STRIDE * 4;
    gl.vertexAttribPointer(this.attr.pos, 3, gl.FLOAT, false, bytes, 0);
    gl.vertexAttribPointer(this.attr.nrm, 3, gl.FLOAT, false, bytes, 12);
    gl.vertexAttribPointer(this.attr.col, 4, gl.FLOAT, false, bytes, 24);
    gl.uniformMatrix4fv(this.u.uModel, false, model);
    const tint = o.tint ?? [0, 0, 0];
    gl.uniform4f(this.u.uTint, tint[0], tint[1], tint[2], o.tintMix ?? 0);
    const alpha = o.alpha ?? 1;
    gl.uniform1f(this.u.uAlpha, alpha);
    gl.uniform1f(this.u.uWave, o.wave ?? 0);
    gl.uniform1f(this.u.uUnlit, o.unlit ? 1 : 0);
    const blend = alpha < 1;
    if (blend !== this.blending) { this.blending = blend; if (blend) gl.enable(gl.BLEND); else gl.disable(gl.BLEND); gl.depthMask(!blend); }
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    this.draws++;
  }

  /** Projects a world point to CSS pixels inside the canvas, using the last begin() camera. Null when behind the camera. */
  project(x: number, y: number, z: number): { x: number; y: number } | null {
    const c = transform(this.viewProj, x, y, z);
    if (c[3] <= 0) return null;
    const w = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
    return { x: (c[0] / c[3] + 1) / 2 * w, y: (1 - c[1] / c[3]) / 2 * h };
  }

  destroy() {
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
    this.lostFlag = true;
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
