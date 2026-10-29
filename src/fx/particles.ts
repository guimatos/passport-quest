/**
 * Fixed-size particle pool rendered on a 2D canvas that covers the stage.
 * No allocation per spawn: particles are structs reused in place. Positions are
 * viewport CSS px (what Runner.toScreen returns); the stage offset is removed
 * at draw time so the canvas also works inside the landscape phone frame.
 */
export interface Particle {
  active: boolean; x: number; y: number; vx: number; vy: number; life: number; ttl: number;
  size: number; color: string; shape: 0 | 1 | 2; rot: number; vr: number; gravity: number;
}
export interface SpawnConfig {
  x: number; y: number; count: number;
  speed: [number, number]; ttl: [number, number]; size: [number, number]; colors: string[];
  /** 0 = dot (shrinks), 1 = rectangle (confetti), 2 = puff (grows). */
  shape?: 0 | 1 | 2; gravity?: number; spread?: [number, number]; vy0?: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export class ParticleSystem {
  private ctx: CanvasRenderingContext2D;
  private pool: Particle[];
  private dpr = 1;
  private ox = 0;
  private oy = 0;
  private activeCount = 0;
  /** Region drawn last frame (CSS px), so the next frame clears only that instead of the whole canvas. */
  private dirty: { x0: number; y0: number; x1: number; y1: number } | null = null;

  constructor(private canvas: HTMLCanvasElement, capacity = 400) {
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    this.pool = Array.from({ length: capacity }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, ttl: 1, size: 4, color: '#fff', shape: 0 as const, rot: 0, vr: 0, gravity: 0 }));
    this.resize();
  }

  resize() {
    const r = this.canvas.parentElement!.getBoundingClientRect();
    this.dpr = Math.min(1.5, window.devicePixelRatio || 1);
    this.ox = r.left; this.oy = r.top;
    this.canvas.width = Math.round(r.width * this.dpr); this.canvas.height = Math.round(r.height * this.dpr);
    this.canvas.style.width = `${r.width}px`; this.canvas.style.height = `${r.height}px`;
    this.dirty = null; // resizing clears the bitmap
  }

  get active() { return this.activeCount; }

  spawn(c: SpawnConfig) {
    let left = c.count;
    for (const p of this.pool) {
      if (left === 0) break;
      if (p.active) continue;
      const a = c.spread ? rnd(c.spread[0], c.spread[1]) : rnd(0, Math.PI * 2);
      const sp = rnd(c.speed[0], c.speed[1]);
      p.active = true; p.x = c.x - this.ox; p.y = c.y - this.oy; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp + (c.vy0 ?? 0);
      p.life = 0; p.ttl = rnd(c.ttl[0], c.ttl[1]); p.size = rnd(c.size[0], c.size[1]);
      p.color = c.colors[Math.floor(Math.random() * c.colors.length)]; p.shape = c.shape ?? 0; p.rot = rnd(0, Math.PI * 2); p.vr = rnd(-6, 6); p.gravity = c.gravity ?? 0;
      this.activeCount++;
      left--;
    }
  }

  /** dt in ms of game time. Does nothing when no particle is alive and the canvas is already clean. */
  update(dt: number) {
    const s = dt / 1000;
    const { ctx, dpr } = this;
    if (this.dirty) {
      const d = this.dirty;
      ctx.clearRect(d.x0 * dpr, d.y0 * dpr, (d.x1 - d.x0) * dpr, (d.y1 - d.y0) * dpr);
      this.dirty = null;
    }
    if (this.activeCount === 0) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    ctx.save(); ctx.scale(dpr, dpr);
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life += s; if (p.life >= p.ttl) { p.active = false; this.activeCount--; continue; }
      p.vy += p.gravity * s; p.x += p.vx * s; p.y += p.vy * s; p.rot += p.vr * s;
      const t = p.life / p.ttl;
      ctx.globalAlpha = 1 - t * t;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      const sz = p.size * (p.shape === 2 ? 1 + t : 1 - t * 0.5);
      if (p.shape === 1) { ctx.fillRect(-sz / 2, -sz * 0.75, sz, sz * 1.5); } else { ctx.beginPath(); ctx.arc(0, 0, sz / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = sz; // rotated rect/dot fits in a circle of radius ~sz
      if (p.x - r < x0) x0 = p.x - r; if (p.x + r > x1) x1 = p.x + r;
      if (p.y - r < y0) y0 = p.y - r; if (p.y + r > y1) y1 = p.y + r;
    }
    ctx.restore();
    if (x0 < x1) this.dirty = { x0: Math.floor(x0) - 2, y0: Math.floor(y0) - 2, x1: Math.ceil(x1) + 2, y1: Math.ceil(y1) + 2 };
  }

  clear() {
    for (const p of this.pool) p.active = false;
    this.activeCount = 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.dirty = null;
  }
}
