/**
 * Game clock: timers and tweens driven by the frame loop instead of
 * setTimeout, so everything pauses when the loop pauses (tab hidden,
 * rotate prompt) and resumes without time jumps.
 */
export type Handle = number;

interface Timer { at: number; fn: () => void }
interface Tween { start: number; duration: number; update: (t: number) => void; done?: () => void }

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export class Clock {
  time = 0;
  private timers = new Map<Handle, Timer>();
  private tweens = new Map<Handle, Tween>();
  private nextId = 1;

  after(ms: number, fn: () => void): Handle {
    const id = this.nextId++;
    this.timers.set(id, { at: this.time + ms, fn });
    return id;
  }

  tween(duration: number, update: (t: number) => void, done?: () => void): Handle {
    const id = this.nextId++;
    this.tweens.set(id, { start: this.time, duration, update, done });
    update(0);
    return id;
  }

  cancel(handle: Handle | undefined) {
    if (handle === undefined) return;
    this.timers.delete(handle);
    this.tweens.delete(handle);
  }

  clearAll() {
    this.timers.clear();
    this.tweens.clear();
    this.time = 0;
  }

  /** Advance game time by dt milliseconds and fire whatever is due. */
  tick(dt: number) {
    this.time += dt;
    for (const [id, tw] of [...this.tweens]) {
      if (!this.tweens.has(id)) continue; // cancelled by an earlier callback this frame
      const t = Math.min(1, (this.time - tw.start) / tw.duration);
      tw.update(t);
      if (t >= 1) {
        this.tweens.delete(id);
        tw.done?.();
      }
    }
    const due = [...this.timers].filter(([, t]) => t.at <= this.time).sort((a, b) => a[1].at - b[1].at);
    for (const [id, t] of due) {
      if (!this.timers.has(id)) continue;
      this.timers.delete(id);
      t.fn();
    }
  }
}
