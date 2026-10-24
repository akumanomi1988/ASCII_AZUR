# ASCII AZUR — Physical Android and external acceptance protocol

This protocol describes future human/device measurements; none are implied to
have been performed by GitHub Actions, Chromium mobile emulation or an exported
rAF session. Record the **exact** GitHub Pages `build-info.json.source_commit`
and release version before each session.

## Minimum actual device: required setup

The QA owner must nominate and record an explicit low-end reference phone:
manufacturer/model, CPU/GPU, RAM, Android version, browser/version, refresh
rate, screen size/resolution and approximate battery condition. Do not choose
a hypothetical device or silently claim a minimum spec has been met.
Test both WebGL2 and actual Canvas2D fallback when supported and both
Atmospheric ASCII / Glyph Pixel Art on the chosen phone.

## Per-device functional gates

1. Launch the deployed PWA, enter a seeded game using the normal UI, switch
   graphics modes and close/reopen every game drawer and modal using touch.
2. Hold and release the virtual joystick in all four directions while walking
   a real path, interact with a Lumbre and open the journal using touch.
3. Rotate landscape → portrait → landscape during play, during dialogue and
   with a menu open. Check canvas size, HUD, scroll trapping, touch targets
   (at least 44 logical CSS px where feasible), input continuity and focus.
4. Test fullscreen entry/exit with an actual user gesture and after rotation.
5. Capture a creature, fight a boss and complete a crypt checkpoint through
   normal input. Save, close app, reopen and confirm exact flags, snapshots,
   positions and inventory. Do not inject progress.
6. Enable airplane mode **after a successful online PWA installation**, reopen
   offline, then reconnect and update. Compare source/release identity before
   and after. Verify another PWA on the same host retains its own cache.
7. Use two tabs/instances deliberately to test conflict warnings and backup
   recovery; collect reproducible faults before accepting Q4.

## 30-FPS, thermal and battery gate (G4/A3)

- Start with screen brightness, battery percentage, background app state and
  power-saving state recorded. State whether browser developer tools, OS FPS
  profiler or physical power meter was used.
- Run a **minimum 30-minute session** with at least 10 minutes traversal,
  10 minutes combat/crypt and 10 minutes mixed menu/region transitions.
  Record per-minute FPS, measured thermal conditions, battery change and
  any throttling. Repeat representative tests after the phone is warm.
- Open Settings → Laboratorio de estabilidad, start recording, exercise each
  phase, stop and export `ascii-azur-endurance.json`. This local rAF data is
  **supplementary**; a phone frame profiler and actual battery/temperature
  evidence are required for device acceptance.
- The fixed roadmap asks for sustained **≥30 FPS on the designated minimum
  Android device** and acceptable heat/battery stability. Escalate measured
  drops, long pauses, overheats, input loss or audio glitches. Define the
  numerical thermal/battery thresholds with the device owner before signoff;
  do not invent values.

## Independent external-player gates

Use independent testers unfamiliar with the internal test script. Collect
at least 20 complete combat sessions for C4 and separate unaided navigation,
narrative, creature collection and accessibility tasks as defined in
`docs/AAA_ROADMAP.md` and `docs/WORLD_PLAYTEST_TASKS.md`. Record player
assistance, errors, confusion, pacing and preference for touch/keyboard.
Attach anonymized results and a severity-ranked defect list; consent is
required before retaining any player data.

## Evidence form (one record per real session)

- Source commit / release:
- Date, named physical device / Android / browser:
- Graphics mode and actual GPU vs Canvas2D backend:
- Controller mode, device orientation and fullscreen observations:
- Session steps and playable progression milestones:
- Independent FPS profiler / capture method and sustained result:
- Battery, ambient/skin temperature measurement and warmup state:
- Local rAF JSON and/or player journey report, if volunteered:
- Screen captures and reproduction steps for defects:
- Human reviewer / explicit acceptance outcome / unresolved defects:

**Acceptance status defaults to OPEN.** A clean cloud CI run, simulated
gesture or physically unobserved 30-minute interval cannot sign off a real
hardware or human gate.
