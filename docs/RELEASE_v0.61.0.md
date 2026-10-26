# v0.61.0 — Adaptive sound direction and accessible listening profiles

## Integrated functionality
1. Combat danger direction derives from *live* ally/enemy HP, boss phase, charged strike stage and active statuses. The existing eight-phrase score and independent tactical warning remain authored and uninterrupted.
2. Region-specific exploration tension responds to low living-party health, nearby visible roaming witnesses, crypt traversal and locomotion. Direction updates at most once every 950 ms; no audio nodes are created on each animation frame.
3. Three independently persisted local audio mixes: Balanced (original), Clear signals (attenuated music/noise) and Night (reduced effects/filtered score). The player's individual volume sliders and mute remain authoritative. Older settings default safely.
4. Menu and narrative foreground focus duck the score and environmental bed without cutting off author-composed scene crossfades or audio bookmarks. Background-tab suspension and browser gesture unlock behavior are unchanged.
5. New deterministic score-direction tests, real Web Audio graph lifecycle mocks, 2,000-transition voice-cap stress, complete regression/Chromium/Android gates, PWA cache version and offline module closure.

## Release and acceptance
`npm run verify` covers TypeScript, all Node regressions, ten reproducible master tracks, standalone build and service-worker audit. GitHub Actions additionally exercises production browser input, minimum API30/API35 emulator routes, real public Pages smoke and exact source SHA. No new save-v1 fields, backend traffic, personal audio collection or third-party assets.

**External dependencies are still open:** listen on physical devices, verify thermal/audio behavior, and obtain independent player/art/listening signoffs. A3/A4 and the fixed premium milestones must not be marked complete solely because the automated implementation passes.
