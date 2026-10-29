# Walkthrough outline (about 5 minutes)

Time per section and the recording tool are left for the developer to fill in.

1. **Open and core interaction** (_time: …_)
   - Start screen: Capi and the fox, the framing line, "Demo only" note. Tap Play.
   - Map: choose Rio. Plane flies in. Theme card: pick a theme; point at the
     costume preview and the coupon line.
   - Run (3D): move left and right along Copacabana; catch two items; show
     the chips, the +10, the bar. Pan over the sea, palms and Sugarloaf.
     Hit an obstacle on purpose: "Ouch!", bar loses one segment, no game over.
   - Tap to dash through a crab: "Dodged!", +5. Catch five in a row: the x2
     badge on the wallet and "Combo x2!"; a hit floats "Combo lost!".
   - A golden coconut glows: freeze-frame on the catch, +30, counts double for
     the coupon.
   - Call out the "Faster!" toast when the ramp passes halfway.

2. **Progression and ending** (_time: …_)
   - Catch the sixth signature item: "Coupon unlocked!", chip turns orange.
   - Fill the bar: "Passport stamped!", jingle, redeem card (+100, coupon),
     travel journal with the history lines, "Back to the map".
   - Map shows Rio stamped; Porto auto-selected; pick a different theme to
     show the environment change (night São João or café terrace).
   - Final screen: passport with both stamps and themes, demo points,
     coupons list, "New best!" (stored locally, demo).

3. **CTA** (_time: …_)
   - Tap "Explore Scrambly": local confirmation text, console log, URL
     unchanged. Mock email: an invalid address shakes, a valid one shows
     "Sent to … (demo)" and a console log; Network tab stays empty.

4. **Restart** (_time: …_)
   - Restart from the HUD mid-run, then from the redeem card, then from the
     map hub. Each returns to a clean start screen; points back to 0.

5. **Edge case: hide the tab mid-game** (_time: …_)
   - Mid-run, switch tabs for ~10 s. Come back: the scene is exactly where it
     was, no burst of spawned items, the hint fires ~4 s after resume, music
     resumes. Mention the frame-clamped clock and pause reasons.

6. **Design decisions and performance** (_time: …_)
   - Runner instead of tap-to-find (reviewer request), theme choice per city,
     map hub, costumes and furniture layers, 360×720 scene with a safe band,
     one reset path, no dependencies.
   - Stage 2 polish: point at the sea ripples (WebGL fragment shader under the
     SVG; add `?nowebgl=1` to show the SVG fallback), catch an item for the
     squash, sparkle burst and trail, hit an obstacle for the shake and flash,
     and the wipe between screens.
   - Open `?perf=1` and read the overlay; then show the table in
     `docs/DEVELOPMENT_NOTE.md`: entity pooling and cached rects cut
     main-thread busy time from ~49% to ~37% at 6x CPU throttle; the particle
     canvas is free at DPR 1.5 (and was not at DPR 2); the water adds ~3
     points in software GL.

7. **The Scrambly connection** (_time: …_)
   - Discover (theme + items) → Play & progress (demo points, passport bar) →
     Redeem (stamp, demo coupon, wallet). Fox as guide. Demo labelling.

8. **Testing** (_time: …_)
   - Run `npm run check`: typecheck, build, bundle budget, e2e at both sizes
     on a static preview of `dist/`, layout checks, perf print; the same job is
     in `.github/workflows/check.yml`. Show the emulated-vs-real table in the
     README and the ZIP size check from `npm run package`.

9. **Limitations** (_time: …_)
   - Emulated testing only, music unauditioned, keyboard on the final screen,
     autopilot-tuned difficulty. What Stage 2 could add.

_Tool used for recording: …_
_Total time: …_
