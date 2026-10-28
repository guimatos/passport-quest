import { Clock, easeOutCubic, easeInOutCubic, easeOutBack } from '../lib/clock';
import { htmlToElement } from '../lib/dom';

/**
 * Transient visual effects (sparkle bursts, item fly-to-wallet, toasts).
 * Every effect is a DOM node inside #fx tweened by the game clock, so they
 * pause with the game and are all removed by clear() on restart.
 */
export class Fx {
  constructor(private root: HTMLElement, private clock: Clock) {}

  /** Sparkle burst at a viewport position (CSS px). */
  burst(x: number, y: number, color = '#F58324', count = 10) {
    const frag = document.createDocumentFragment();
    const parts: { el: HTMLElement; dx: number; dy: number; r: number }[] = [];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('i');
      el.className = 'spark';
      el.style.background = i % 3 === 0 ? '#FFF6E8' : color;
      frag.appendChild(el);
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const d = 36 + Math.random() * 34;
      parts.push({ el, dx: Math.cos(a) * d, dy: Math.sin(a) * d, r: Math.random() * 360 });
    }
    this.root.appendChild(frag);
    this.clock.tween(620, (t) => {
      const e = easeOutCubic(t);
      for (const p of parts) {
        p.el.style.transform = `translate(${x + p.dx * e}px, ${y + p.dy * e + 30 * t * t}px) rotate(${p.r + t * 180}deg) scale(${1 - t})`;
        p.el.style.opacity = String(1 - t * t);
      }
    }, () => parts.forEach((p) => p.el.remove()));
  }

  /** Flies a copy of some SVG item art from one viewport point to another. */
  fly(from: { x: number; y: number }, to: { x: number; y: number }, artMarkup: string, onDone?: () => void) {
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

  /** Confetti rain for celebrations. */
  confetti(count = 28) {
    const colors = ['#F58324', '#7845D8', '#FFD966', '#FFF6E8', '#1FA463'];
    const w = this.root.clientWidth, h = this.root.clientHeight;
    const parts = Array.from({ length: count }, (_, i) => {
      const el = document.createElement('i');
      el.className = 'confetti';
      el.style.background = colors[i % colors.length];
      this.root.appendChild(el);
      return { el, x: Math.random() * w, delay: Math.random() * 0.4, drift: (Math.random() - 0.5) * 80, rot: Math.random() * 720, speed: 0.8 + Math.random() * 0.4 };
    });
    this.clock.tween(1800, (t) => {
      for (const p of parts) {
        const lt = Math.max(0, Math.min(1, (t - p.delay) / (1 - p.delay))) * p.speed;
        p.el.style.transform = `translate(${p.x + p.drift * lt}px, ${-20 + (h + 40) * lt}px) rotate(${p.rot * lt}deg)`;
        p.el.style.opacity = lt >= 1 ? '0' : '1';
      }
    }, () => parts.forEach((p) => p.el.remove()));
  }

  clear() { this.root.replaceChildren(); }
}
