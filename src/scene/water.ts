/**
 * Animated water as a WebGL fragment shader on a canvas under the SVG scene.
 * The canvas covers only the scene's water band (sea in Rio, river in Porto);
 * the SVG hides its static water rect while the shader is alive (class
 * `has-water`). Falls back silently (create() returns null) when WebGL is
 * unavailable or `?nowebgl=1` is set, and on context loss the SVG water comes
 * back. One canvas per Runner: destroy() loses the context and removes it.
 */
import { SCENE_W, SCENE_H } from './runner';
import type { WaterConfig } from '../art/scenes';

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `precision mediump float;
uniform vec2 u_res; uniform float u_time; uniform vec4 u_fit; /* ox, oy (canvas-relative), scale, dpr */
uniform vec2 u_band; uniform vec3 u_deep; uniform vec3 u_light; uniform vec3 u_foam; uniform float u_flip;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
void main(){
  vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / u_fit.w;      /* CSS px, y down */
  vec2 sc = (px - u_fit.xy) / u_fit.z;                                       /* scene units */
  float band = u_band.y - u_band.x;
  if (sc.y < u_band.x || sc.y > u_band.y) { gl_FragColor = vec4(0.0); return; }
  float d = (sc.y - u_band.x) / band;                                        /* 0 top .. 1 bottom */
  d = mix(d, 1.0 - d, u_flip);                                               /* 0 = shore edge */
  float t = u_time;
  float w = sin(sc.x * 0.045 + t * 1.6 + d * 6.0) * 0.5 + sin(sc.x * 0.11 - t * 2.3) * 0.25 + noise(vec2(sc.x * 0.02 + t * 0.3, d * 4.0)) * 0.5;
  vec3 col = mix(u_light, u_deep, clamp(d * 1.1 + w * 0.12, 0.0, 1.0));
  float sparkle = step(0.93, noise(vec2(sc.x * 0.15 + t, sc.y * 0.3 - t * 0.5))) * (1.0 - d);
  float foam = smoothstep(0.08, 0.0, d + sin(sc.x * 0.08 + t * 2.0) * 0.02) * 0.6;
  col = mix(col, u_foam, clamp(sparkle * 0.7 + foam, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`;

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

export class Water {
  static create(stage: HTMLElement, sceneEl: SVGSVGElement, cfg: WaterConfig): Water | null {
    if (new URLSearchParams(location.search).has('nowebgl')) return null;
    const canvas = document.createElement('canvas');
    canvas.id = 'water';
    canvas.setAttribute('aria-hidden', 'true');
    let gl: WebGLRenderingContext | null = null;
    try { gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' }); } catch { gl = null; }
    if (!gl) return null;
    try { return new Water(stage, canvas, sceneEl, gl, cfg); } catch { gl.getExtension('WEBGL_lose_context')?.loseContext(); return null; }
  }

  /** Reduced motion: time stays at 0, so the water is a still gradient with the same colours. */
  static: boolean = false;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private lost = false;
  private onLost = (e: Event) => { e.preventDefault(); this.lost = true; this.canvas.style.display = 'none'; this.sceneEl.classList.remove('has-water'); };

  private constructor(private stage: HTMLElement, private canvas: HTMLCanvasElement, private sceneEl: SVGSVGElement, private gl: WebGLRenderingContext, private cfg: WaterConfig) {
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
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['u_res', 'u_time', 'u_fit', 'u_band', 'u_deep', 'u_light', 'u_foam', 'u_flip']) this.u[n] = gl.getUniformLocation(prog, n);
    gl.uniform3fv(this.u.u_deep, hex(cfg.deep)); gl.uniform3fv(this.u.u_light, hex(cfg.light)); gl.uniform3fv(this.u.u_foam, hex(cfg.foam));
    gl.uniform2f(this.u.u_band, cfg.top, cfg.bottom);
    gl.uniform1f(this.u.u_flip, cfg.shore === 'bottom' ? 1 : 0);
    canvas.addEventListener('webglcontextlost', this.onLost);
    stage.prepend(canvas);
    sceneEl.classList.add('has-water');
    this.resize();
  }

  /** Sizes the canvas to the water band only (same slice fit as the SVG), so fragments outside the band are never shaded. */
  resize() {
    const r = this.stage.getBoundingClientRect();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const s = Math.max(r.width / SCENE_W, r.height / SCENE_H);
    const ox = (r.width - SCENE_W * s) / 2, oy = (r.height - SCENE_H * s) / 2;
    const top = Math.max(0, oy + this.cfg.top * s), bottom = Math.min(r.height, oy + this.cfg.bottom * s);
    const h = Math.max(1, bottom - top);
    this.canvas.style.top = `${top}px`; this.canvas.style.height = `${h}px`; this.canvas.style.width = `${r.width}px`;
    this.canvas.width = Math.round(r.width * dpr); this.canvas.height = Math.round(h * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(this.u.u_res, this.canvas.width, this.canvas.height);
    this.gl.uniform4f(this.u.u_fit, ox, oy - top, s, dpr);
    this.lastDraw = -Infinity;
  }

  /**
   * elapsed in ms of game time (frozen while paused, so the water freezes too).
   * Redraws at most 30 times per second of game time: ripples do not need 60 and
   * it halves the draw cost; a static (reduced-motion) surface is drawn once.
   */
  private lastDraw = -Infinity;
  render(elapsed: number) {
    if (this.lost) return;
    if (this.static ? this.lastDraw !== -Infinity : elapsed - this.lastDraw < 1000 / 30) return;
    this.lastDraw = elapsed;
    this.gl.uniform1f(this.u.u_time, this.static ? 0 : elapsed / 1000);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  get alive() { return !this.lost; }

  destroy() {
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.sceneEl.classList.remove('has-water');
    this.lost = true;
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.canvas.remove();
  }
}
