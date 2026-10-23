# ASCII AZUR — Autonomous Evolution State

Updated: 2026-10-23. **STATUS: IN PROGRESS.** Last verified source release: **v0.43.0 — durable multi-slot saves and accessible combat**. Repository: `akumanomi1988/ASCII_AZUR`, production branch `main`. Release source `1575f680064e95254498cbbbdc820d9adf9596fc`; main CI `40012039385` SUCCESS; public `gh-pages/build-info.json.source_commit` matched. Candidate v0.44 expands the procedural score and nonvisual navigation; acceptance and main publication remain pending. Independent premium visual, player and physical-device approval remain unverified.

## Product vision and hard constraints

An original, coherent dark-fantasy creature RPG whose art is composed from dense ASCII/Unicode glyph primitives, not sprites covered by text. Atmospheric ASCII and contiguous Glyph Pixel Art must share gameplay/camera but retain different meaningful foreground/background glyph composition. Deterministic seeded terrain, persistent version-1 saves, exploration, collection/evolution, tactical turns, authored narrative consequences and a beginning-to-ending campaign are mandatory. Keyboard/mouse and Android touch/virtual joystick must work. Avoid protected franchise assets. **AAA-inspired quality is a target, never a production-credential claim.**

## Current release scope and completion gate

- **Seven** deterministic 46×32 explorable regions: Village, Forest, Sanctuary, Marsh, Spire, Ossuary of the Tides and Garden of the Last Frost. Existing version-1 world snapshots remain stable and extend old 3/4/5-region saves.
- **19 original creatures**: 17 capturable and two unique non-capturable bosses; tactical moves, party/reserve, collection, evolution and creature-bond choices.
- Three authored campaign chapters with persistent two-by-two finale outcomes, plus two post-campaign Afterlight chapters with their own NPCs, two discoverable memories, three visible persistent witnesses, irreversible resolutions and epilogues.
- WebGL2 / Canvas2D fallback, two presentation modes, motion/reduced-motion, region-specific procedural audio, desktop controls, touch HUD and virtual joystick, PWA/offline distribution.
- Automated campaign acceptance has exercised 12 complete starter × Marsh × Crown combinations with real player commands. Browser CI inspects desktop glyph rendering and input, but **not physical Android performance or independent human satisfaction**.
- Premium completion requires **all 16 quality domains ≥4/5**, average ≥4.5/5, no high/critical defects, full human/gameplay and physical-device acceptance, successful CI/Pages, and public artifact provenance. This is **not achieved**.

## Demandingly scored quality audit (0–5)

Each row states observable evidence, outstanding deficiency and measurable premium acceptance. Previous column is the last verified v0.36 score; current scores do not rise merely from added content.

