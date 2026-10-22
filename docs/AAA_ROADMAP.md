# ASCII AZUR — AAA-inspired Roadmap

Source of truth: `src/`, the automated quality gate, verified Pages `build-info.json`, and externally reproduced gameplay. Scores are separate from milestone completion. Established 2026-10-22 (macroiteration 001) from source head `93a254cb53b9cdaa374e318a004cd46880061c53`.

## Fixed progress method
Each phase has **four equally weighted (25%) milestones**. Phase weights (sum=100): 1 Core 20%, 2 World 15%, 3 Story 20%, 4 Creatures 10%, 5 Graphics 10%, 6 UX 10%, 7 Audio 5%, 8 Release 10%. A milestone is either 0 or 100%: partial implementation does not count. Global percent = sum(phase weight × completed milestones / 4). Changing these milestone definitions or weights requires an explicit versioned roadmap revision, never an ad-hoc percentage adjustment.

A checkbox means the evidence stated below exists. A completed automated gate means only that gate passed, not that players approve the quality. All release-level gates require independently checked results; a binary on GitHub without external smoke is not completed.

| Phase | Weight | Completed | Progress | Remaining milestone gate |
|---|---:|---:|---:|---|
| 1. Core gameplay and balance | 20% | 2/4 | 50% | C3 balanced multi-starter Guardian/crypt; C4 human combat balance |
| 2. World and exploration | 15% | 2/4 | 50% | W3 authored new regions; W4 exploratory QA |
| 3. Complete story and narrative | 20% | 1/4 | 25% | N2 authored second chapter; N3 global climax/ending; N4 human narrative QA |
| 4. Creatures and progression | 10% | 1/4 | 25% | P2 broader roles/collection; P3 sidequests/evolution identity; P4 player-tested balance |
| 5. Graphics and animation | 10% | 1/4 | 25% | G2 expressive biome/character polish; G3 animation breadth; G4 verified minimum-device FPS |
| 6. UX and mobile | 10% | 1/4 | 25% | U2 real Android testing; U3 accessibility audit; U4 human usability validation |
| 7. Audio and atmosphere | 5% | 1/4 | 25% | A2 mastered themes; A3 dynamic scene mixing; A4 external audio evaluation |
| 8. QA and release | 10% | 1/4 | 25% | Q2 save/import and concurrency stress; Q3 full campaign E2E; Q4 independent public/hardware release |

## Evidence and exact acceptance criteria per milestone

