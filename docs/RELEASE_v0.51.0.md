# v0.51.0 — Continuous score and bounded audio lifecycle

## Problem and player outcome

The score previously restarted its first phrase after every battle. Rapid scene changes created one wall-clock disposal callback per transition; simultaneous cues had no voice budget. Hidden/muted pages retained a scheduler, audio unlock could undo an explicit pause, and ended pad/bass filters were not explicitly disconnected.

Exploration now resumes its in-session musical phrase when the player leaves combat. Overlapping effects gently duck one music bus and extend one recovery envelope, preserving the player's volume settings. Music and effects retain separate controls.

## Scope and architecture

- Keep all ten original authored scene themes, scene intensity, procedural ambience, shared spatial delay and mastering chain.
- Own every transient oscillator, gain and optional low-pass filter until its scheduled end or explicit disposal. Maximum 64 music voices, 24 effect voices, one active and two retiring music buses. Under overload, additional voices are skipped rather than allocating unbounded graphs.
- Retire scene buses against AudioContext time after the 650 ms crossfade. A suspended context freezes the fade; background wall-clock timers cannot prematurely remove it.
- Stop scheduler work while muted, paused, interrupted or music volume is zero. Serialize suspend/resume promises; late operations reconcile to the most recent visibility/mute request. Effects-only operation remains available.
- Reject non-finite parameters, bound cue duration/pitch/gain/delay, and make disposal terminal and idempotent. Browser audio errors remain isolated from gameplay.
- Visibility loss also clears keyboard/gamepad input. Page hide/show integrates with reversible browser back/forward cache navigation.
- No save schema, combat, economy or world snapshot changes. Phrase bookmarks are session-local presentation state and are intentionally not written to saves.

## Acceptance criteria and evidence

1. Existing score/mix/ambience and all game regressions pass.
2. Eight new deterministic lifecycle regressions cover paused input, disposal, independent volume controls, async races, interruptions, phrase continuity, shared duck recovery, invalid inputs and 2,000 rapid scene/effect bursts. Graph filters and sources are explicitly checked for cleanup.
3. Real Chromium accepts Web Audio unlock, note scheduling, voice/bus bounds, pause/resume/mute/disposal, alongside the existing seven-biome + combat, menu, save, campaign and renderer acceptance in both modes/backends.
4. TypeScript, standalone bundle and release/PWA dependency audit pass; the cache and visible version advance together.
5. Main quality workflow, Pages workflow and exact `build-info.json.source_commit` are observed before publication is reported successful. Public HTTP verification is separate from reading the published Git branch.

Local and remote evidence is recorded in `docs/AI_EVOLUTION_STATE.md` as it becomes available. No unexecuted test or deployment is declared passed here.

## Remaining production gates

A3 advances technically but stays OPEN: actual device performance is still part of its fixed acceptance. A2 mastering and A4 independent listening acceptance are also open. Physical Android, human wayfinding, visual/narrative/usability signoff and starter/economy tuning cannot be certified from automated audio tests. The fixed roadmap remains 20/32, weighted 67.50%.

Baseline regression balance probes (scripted fixed policy, not human optimal play) report 46/72 Cindrel, 36/72 Velaria and 71/72 Thorne encounter wins. A future combat/progression macroiteration should investigate that disparity before external C4/P4 acceptance; this release deliberately does not silently change combat balance.


## Observed release evidence — 2026-10-24

| Gate | Observed result |
|---|---|
| Local and remote TypeScript/Node/standalone/PWA | PASS, 322 tests, zero failures, 46 imports / 49 cached modules |
| Real Chromium game + audio lifecycle | PASS, ASCII/Pixel × WebGL2/Canvas2D, 32 biome/combat screenshots |
| Main quality + publish | SUCCESS, run `40076494825`, source `1a91a4ac033e601e2b608763e1866555aff69054` |
| Pages deployment | SUCCESS, run `40076644089`, distribution commit `9b561823f509e84188a2878d2a29c138b9341b78` |
| Distribution source provenance | Exact `build-info.json.source_commit` match to the release source above |
| Independent public HTTP smoke | UNVERIFIED, proxy CONNECT timeout from this execution environment |
| Physical Android / independent player or listener approval | UNVERIFIED, not available in this iteration |

The evidence-only documentation follow-up changes no game source and intentionally skips a redundant build. The playable release remains the exact verified source above.
