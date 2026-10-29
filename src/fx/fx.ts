import { Clock, easeOutCubic, easeInOutCubic, easeOutBack } from '../lib/clock';
import { htmlToElement } from '../lib/dom';
import { ParticleSystem } from './particles';

const CREAM = '#FFF6E8';
const CONFETTI = ['#F58324', '#7845D8', '#FFD966', '#FFF6E8', '#1FA463'];

/**
 * Transient visual effects. Sparkles, trails, dust and confetti are pooled
 * particles on one canvas (no DOM churn); item fly-to-HUD and floating labels
 * stay DOM nodes inside #fx because they carry SVG art and text. Everything is
 * driven by the game clock (pauses with the game) and removed by clear().
 */
export class Fx {
  private particles: ParticleSystem;
  /** When set (prefers-reduced-motion), particle counts are cut to a third. */
  reduced = false;

  constructor(private root: HTMLElement, canvas: HTMLCanvasElement, private clock: Clock) {
    this.particles = new ParticleSystem(canvas);
  }

  private count(n: number) { return this.reduced ? Math.max(1, Math.ceil(n / 3)) : n; }

  /** Sparkle burst at a viewport position (CSS px). */
  burst(x: number, y: number, color = '#F58324', count = 10) {
    this.particles.spawn({ x, y, count: this.count(count), speed: [60, 160], ttl: [0.4, 0.7], size: [4, 8], colors: [color, color, CREAM], gravity: 240 });
  }

  /** Short sparkle trail behind a flying item. */
  trail(x: number, y: number, color: string) {
    this.particles.spawn({ x, y, count: this.count(2), speed: [5, 20], ttl: [0.25, 0.4], size: [3, 6], colors: [color, CREAM] });
  }

  /** Dust puff kicked up behind Capi's feet (drifts back and up). */
  dust(x: number, y: number) {
    this.particles.spawn({ x, y, count: 2, speed: [10, 30], ttl: [0.3, 0.5], size: [4, 8], colors: ['rgba(255,246,232,0.8)', 'rgba(228,197,124,0.8)'], shape: 2, spread: [Math.PI * 1.1, Math.PI * 1.4], vy0: -15 });
  }

  /** Flies a copy of some SVG item art from one viewport point to another, leaving a trail. */
  fly(from: { x: number; y: number }, to: { x: number; y: number }, artMarkup: string, color: string, onDone?: () => void) {
    const el = htmlToElement(`<div class="fly"><svg viewBox="-28 -28 56 56">${artMarkup}</svg></div>`);
    this.root.appendChild(el);
    const cx = (from.x + to.x) / 2;
    const cy = Math.min(from.y, to.y) - 90;
    this.clock.tween(560, (t) => {
      const e = easeInOutCubic(t);
      const x = (1 - e) * (1 - e) * from.x + 2 * (1 - e) * e * cx + e * e * to.x;
      const y = (1 - e) * (1 - e) * from.y + 2 * (1 - e) * e * cy + e * e * to.y;
      const s = 1.25 - 0.75 * e;
      el.style.transform = `translate(${x}px, ${y}px) scale(${s}) rotate(${e * 360}deg)`;
      if (t < 0.9) this.trail(x, y, color);
    }, () => { el.remove(); onDone?.(); });
  }

  /** Floating "+25" style label. */
  floatText(x: number, y: number, text: string, cls = '') {
    const el = htmlToElement(`<div class="float-text ${cls}">${text}</div>`);
    this.root.appendChild(el);
    this.clock.tween(900, (t) => {
      const e = easeOutCubic(t);
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y - 46 * e}px) scale(${0.6 + 0.4 * easeOutBack(Math.min(1, t * 3))})`;
      el.style.opacity = String(t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4);
    }, () => el.remove());
  }

  /** Confetti rain for celebrations: rectangles released along the top edge over 0.4 s. */
  confetti(count = 28) {
    const r = this.root.getBoundingClientRect();
    const n = this.count(count);
    const release = (k: number) => {
      for (let i = 0; i < k; i++) {
        this.particles.spawn({ x: r.left + Math.random() * r.width, y: r.top - 10, count: 1, speed: [20, 60], ttl: [1.6, 2.4], size: [7, 10], colors: CONFETTI, shape: 1, spread: [Math.PI * 0.25, Math.PI * 0.75], vy0: 40, gravity: 160 });
      }
    };
    release(Math.ceil(n / 2));
    this.clock.after(200, () => release(Math.floor(n / 2)));
  }

  /** Advance and draw particles; dt in ms of game time. */
  update(dt: number) { this.particles.update(dt); }
  resize() { this.particles.resize(); }
  get activeParticles() { return this.particles.active; }

  clear() { this.root.replaceChildren(); this.particles.clear(); }
}