| Dimension | Previous → Now | Evidence | Deficiency and acceptance gate |
|---|---:|---|---|
| 01 Artistic direction | 3→3 | Five pre-existing distinct palettes plus two Afterlight palettes; authored glyph silhouette primitives | Public world screenshot still has flat dominant road, noisy marks and weak focal silhouettes. Independent desktop/mobile 20-scene readability review must pass ≥90% |
| 02 ASCII rendering | 3→3 | Both ASCII/Pixel profiles; WebGL2/Canvas2D screenshot matrix and glyph-material cache | 30 sustained FPS on minimum real Android and consistent subject/background contrast ≥4.5:1 for critical entities |
| 03 Animation | 2→2 | Creature rigs, battle attack/hit/heal/seal/faint VFX, reduced-motion branch | Human-reviewed expressivity for all core battle actions and locomotion; no distracting glyph shimmer in 20-scene sweep |
| 04 World design | 2→2 | Seven regions with paths, portals, landmarks and designed Afterlight loops | Human wayfinding and biome distinction across all zones; ≥90% of 20 tasks without instructions |
| 05 Procedural generation | 3→3 | Seeded 46×32 maps, snapshot validation and 200-seed W3 reachability tests | ≥500 seeded full-route reproducibility checks and restart/load byte equality, no unreachable progression |
| 06 Exploration | 3→3 | Hidden memories, chests, altars, witnesses, secrets, journal | External players discover ≥80% critical clues unaided and judge rewards meaningful |
| 07 Core gameplay | 3→3 | Keyboard/touch movement, interactions, capture and battles in an integrated loop | 10 human first-hour sessions with no blocking friction, satisfying control feel and progression |
| 08 Combat | 3→3 | Damage/types/status, move forecasts, charged bosses, AI and 12 campaign routes | ≥20 human combat sessions and cross-starter balance with no dominant/softlocked path |
| 09 Creatures | 2→2 | 17 capturable species, roles, evolutions, signatures and rigs | Distinguishable original silhouettes, attachment and collection pacing validated by 10 players |
| 10 Story/lore | 2→2 | Three chapters, four main epilogues, Afterlight branching choices | Independent complete-playthrough narrative coherence and pacing signoff; no unresolved arc |
| 11 Progression | 2→2 | XP, one-time regional rewards, covenant choices, gated new chapters | Full 3-starter economy/level pacing across ≥50 seeds with no grind or resource dead ends |
| 12 UX/HUD | 3→3 | Quest compass, Codex, modal keyboard/mouse navigation, inventory and battle controls | WCAG-oriented UI audit and 10 unaided desktop task sessions at 1280×720 |
| 13 Mobile | 2→2 | Browser viewport/touch simulation and visible virtual joystick | Real minimum Android touch, rotation, fullscreen, font and 30-FPS validation |
| 14 Audio | 3→3 | Procedural scene motifs and SFX, persistent volume/mute | Mastered original themes, measured mixing transitions and 10 listener accessibility checks |
| 15 Technical | 3→3 | TypeScript, Node regressions, CI screenshots, PWA audit, v1 saves, Pages build provenance | Long-play/save corruption/concurrency stress, resource and security audit, zero high defects |
| 16 Production | 1→1 | Automated 12-route story acceptance and GitHub Pages production pipeline | Real-device E2E, accessibility, external beta, content QA and all release criteria signed off |

**Conservative mean: 2.5/5 → 2.5/5. Independent premium domains: 0/16.** Tests support functional claims, not commercial excellence.

## Roadmap continuation

`docs/AAA_ROADMAP.md` defines 32 fixed binary milestones and fixed phase weights. **v0.36 verified: 17/32, weighted 58.75%. v0.37 W3 verified: 18/32, weighted 62.50% (+3.75 percentage points).** Raw 18/32 is not the weighted percentage. Currently verified on v0.43: C1–C3, W1–W3, N1–N3, P1–P3, G1/G3, U1, A1 and Q1/Q3. v0.44 candidate closes Q2 and U3 upon CI/browser/publication verification (projected 20/32, 67.50% weighted). Remaining then: C4, W4, N4, P4, G2/G4, U2/U4, A2–A4 and Q4.

## Most recent integrated macroiterations and acceptance

- **v0.31 Q3:** 12 genuine new-game-to-finale input-driven paths (3 starters × 2 Marsh × 2 Crown), main `ab793da22618d6090cdeaf36ebfb8246cbcc0753`, CI 39943217202, Pages 39943389653.
- **v0.32 P2:** Four additional creature roles, signatures, evolutions and seeded wild ecology; 235 Node regressions and all 12 campaign paths, main `d51c6baf970eea0f59c1f1df767c854e1c6d6442`, CI 39950404171, Pages 39950672780.
- **v0.34 P3:** Four creature-bond narratives with irreversible Fang/Ward choices and persisted combat effects, main `5313d27f848e26e1d44d604a163520844309a219`, CI 39954113097, Pages 39954378584.
- **v0.35 G3:** Complete creature and combat reaction rigs, reduced-motion and four-backend combat screenshots, main `4e111558d2266c728eaaa79fe1683493f4f03cc8`, CI 39954863164, Pages 39955185992.
- **v0.36 G2 graphics foundation:** Material-aware glyph density, stronger subject beacons, five authored path-motif families, camera re-composition, bounded art cache. PR #13 merged main `109c0dcef11ed05217b6fc7dbff2a4bdc3580c28`; main CI 39957435005 PASS (251 Node, 24 browser captures), Pages 39958112528 PASS and public source provenance matched. **G2 remains open** due poor actual visual readability.
- **v0.37 W3 Afterlight:** Two full post-campaign region loops, distinct glyph/music identities, NPCs, discoverable memories, persistent witnesses, irreversible choices, two capturable creatures, and journal/compass/portal integration. PR #14 feature `65fdfae5f6d783cad201b554a1d6d2aaa1a6df13`, PR CI `39959778039`, main `275a41222be913a10dc1dbb9a827a1f572241807`, main CI `39960464550`, Pages `39961124502`. **259 Node tests / 32 Chromium captures PASS**, v0.37 publicly loaded and resumed a legacy save.

