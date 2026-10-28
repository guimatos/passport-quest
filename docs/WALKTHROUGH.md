# Walkthrough outline (about 5 minutes)

Time per section and the recording tool are left for the developer to fill in.

1. **Open and core interaction** (_time: …_)
   - Start screen: Capi and the fox, the framing line, "Demo only" note. Tap Play.
   - Map: choose Rio. Plane flies in. Theme card: pick a theme; point at the
     costume preview and the coupon line.
   - Run: move up and down; catch two items; show the chips, the +10, the bar.
     Hit an obstacle on purpose: "Ouch!", bar loses one segment, no game over.
   - Call out the "Faster!" toast when the ramp passes halfway.

2. **Progression and ending** (_time: …_)
   - Catch the sixth signature item: "Coupon unlocked!", chip turns orange.
   - Fill the bar: "Passport stamped!", jingle, redeem card (+100, coupon),
     travel journal with the history lines, "Back to the map".
   - Map shows Rio stamped; Porto auto-selected; pick a different theme to
     show the environment change (night São João or café terrace).
   - Final screen: passport with both stamps and themes, demo points,
     coupons list.

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

6. **Design decisions** (_time: …_)
   - Runner instead of tap-to-find (reviewer request), theme choice per city,
     map hub, costumes and furniture layers, 360×720 scene with a safe band,
     one reset path, no dependencies.

7. **The Scrambly connection** (_time: …_)
   - Discover (theme + items) → Play & progress (demo points, passport bar) →
     Redeem (stamp, demo coupon, wallet). Fox as guide. Demo labelling.

8. **Testing** (_time: …_)
   - Show `node scripts/e2e.mjs` and `layoutcheck.mjs` runs on the static
     `dist/` server; the emulated-vs-real table in the README; ZIP size check
     from `npm run package`.

9. **Limitations** (_time: …_)
   - Emulated testing only, music unauditioned, keyboard on the final screen,
     autopilot-tuned difficulty. What Stage 2 could add.

_Tool used for recording: …_
_Total time: …_
