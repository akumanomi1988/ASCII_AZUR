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