## Architecture and decisions

- `src/**/*.ts` authoritative; `dist/`, standalone and screenshot artifacts are generated. `src/main.ts` owns a large stateful game shell; keep domain logic pure and extract incrementally, no speculative framework rewrite.
- The world uses deterministic seed + persistable `WorldSnapshot` (gen=1). New-region generation is additive; never reroll an active player's old map. On resume, seeded historical snapshots are immediately expanded and persisted once, using the existing validated primary/backup rotation in `src/core/save-store.ts`. Interactions and irreversible choices are idempotent v1 flags.
- `src/render.ts` and dedicated material/biome modules compose ASCII glyph cells with foreground/background. WebGL2 and Canvas2D share a scene. Touch and keyboard invoke the same actions.
- TypeScript/Node/browser QA and standalone/PWA build run in GitHub Actions. `main` CI success publishes `gh-pages` with `build-info.json.source_commit`; Pages workflow and external URL require separate confirmation. Never equate a push or green CI with public deployment.
- Established user preference: fewer, **large vertical slices** with playable, persisted, UI-complete outcomes and regression evidence, not decorative patches. Protect existing user changes; no force push.

## Prioritized deficiencies / next macroiterations

1. **G2 real visual polish and legibility:** solve weak character/object silhouette separation, dominant flat roads, glyph noise and insufficient focal contrast with photographed desktop/mobile viewport comparisons, direct player benefit and art-direction signoff.
2. **W4 exploration/navigation:** 200+ seeded *real traversal* routes of all seven zones, no inaccessible clue/portal, plus unaided human wayfinding tasks.
3. **C4 / P4 gameplay tuning:** external first-hour and long-run samples, starter parity, collection rate, resource economy and boss difficulty.
4. **U2 / G4 physical Android:** joystick, orientation, text, touch target and sustained ≥30 FPS on minimum hardware; include device model and measurements.
5. **Q2 save reliability:** historical world snapshot expansion is now tested in-browser; remaining backup/rollback, quota, interrupted write, return-session and prolonged gameplay stress remain open.
6. **A2/A3 / U3:** mastered scene music, adaptive mixing, accessibility audit and reduced-motion/contrast validation.
7. **N4 / U4 / Q4:** independent complete playthroughs, polished narrative/usability, release-level severity zero and all 16 quality gates.

## Current risks and blockers

- The attached execution filesystem is **read-only**, so GitHub connector + remote Actions were used for source edits and validation. No local shell write/test result is claimed.
- Actual Android hardware, heat/battery profiling and independent player/art/music signoff are **not available here**. Browser fallback FPS is diagnostic only.
- No automatic completion percentage is inferred from number of files or features. Latest externally verified source is recorded above; if any run/deployment fails, this state must explicitly say so.

**Next priority: G2 demanding visual scene/silhouette acceptance**, followed by W4 mobility/wayfinding and full-game tuning. Never mark premium COMPLETED without all defined gates.

## 2026-10-23 — v0.37.1 W3 release hardening

