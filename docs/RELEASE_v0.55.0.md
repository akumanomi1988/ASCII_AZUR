# ASCII AZUR v0.55.0 — Release endurance and mobile acceptance laboratory

## Epic: closure block 4, automated engineering deliverables

The next large-scale release block provides a usable local diagnostic, reproducible
touch/viewport tests, safer offline update handling, honest evidence exports and CI
acceptance. It does not purport to emulate Android thermals, actual battery drain,
touch latency on real hardware or external player satisfaction.

### 1. Opt-in bounded endurance recording
- Start/stop/reset from **Settings → Laboratorio de estabilidad**, accessible on desktop and mobile.
- Collect only visible requestAnimationFrame intervals while explicitly enabled.
- Track separate exploration, battle, crypt and menu samples; total frames, bounded
  histogram p95 upper estimates, slow-frame share, max frame duration and average
  main-thread frame rate. Note that these are browser rAF cadence measurements,
  **not GPU completion times**.
- Drop invalid/hidden/suspended intervals; record actual viewport min/max,
  portrait/landscape orientation and transitions; do not retain raw frame arrays.
- Constant-memory aggregates permit extended sessions. Fresh gameplay sessions
  reset the volatile recording and no save-v1 field or tracked event is introduced.

### 2. Release evidence and user-facing diagnostics
- In-game panel shows measurement state and per-phase statistics with accessible
  HTML controls, reduced-motion compatibility and ≥44px primary touch targets.
- Explicit export creates `ascii-azur-endurance.json` locally. No backend,
  identifiers, save payload, game seed, external requests, GPU/thermal/battery
  claims or automatic upload. The JSON includes rendering settings, viewport,
  touch-point capability, phase samples and a cautionary interpretation.
- The existing opt-in journey export remains separate for player economy and
  narrative feedback.

### 3. Automated simulated mobile E2E
- Chromium launches real compiled modules in *both* portrait and landscape
  browser windows with synthetic touch capability (NOT a physical phone).
- Covers new-game/starter and cinematic dismiss, virtual-stick pointer down/
  move/up with release, mobile overlay boundaries, accessible settings, motion
  reduction, contrast, endurance recording, local download request, save/reload
  and persistence of user settings with ephemeral recording reset.
- Captures separate machine-readable reports for each orientation. The existing
  ASCII/Glyph Pixel Art × WebGL2/Canvas2D regression matrix continues to run.

### 4. Scoped and recoverable offline updates
- v0.55 ships a new pinned, precached service-worker namespace and exact
  standalone module list for the endurance implementation.
- Activation removes only obsolete `ascii-azur-` caches, not other PWA caches
  on the same origin. Requests outside the game's own URL path stay untouched.
- Non-OK network responses may use only an exact same-release cached response.
  No cross-version fallback or silent downgrade is allowed.
- Dedicated tests confirm cache isolation and request scope.

### 5. QA coverage and provenance
- Deterministic Node tests: 180,000-frame session, multi-phase histogram accuracy,
  hidden/suspended sample exclusion, orientation, immutable copy reporting,
  volatile game-save behavior and cache-scope safety.
- CI includes existing full campaign/Afterlight/save matrix, original four
  Chromium rendering variants and new two-orientation mobile simulation.
- `npm run verify` still gates the standalone/offline distribution; publication
  from main requires both verify and browser acceptance jobs.
- Documentation for **actual** minimum Android hardware, sustained FPS/heat/
  battery measurement and independent human playtest signoff is provided in
  `docs/ANDROID_RELEASE_ACCEPTANCE.md`.

## Acceptance and evidence policy

Before integration: require focused tests + full Node and TypeScript, independent
mobile viewport QA, four Chromium graphic/backend tests, generated release
audit, main CI, Pages source SHA and Pages deployment.

**External gates remain open until real evidence exists**: physical Android
G4/U2/A3/Q4, independent human N4/C4/P4/W4/U4, expert G2/A2/A4.
The existing fixed quality score and **20/32, 67.50% weighted** milestone
baseline cannot be raised merely for producing source, simulated gestures or
more synthetic frames. This is technical delivery of the instrumentation/
emulation portion of closure block 4, not completion of all external gates.


## Observed v0.55.0 engineering release acceptance — 2026-10-24

- [PR #32](https://github.com/akumanomi1988/ASCII_AZUR/pull/32) merged as `3b974f429c418dc5c8c32964f20c9ea73cefc4af`. The public production source is `9de648b85ad52014bf591379f9d9a5cd43258e18` (includes documentation acceptance only after the squash merge).
- Final feature PR [CI 40109745839](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/40109745839) **SUCCESS**; final main [CI 40110024127](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/40110024127) **SUCCESS**, with `verify`, `Browser and turn-menu acceptance` and `Publish validated game` all successful.
- **375/375 Node tests, zero failures**; 150 complete real-command scripted trilogy sessions / 450 chapter reloads, 12 earned-progression Afterlight journeys, 180,000-frame lab simulation, save/PWA regressions; TS and standalone package (620,165 bytes) PASS; audit **54 reachable compiled JS modules, 57 offline assets cached**.
- Four desktop renderer/backend combinations PASS (32 scene/battle captures), plus real Chromium portrait and landscape viewport with synthetic pointer movement, controls, local report export, save reload and settings persistence; zero JS errors, separate `ascii-azur-mobile-viewport-evidence` JSON artifacts. This is **not real Android digitizer/GPU/thermal evidence**.
- [Pages workflow 40110405907](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/40110405907) **SUCCESS**. `gh-pages` at `287755cf567f572b47db07f8d0efa8520a1cfabb` publishes HTML `WORLD ENGINE v0.55.0`, cache `ascii-azur-v055-q1`, compiled EnduranceLab and exact `build-info.json.source_commit=9de648b85ad52014bf591379f9d9a5cd43258e18`.
- Direct external `github.io` HTTP/client smoke from this environment: **NOT VERIFIED** (host inaccessible). GitHub Actions success is separately verified, not mistaken for browser boot.
- Milestones remain **20/32, weighted 67.50%**, quality mean 2.5/5. Block 4's engineering components are shipped, but G4/U2/A3 and external human release gates remain **OPEN** until real test records exist.
