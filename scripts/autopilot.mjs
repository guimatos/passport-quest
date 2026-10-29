// Shared by the dev-only scripts: which runner to test and an in-page autopilot that steers Capi
// with real PointerEvents. MODE=2d runs against the SVG runner (?mode=2d); the default is the 3D runner.
export const MODE = process.env.MODE === '2d' ? '2d' : '3d';
export const withMode = (url) => (MODE === '2d' ? url + (url.includes('?') ? '&' : '?') + 'mode=2d' : url);

/**
 * Installs window.__autopilot(ms, target = 'item', dashThrough = false): steers toward the nearest
 * entity of `target` kind until ms elapse or the level ends. In 2D the control axis is the pointer Y
 * (scene units), in 3D the pointer X (lateral world units, via debug.toScreen). With dashThrough it
 * presses Space when an obstacle is about to hit, exercising the dash/dodge path.
 */
export const installAutopilot = (page) => page.evaluate(() => {
  window.__autopilot = (ms, target = 'item', dashThrough = false) => new Promise((res) => {
    const g = window.passportQuest, stage = document.getElementById('stage');
    const end = performance.now() + ms;
    const move = (x, y) => stage.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, isPrimary: true, pointerType: 'mouse', bubbles: true }));
    const dash = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    const step = () => {
      const d = g.debug;
      if (d.state !== 'playing' || performance.now() > end) return res();
      if (d.mode === '3d') {
        const ahead = d.entities.filter((e) => e.y > -0.5).sort((a, b) => a.y - b.y);
        const wanted = ahead.filter((e) => e.kind === target);
        let tx = wanted.length ? wanted[0].x : null;
        if (tx !== null && target === 'item') {
          for (const o of ahead.filter((e) => e.kind === 'obstacle' && e.y < wanted[0].y + 2)) {
            if (Math.abs(o.x - tx) < 1.1) tx = o.x + (tx >= o.x ? 1.7 : -1.7);
          }
          tx = Math.max(-2, Math.min(2, tx));
        }
        if (tx !== null) { const p = d.toScreen(tx, 0); move(p.x, p.y); }
        if (dashThrough) {
          const near = ahead.find((e) => e.kind === 'obstacle' && e.y < 3.5 && Math.abs(e.x - d.fox.x) < 1.0);
          if (near && !d.feel.dashing && !d.feel.cooldown) dash();
        }
      } else {
        const ahead = d.entities.filter((e) => e.x > d.fox.x - 10).sort((a, b) => a.x - b.x);
        const wanted = ahead.filter((e) => e.kind === target);
        let ty = wanted.length ? wanted[0].y : null;
        if (ty !== null && target === 'item') {
          for (const o of ahead.filter((e) => e.kind === 'obstacle' && e.x < wanted[0].x + 40)) {
            if (Math.abs(o.y - ty) < 55) ty = o.y + (ty >= o.y ? 75 : -75);
          }
        }
        if (ty !== null) { const p = d.toScreen(0, ty); move(100, p.y); }
        if (dashThrough) {
          const near = ahead.find((e) => e.kind === 'obstacle' && e.x - d.fox.x < 90 && Math.abs(e.y - d.fox.y) < 40);
          if (near && !d.feel.dashing && !d.feel.cooldown) dash();
        }
      }
      requestAnimationFrame(step);
    };
    step();
  });
});
