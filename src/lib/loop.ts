/**
 * requestAnimationFrame loop with named pause reasons.
 * The frame delta is clamped so a long gap (tab hidden, debugger, slow device)
 * never produces a time jump.
 */
const MAX_DT = 50;

export class Loop {
  private raf = 0;
  private last = 0;
  private running = false;
  private reasons = new Set<string>();

  constructor(private onFrame: (dt: number) => void, private onPauseChange?: (paused: boolean) => void) {}

  get paused() { return this.reasons.size > 0; }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  setPaused(reason: string, paused: boolean) {
    const was = this.paused;
    if (paused) this.reasons.add(reason); else this.reasons.delete(reason);
    if (was !== this.paused) {
      if (!this.paused) this.last = performance.now();
      this.onPauseChange?.(this.paused);
    }
  }

  clearPauses() { this.reasons.clear(); }

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(MAX_DT, Math.max(0, now - this.last));
    this.last = now;
    if (!this.paused) this.onFrame(dt);
    this.raf = requestAnimationFrame(this.frame);
  };
}
