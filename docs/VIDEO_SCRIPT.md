# Video scripts

Two recordings are required by the brief. Both scripts are written to be read
aloud; lines in _italics_ say what to show on screen. Fill in the `[...]`
placeholders (hours, dates, your own words) before recording.

Setup for both: `npm run dev` running, a phone-sized browser window
(390×844 in Chrome device mode), the repository open in the editor, a terminal.

---

## 1. Production-process recording (any length; aim for 10–15 minutes)

The brief wants to see the process and how AI output was used, evaluated,
rejected and corrected. If the live sessions were not captured, record a
narrated replay of the evidence: the plans, the commits, the profile that
constrained the assistant, and the concrete corrections.

**0:00 Intro.** _Face or desktop, brief shown._
"This is the production process of Passport Quest, my playable for Scrambly.
I used Claude Code as a pair programmer through the whole project. I will
show how the work was planned, what the assistant produced, what I rejected
and what I corrected."

**0:45 The constraints I gave the assistant.** _Open `.claude/change-loop.md`._
"Before any code I wrote a profile the assistant must follow: no runtime
dependency, no external request, every balance labelled demo, no real brand
in coupons, the e2e script is the executable spec and must change in the same
commit as the behaviour, never push or tag unasked. Everything below was
produced under these rules."

**1:45 Plan first, code second.** _Open `plans/`, scroll one plan._
"Each stage starts with a written plan: goal, files touched, blast radius,
runtime scenarios, numbered tasks. I review the plan before the assistant
writes code. Here is the Stage 3 plan for the 3D runner, with the tasks
ticked as they landed."

**2:45 The history.** _Terminal: `git log --oneline --reverse`._
"Thirty-nine commits over [N] days. Stage 1 in [N] hours: core loop,
runner, art, map hub, hardening. Stage 2: performance and feel. Stage 3: the
3D run. Each commit updates the test script with the behaviour."

**3:30 Where I changed the direction.** _Open `docs/DEVELOPMENT_NOTE.md`,
section "Implementation decisions"._
"The first idea was a fixed-screen tap-to-find game. After seeing it I asked
for a runner instead, because it gives a stronger sense of progress. That is
the single biggest decision in the project and it was mine, not the tool's."

**4:15 Rejected or corrected AI outputs.** _Show each place as you speak._
Pick three or four of these; say what was wrong and what you did.
- "The first particle system on a canvas measured slower than the DOM it
  replaced. The measurement, not the assistant, decided: capping the canvas
  at device pixel ratio 1.5 fixed it." _(dev note, problem 5)_
- "In the 3D scene the first camera made Capi too large and too close; the
  Porto bridge arch landed on the quay instead of the river; the night
  ground was too bright. I judged each from screenshots and asked for
  specific changes." _(screenshots or `gallery.html`)_
- "A golden-item test was flaky. The assistant's first fix sampled more
  often; I rejected it because it hid the cause. The real cause was the seed:
  the first golden item appeared after 36 seconds. The fix uses a seed whose
  first spawn is golden." _(dev note, Stage 3 problem 3)_
- "The package script would have overwritten the delivered Stage 1 ZIP with
  the 3D build labelled Stage 1. I caught that before running it." _(git show
  of the package-by-stage commit)_
- "Double-clicking index.html gave a blank page. The brief only requires a
  static server, but I decided a reviewer should not see a blank page, so the
  build became one self-contained file." _(dev note, problem 7)_
- "On GitHub's runner the tests failed on taps that never produced a click.
  I did not accept 'add a longer sleep'. We added diagnostics first, proved
  the click never fired, then added a retap like a player would."

**8:30 What the AI section says.** _Open the "AI correction / rejected
output — written by developer" section._
"This section is written by me, in my own words: [read it]."

**9:30 Testing as a gate.** _Terminal: `npm run check` already finished, or
the GitHub Actions page._
"Every push runs typecheck, build, a byte budget, the end-to-end flow in
both modes and two sizes, layout checks and a run with index.html opened as a
file. This is how AI output is evaluated here: it has to pass the executable
spec, not look right."

**10:30 Close.**
"Time spent: Stage 1 [N] hours, Stage 2 [N] hours, Stage 3 [N] hours. The
code is public at github.com/guimatos/passport-quest."

---

## 2. Five-minute game walkthrough

Target 5:00. Times are cumulative. Practise once; cut the optional lines if
over.

**0:00 Open (20 s).** _Start screen._
"Passport Quest is a mobile playable for Scrambly. Capi the capybara travels
through Rio and Porto. You discover a theme, play and progress, and redeem a
passport stamp and a demo coupon. That is Scrambly's loop: discover, play,
redeem."

**0:20 Core interaction (70 s).** _Tap Play, pick Rio, pick Eat & drink._
"Pick a city, then what you want to see. Capi's costume and the world change
with the theme."
_Play for a few seconds._
"The run is 3D: move left and right to catch the theme's items. Each catch
adds demo points and fills the passport bar. Hit an obstacle: 'Ouch', one
segment lost, never game over. Tap to dash through one: 'Dodged'. Five
catches in a row start a combo. A golden item freezes the frame for a moment
and counts double for the coupon."
_Optional: open a second tab with `?mode=2d`._
"The same game also runs as the original 2D runner; it is the fallback when
WebGL is missing."

**1:30 Progression and ending (60 s).** _Finish Rio, redeem, journal._
"Finishing a city stamps the passport, adds a bonus, and if you caught six of
the signature item, unlocks a demo coupon. The travel journal tells you a
line about each item you found. Back on the map, Porto is next."
_Skip ahead or let the autopilot finish; show the final screen._
"The final screen is the passport with both stamps, the demo points and the
coupons. Every amount is labelled demo; nothing claims real earnings."

**2:30 CTA and restart (30 s).** _Tap Explore Scrambly, open the console._
"The call to action is simulated: a local confirmation and a console log, no
navigation. The email form is a mock. Restart is always in the top bar and
resets everything cleanly; the tests do it twelve times in a row."

**3:00 Edge case (30 s).** _Mid-run, switch tab for ten seconds, return._
"Hide the tab mid-run. On return the world is exactly where it was, no burst
of items, no time jump. Music starts only after the first tap, has a mute, and
is silent while hidden."

**3:30 Decisions and advertiser connection (40 s).**
"Three decisions. First, a runner instead of tap-to-find, because progress is
the point. Second, themes per city, so the player discovers something before
playing, like browsing offers. Third, 3D built with hand-written WebGL and no
library, because the whole game must stay under 300 kilobytes and make no
external request."

**4:10 Time, tools, testing (30 s).**
"Time: Stage 1 [N] hours, Stage 2 [N], Stage 3 [N]. Tools: TypeScript, Vite,
Claude Code as pair programmer, headless Chrome for tests, GitHub Actions.
Testing: an end-to-end script plays both cities in both modes at 320×568 and
390×844 on every push, checks input, restart, visibility, rotate, resize and
that no external request happens."

**4:40 Limitations and changes (20 s).**
"Limitations: all testing is emulated, the 3D frame rate on a real phone is
unverified, music was never auditioned on a device. The biggest changes
since Stage 1: pooling and effects for performance, the feel layer with combo
and dash, and the 3D run. The ZIP is 294 kilobytes, one file, double-click
to play."

---

### Recording tips

- Record the browser at 390×844 with the console docked to the right; the
  phone frame is readable at 1080p.
- Append `?seed=7` to the URL so the runs are the same every take.
- For the long autopilot sections, `node scripts/playshot.mjs` can produce
  still frames to cut in.
- Say the demo labelling out loud once; it is a scored point in the brief.