- **C1 [x]** Real damage, status, creature-capture and save/checkpoint mechanics; `tests/runtime.test.mjs`, `tests/combat-quality.test.mjs`; previous main CI 39836396417 SUCCESS.
- **C2 [x]** Scripted Arken-to-crypt interactive battle/guardian/ending walkthrough without injected wins in `tests/runtime.test.mjs` (single preselected build/seed; not all starter balance).
- **C3 [ ]** Across >=12 deterministic world seeds × 3 starters: route capture through player commands, >=90% Guardian win and crypt completion under a documented fixed resource policy, no forced wins/XP, all saves reload without duplication.
- **C4 [ ]** At least 20 externally observed complete combat sessions, no dominant starter, no critical progression traps, signoff of tuning.
- **W1 [x]** Deterministic procedural topology, reachable visible routes and v1 snapshot/reload regression on 512 seeds in `tests/encounters-graphics.test.mjs`.
- **W2 [x]** Every starter has exactly one advantageous Sanctuary encounter across >=512 seeds; three reachable seeded encounters/levels 8–10; two/three/three species variants; in-game optional scouting uses actual equipped moves and cleared flags; Keeper awards a single 2-seal/2-tonic/40-echo oath completion on defeating or capturing each distinct roamer (including old saves), without a save schema bump; TS/Node/runtime and published build pass.
- **W3 [ ]** Add at least two original meaningful world regions with distinct NPCs, creatures, exploration loops, authored quests and persistent terrain.
- **W4 [ ]** Across >=200 saved seeds, end-to-end traversal, discovery and route QA including human mobile navigation.
- **N1 [x]** Original six-objective Arken arc, Guardian/crypt outro, one-time reward and idempotent save-backed conclusion.
- **N2 [ ]** Authored full second chapter integrating unique region(s), characters, choices and progression.
- **N3 [ ]** Original global campaign climax, playable finale and ending sequence with persisted consequences.
- **N4 [ ]** Independent narrative/playtest signoff for clarity, pacing, coherence and endings.
- **P1 [x]** Capturable species, party/reserve, moves, experience and evolution persist with regressions.
- **P2 [ ]** Expand original roster/roles with demonstrable strategic identity and balance.
- **P3 [ ]** Connected collection quests, discoveries and meaningful evolution arcs through the campaign.
- **P4 [ ]** Measured economy/collection pacing with external player acceptance.
- **G1 [x]** Two graphics modes, WebGL2/Canvas2D browser acceptance and four screenshot artifacts in CI 39836396417.
- **G2 [ ]** Distinct authored silhouettes/biome palettes and inspected screenshots across required regions for both profiles.
- **G3 [ ]** Comprehensive motion/combat reaction coverage with reduced-motion QA.
- **G4 [ ]** Real minimum Android hardware sustained >=30 FPS plus stable heat/battery and fallback.
- **U1 [x]** Keyboard/mouse/touch, modal navigation and virtual joystick covered by existing browser/runtime gates.
- **U2 [ ]** Real Android touch/joystick/rotation and fullscreen tests on designated minimum device.
- **U3 [ ]** Audited contrast, non-pointer interaction, screen-reader labels and alternative feedback.
- **U4 [ ]** Successful independent task-based usability study across desktop/mobile.
- **A1 [x]** Programmatic biome audio/cues, mute, persistent volume tested in `tests/audio.test.mjs`.
- **A2 [ ]** Original mastered music/theme set for all scenes and boss finale.
- **A3 [ ]** Tested dynamic transitions, mixing and device performance.
- **A4 [ ]** Independent sound quality and accessibility approval.
- **Q1 [x]** CI TypeScript/Node/build/standalone/browser checks + tracked Pages provenance, verified previous release run 39836396417.
- **Q2 [ ]** Saved world/party compatibility + resume, storage edge cases and prolonged stress across versions.
- **Q3 [ ]** All campaign paths starting from new game, real encounters, finale and replay tested end-to-end.
- **Q4 [ ]** Main/Pages exact-source release success, publicly verified HTTP smoke, real-device QA, no high/critical defects, external testers and 16/16 quality >=4/5 averaging >=4.5.

## Baseline and current macroiteration
Baseline before macroiteration 001: completed=9/32 milestones. Phase sequence=2/4, 1/4, 1/4, 1/4, 1/4, 1/4, 1/4, 1/4. **Baseline global 30.00%**.

**Verified after macroiteration 001 (2026-10-22): 10/32 milestones.** Phase sequence=2/4, 2/4, 1/4, 1/4, 1/4, 1/4, 1/4, 1/4. **World 25% → 50%; global 30.00% → 33.75% (+3.75 pp).** W2 is closed by 512-seed regressions, real-move scouting + Keeper one-time reward/runtime save tests, main CI [39846519978](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39846519978) SUCCESS (207/207 Node tests; 4 Chromium render/backend integrations), `gh-pages` commit `b3a089b19ba2055323892f68a4ebeda11bbc0842`, Pages workflow [39846691519](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39846691519) SUCCESS, and `gh-pages/build-info.json.source_commit=748b86f855b130fe535eb18813d5e477b3ec701b`. Public external `github.io` HTTP smoke could not be performed and remains UNVERIFIED; this is not a required W2 gate and remains Q4 blocked.

## Premium blockers
Global authored campaign absent; captured-party multi-seed Guardian/crypt tuning not proven; physical Android performance and human playtests missing; full public-site independent smoke unverified. Automated green does not qualify as commercial release acceptance.