- **Observed deficiency:** A v1 save made before the two Afterlight regions generated those new maps upon resume but did not materialize them into the saved snapshot. Stable replay depended on the current generator implementation, which is unacceptable for future content updates.
- **Implemented:** On continue, only seeded saves missing zones receive a complete deterministic 7-region snapshot, persisted at once with validated backup rotation. Existing tile strings and POI positions are unchanged; a second resume is byte-stable. Complete saves avoid needless snapshot writes. Version and offline cache bumped to v0.37.1.
- **Evidence:** [PR #15](https://github.com/akumanomi1988/ASCII_AZUR/pull/15), feature `90d037b0c11a8631cb66e28a5e7a521a3cfe76ed` / CI `39961928608`, main source `7f1fde214eb38eb0f57c1ce701f6452c3af57998` / CI `39962563477`, Pages `39963280935`. `259/259 Node tests; TypeScript/standalone/offline audit PASS (40 modules, 42 assets); 32 Chromium captures and legacy 5→7-region save expansion + double-resume byte stability in ASCII/Pixel and WebGL2/Canvas2D`. Public smoke: PASS: public WORLD ENGINE v0.37.1 loaded, pre-existing v0.36 save resumed, glyph canvas/HUD/compass rendered, both Atmospheric ASCII and Glyph Pixel Art were selected, and no game-origin console errors were observed; cloud Canvas2D fallback FPS is not an Android benchmark.
- **Disposition:** Compatibility and persistence strengthened within W3; Q2 remains OPEN pending corruption/quota/concurrency/long-play stress. Milestones remain **18/32, weighted 62.50%**; quality stays **2.5/5**, 0/16 premium-accepted. Browser screenshot acceptance was made resilient to asynchronous frame presentation after an unchanged-code CI run revealed a timing race, while retaining eight distinct screenshots per configuration.


## 2026-10-23 — v0.39.0 Q2 candidate: save integrity and import safety

The next production-risk slice targets stale browser tabs and quota/interrupted writes. Changes are isolated to the save-store adapter, game session baseline, existing import UI and focused Node/Chromium regressions. The v1 schema and seeded world snapshots are unchanged. The release is **not counted as shipped** until feature CI, main CI, Pages provenance and public smoke pass. Q2 remains open for physical multi-tab/device and long-play acceptance; progress remains **18/32 (62.50% weighted)**.


### 2026-10-23 — v0.40 accessibility and adaptive score integration candidate

- Added screen-reader narration for world objectives and combat states, viewport keyboard skip, browser zoom and persistent high contrast mode.
- Added deterministic danger-reactive procedural score balance for battles/bosses and tests for bounded mix values across all ten authored scenes.
- Release readiness remains **unverified** pending CI, real-device profiling and independent acceptance. Roadmap milestone count is unchanged pending evidence.


### 2026-10-23 — v0.41 campaign isolation candidate

- Implemented three independent, seed-preserving campaign slots with per-slot backup, import/export, conflict detection, summary and safe return to title. Slot I retains the original save key and schema.
- Added 3,600 rotation stress checks across three slots plus cross-slot corruption/concurrency assertions and a real-browser two-campaign restore sequence. Final status awaits observed CI and deployed Pages checks.


### 2026-10-23 — v0.42 visual clarity candidate

- Observed in the live v0.38 Canvas2D scene: too many high-contrast white glyphs in broad path/soil areas, masking actor silhouettes and causing a perceived tile grid. The original path drew three extra source marks plus eight cached authored motifs per tile.
- Reworked semantic detail budget to at most one probabilistic authored motif per tile and zero in a five-by-five tile apron around authored points of interest. Flat ground has no motif. Additional direct path, soil, grass and water strokes are sparse and low-opacity.
- Atmospheric ASCII now omits random glyphs on flat source surfaces. Glyph Pixel Art uses contiguous solid cell backgrounds, edge-driven block glyphs and quantized five-bit color with less bright ink. CPU/WebGL thresholds are aligned.
- Canvas2D-only devices enable adaptive glyph pacing by default on first launch with a bounded coarse-cell starting budget; stored opt-out remains authoritative. Save schema and procedural world snapshots are unchanged.
- Automated material-budget and fallback pacing regressions, full TypeScript/build/Node/browser quality gates and all seven-biome screenshot matrix required. Visual G2 and hardware G4 acceptance remain OPEN until actual before/after review and measured devices.


### 2026-10-23 — v0.43 autonomous reliability and accessibility candidate

- Recovery hardening: a failed or silently discarded backup write now stops before replacing the sole known-good primary. The v1 save schema and three campaign slot keys remain unchanged.
- Programmatic Q2 acceptance expands to 9,000 interleaved three-slot rotations with quota faults, torn primary writes and stale-tab conflicts, plus five-seed legacy three-region → seven-region snapshot restart/replay. Existing browser quota/import and old-save flows remain covered.
- U3 input/feedback improvements: modal dialogue focus and restoration, first-starter focus, semantic enemy/ally progressbars with current/max HP, labelled battle action group, keyboard focus continuity after combat turns, audible-independent status feedback and exposed mute state. Chromium exercises the core semantics on both graphics modes and backends.
- The official 32-milestone global score remains 18/32 and 62.50% until all fixed acceptance gates close. This implementation is a candidate; neither independent screen-reader/device signoff nor physical multi-tab race testing is claimed.


## v0.44 implementation candidate — engineered score and nonvisual guidance

- Ten authored procedural scene themes now vary over an eight-phrase harmonic arc, with a counter-melody, register movement, intensity-dependent combat fills, safe shared echo and high-pass/dynamics processing for combined music/SFX.
- H gives explicit screen-reader-friendly orientation, passable cardinal directions and current story guidance without unsolicited continuous motion chatter.
- Additional pure/graph audio tests, semantic keyboard checks and four Chromium backend/mode navigation checks are part of the release gate.
- Q2 and U3 are proposed as technical acceptance milestones following the already verified v0.43 long-run save evidence and the v0.44 accessibility audit. External mobile, audio, playtest and premium review are not assumed; report the score as accepted only after all required CI/Pages evidence exists.


## 2026-10-23 — v0.45 Glyph Pixel Art fallback clarity candidate

- Public v0.44 Canvas2D baseline was visually inspected after a fresh journey and story-dialog completion. At the adaptive 2.4x scale, large cells erased actor, foliage and landmark detail. The game ran in this cloud browser at about 1 FPS; that figure is diagnostic and not a physical Android benchmark.
- New Canvas2D Glyph Pixel Art presentation samples the authored 960×540 world into a bounded 192–480 pixel-width continuous color buffer, then scales by nearest-neighbor pixels. Sparse deterministic glyph marks are drawn only at real contrast edges. This preserves the semantic source silhouettes and avoids an output-sized software ImageData pass. Atmospheric ASCII, world rules, collisions, and version-1 saves are unchanged.
- Acceptance: CI TypeScript/Node, 4 render/backend browser paths, all-region screenshot artifacts, visual before/after, merged main and Pages source provenance are required before calling v0.45 published. G2 independent artwork approval and G4 physical Android FPS remain open. Weighted milestone progress remains 67.50% (20/32) pending separate acceptance.


## 2026-10-23 — v0.46 Atlas navigation and seven-region traversal candidate

- The world Atlas lists only discovered authored sites. Players can select any visible site as a temporary walking destination, see a fog-respecting route over known map cells, follow collision-aware compass cues, and cancel the selection. Interaction and region changes clear stale waypoints; imports, new games and resume also reset them. No save-v1 schema or seeded topology changes.
- A new deterministic W4 gate validates all landmarks and roaming witnesses across 200 persisted/reloaded world seeds and seven regions, with physical swept-movement samples. Chromium acceptance additionally verifies route selection, visual path presence and cancellation in both graphics modes and both backends.
- Candidate status only: W4 requires independent human mobile navigation and CI/Pages verification before acceptance. Commercial readiness is unchanged until those gates close.
