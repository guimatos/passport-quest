/** Dev overlay (?perf=1): fps, average and worst raw frame time, JS work per frame, live SVG node count. */
export interface PerfSample { fps: number; avgMs: number; worstMs: number; workMs: number; workWorstMs: number; nodes: number }

export class PerfOverlay {
  private el: HTMLElement;
  private last = performance.now();
  private frames = 0;
  private acc = 0;
  private worst = 0;
  private workAcc = 0;
  private workWorst = 0;
  private frameStart = 0;
  sample: PerfSample = { fps: 0, avgMs: 0, worstMs: 0, workMs: 0, workWorstMs: 0, nodes: 0 };

  constructor(root: HTMLElement, private sceneRoot: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'perf';
    this.el.setAttribute('aria-hidden', 'true');
    root.appendChild(this.el);
  }

  /** Call once per animation frame, before game work, with raw wall-clock timing. */
  tick() {
    const now = performance.now();
    const dt = now - this.last;
    this.last = now;
    this.frameStart = now;
    this.frames++; this.acc += dt; this.worst = Math.max(this.worst, dt);
    if (this.acc >= 500) {
      this.sample = {
        fps: (this.frames / this.acc) * 1000, avgMs: this.acc / this.frames, worstMs: this.worst,
        workMs: this.workAcc / this.frames, workWorstMs: this.workWorst, nodes: this.sceneRoot.querySelectorAll('*').length,
      };
      this.el.textContent = `${this.sample.fps.toFixed(0)} fps · ${this.sample.avgMs.toFixed(1)} ms frame · ${this.sample.workMs.toFixed(2)} ms js (${this.sample.workWorstMs.toFixed(1)} worst) · ${this.sample.nodes} nodes`;
      this.frames = 0; this.acc = 0; this.worst = 0; this.workAcc = 0; this.workWorst = 0;
    }
  }

  /** Call at the end of the frame callback: measures the JS work of this frame (layout/paint excluded). */
  end() {
    const w = performance.now() - this.frameStart;
    this.workAcc += w; this.workWorst = Math.max(this.workWorst, w);
  }

  destroy() { this.el.remove(); }
}
