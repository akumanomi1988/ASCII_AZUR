# ASCII AZUR — Autonomous Evolution State

Updated: 2026-10-22. Latest shipped gameplay change: **v0.27.1 legacy route encounter compatibility; automated release verified, external HTTP smoke pending**. Source: `akumanomi1988/ASCII_AZUR`, release branch `main`. Do not infer deployment from a push or green CI.

## Product vision and non-negotiables

Original dark-fantasy creature RPG with dense, continuously shaded ASCII/Unicode glyph art (not a pixel-art background), recognizable silhouettes, turn-based tactical encounters, an authored campaign, deterministic procedural terrain and persistent worlds. Touch controls and HUD must work on Android and desktop. Avoid copyrighted franchise assets. Keep existing `version:1` save compatibility, full visual glyph coverage and the production WebGL2/Canvas2D fallback. Work in one complete vertical slice per invocation.

## Release scope and reality

The current game includes three regions, 12 species, an authored six-step Arken arc and finale, visible/seeded encounters, 34 moves, evolving creatures, a persistent physical crypt, expeditions, seeded maps and saves. **This is not a complete global RPG campaign**. Missing: multiple authored chapters with a satisfying global climax, full content and balance, Android physical-device QA, mastered music, accessibility coverage, independent player testing and complete start-to-end human playthrough. Do not report premium release readiness before these are verified.

## Sixteen-domain quality scorecard (0–5; conservative evidence)

| Domain | v0.26.1 | v0.26.2 | Evidence and unclosed acceptance |
|---|---:|---:|---|
| Artistic direction | 3 | 3 | Four actor facings; compare readability across biomes with users |
| ASCII rendering | 3 | 3 | Dense glyph compositor; physical GPU/low-end FPS pending |
| Animation | 2 | 2 | Authored battle motions; expressive animation coverage pending |
| World design | 2 | 2 | Three traversable regions; more meaningful authored world sites needed |
| Procedural generation | 3 | 3 | 200-seed reachability tests; persistent replay QA needed |
| Exploration | 3 | 3 | Discoveries, runes, visible paths; player reward evaluation pending |
| Core gameplay | 3 | 3 | Walkable mission routes and repeatable encounters; real-world feel pending |
| Combat | 3 | 3 | Tactical preview and charged boss; cross-seed win pacing pending |
| Creatures | 2 | 2 | 12 original species; visual personality across all at mobile scale pending |
| Story and lore | 2 | 2 | Arken arc closed; global beginning–climax–ending absent |
| Progression | 2 | 2 | First-victory XP plus finite 25% team recovery; full balance pending |
| UX / HUD | 3 | 3 | Quest guidance; real-device layout and accessibility pending |
| Mobile | 2 | 2 | Simulated viewports, no sustained physical Android QA |
| Audio | 3 | 3 | Procedural ambience and combat cues; production mix/themes pending |
| Technical | 3 | 3 | TS build, 183 unit/runtime tests, static PWA checks; stress pending |
| Production readiness | 1 | 1 | Global content, hardware QA, complete playthrough still missing |

**Average: 2.5/5 → 2.5/5.** (v0.26.1 → v0.26.2; no subjective score inflation.) These domain scores remain unchanged because feature tests are not player-experience evidence. No critical/high-severity defect resolution is claimed beyond the tested slice.

## Verified work and release baseline

- v0.14: directional hero silhouettes. v0.15: restored microscopic, dense glyph art and faster software glyph rendering. v0.16: differentiated combat choreography. v0.17: six-step authored Arken story. v0.18/0.19: quest compass and walkable path routing. v0.20: optional adaptive glyph FPS controller. v0.21/0.22: move forecasts and capture odds. v0.23: traversable physical crypt. v0.24: real-combat scripted Arken walkthrough and nonblocking boss preparation. v0.25: 50% shared party XP. v0.26: first visible encounter victories give a one-time +48 XP; roamer flags prevent repeats.
- Previous source baseline on `main`: `ff579e739a309e571b3fdc39dbd9fa4130ceb371` (documentation-only; code v0.26 in `ce9d0e2d2ec43107531dbdf3877ba595b063ced7`). Previous `gh-pages` commit `fdcf992a5a582f37aa4043a7e5ea80b5fb34cf9f`, Pages run `39763347819` SUCCESS. Public `github.io` browser smoke was **not verified**.
- v0.26.1 diagnosis: despite better first-win XP, route battles exhaust health and lead to repeated return journeys. Change: pure `recoverTrailParty` restores `ceil(maxHp*0.25)` to each conscious ally only on first-win roamer payout; cap at max HP, never revive fainted allies. No new save fields and no economy inflation. Capture, random combat, repeat roamer, boss, sentinel and expedition do not grant this respite. Battle toast communicates the recovery.
- v0.26.1 acceptance: feature head `b7b9909244e11a87c524a2ef1ccc9136c1f66e72`, GitHub Actions run `39765446134` SUCCESS, **183/183** Node tests PASS, TypeScript build PASS, 31 JS modules/32 cached PWA assets release audit PASS, generated standalone bundle PASS. Tests include no-repeat recovery, persistence, health caps, no revive, and a scripted first-forest combat using real move commands for all three starters. This is virtual-environment combat, **not** a full physical Android or human playthrough.
- v0.26.1 main merge commit `2724c2579c2316f456ea4697d40bf851415f952a` verified. GitHub Pages provenance and public smoke: **PENDING** until separately verified. Current source changes are not considered released merely because feature CI succeeded.

- v0.26.2 diagnosis: repeated altar interactions awarded +1 capture seal indefinitely, making the core creature-binding economy trivial to bypass. Each altar still heals freely, but its existing `altar-<zone>` flag now permits only one discovery seal (subject to the nine-seal bag cap). Shop purchases and combat income remain renewable; saves `version:1` need no migration. Two new runtime regressions cover regional first visits, repeated healing, old flags, persistence, cap and Mara's paid replenishment.
- v0.26.2 source release: gameplay commit `8e3c67e543354a558b643898541bcf4e2e528291` on `main`; GitHub Actions `39768946735` SUCCESS: TypeScript build PASS, **185/185** tests PASS, standalone playable bundle PASS, audit PASS (31 compiled JS dependencies, 32 cached static assets).
- v0.26.2 Pages branch head `d0dcb2c09d3345fbda61e7c2bf054b52466f2caa` includes matching `dist/main.js`, cache key `ascii-azur-v026-q03`, and `build-info.json.source_commit=8e3c67e…`. GitHub Pages workflow `39769087123` was **PENDING** at last inspection. Public `github.io` playthrough/smoke remains **UNVERIFIED** because the external browser could not access the site. Do not equate GitHub content with a verified public deployment.

## Architecture and operational invariants

- `src/**/*.ts` is the source of truth; `dist/` compiled, `play.html` generated only (never committed).
- GitHub Pages serves `gh-pages` static modules with `build-info.json.source_commit`. Updating `main` does not automatically mean the public game is updated.
- `src/main.ts` is large. Refactor incrementally around existing stable contracts, never rewrite the entire engine merely for style.
- Maintain seeded world map snapshots, idempotent quest flags, stable v1 saves, responsive joystick and dense glyph aesthetics.
- GitHub writes only through `akumanomi1988`; no force pushes, unrelated file overwrites, secrets or automatic schedules.

## Prioritized backlog

1. Verify GitHub Pages workflow `39769087123` and perform a public interactive smoke test for v0.26.2 when public site access is available.
2. Measure forest→guardian→crypt completion, consumable usage, captures and time for all three starters over many seeds; adjust real encounters based on observed failures rather than arbitrary rewards.
3. Expand the global authored campaign and supporting unique biomes/encounters to a genuine beginning, climax and ending.
4. Measure sustained physical Android WebGL2 FPS, GPU/CPU load, heat, battery, joystick and portrait/landscape usability. Target at least 30 stable FPS on a defined minimum device.
5. Complete creature identity and authored animations, audio mastering, accessibility and external user playtests.
6. Execute a full gameplay end-to-end acceptance campaign; remove all high/critical defects and verify all 16 quality dimensions at least 4/5, average at least 4.5/5 before any premium-complete claim.

**Next iteration priority:** multi-seed, three-starter progression balance through the Guardian and crypt; remove observed difficulty/dead-end problems before expanding the global campaign. Score gain requires measurable player evidence.


## 2026-10-22 — Graphics and UI overhaul v0.27 (feature branch, verification pending)

- Renderers: Added ascii and glyph-pixel profiles, independent RGB foreground/background cell compositing on WebGL2 and Canvas2D, glyph atlas edge sampling safety, fine/balanced/chunky integer cell presets, and removal of repeated global directional-stroke selection.
- The scene remains shared across modes; this is not a second world generator. Presentation prefs remain outside SaveGame(version:1).
- Reusable VISUAL_ASSETS includes authored semantic descriptors for actors, creatures, trees, cottages, ruins, stone, trails, and relics. Tree/cottage/ruin render paths consume the shared palette.
- Inputs: Viewport-local modal and drawer, contextual keyboard handling with editable-input escape hatch, standard arrow/WASD focus, Enter/Space activation, Escape transitions, focus return and modal Tab containment. Mouse/touch buttons still invoke the same game handlers.
- Settings: Immediate graphics-mode switch, per-mode controls, pixel detail presets and persistent legacy-compatible preferences. UI palette adapts to active graphics mode.
- Distribution: New compiled modules in standalone bundle and service-worker cache; version updated to 0.27.0.
- Acceptance status: Implementation committed to feature branch. CI build and 192/192 automated regression tests passed on feature branch (GitHub Actions run 39781584255; plus job 39782056285). Visual screenshots, actual device FPS and production Pages smoke remain to be verified; do not mark the art acceptance completed. The source-controlled Pages workflow now copies passing compiled output from CI to gh-pages on main pushes, records the exact source SHA, and never force-pushes.

## 2026-10-22 — UI nested navigation hardening

- Current confirmed baseline: `f062ead4a2893c490db4e35e2458e71eda0736c0`, quality-gates workflow `39785765299` SUCCESS, Pages workflow `39785839153` SUCCESS. `gh-pages/build-info.json` reports that exact source commit.
- Fixed reverse-menu entry, added regression coverage; fixed parent-menu return with Escape/gamepad Back/close control for creature skill panels and roster swap; retained the original modal opener across nested navigation.
- Acceptance still requires Chromium visual proof for both renderers, fullscreen/mobile layouts, external public smoke (public site inaccessible from the current reader), and physical Android performance. Do not claim artistic acceptance or a global game release based on CI alone.

## 2026-10-22 — Real Chromium acceptance evidence

- CI run `39806225565` passed TypeScript, **193/193** Node regressions and four real Chromium combinations (Atmospheric ASCII / Glyph Pixel Art × WebGL2 / Canvas2D) after bounding synthetic CPU fallback frames. Both `verify` and `Publish validated game` succeeded; GitHub Pages run `39806372123` also succeeded.
- Added deterministic browser canvas PNG capture artifacts for each of the four render combinations on the same seed. These are implementation evidence, **not** independent artistic approval or sustained-performance measurements. A failure to generate the PNG now fails the browser acceptance gate.
- Outstanding: human inspection of screenshots across all required zones and mobile viewports, measured sustained desktop/mobile FPS, physical Android verification, and an external HTTP smoke test against the public Pages domain.

## 2026-10-22 — Visual review correction

- The four CI screenshots from run `39806697341` were retrieved and visually inspected. They exposed a completely transparent Atmospheric ASCII Canvas2D capture and excessively repeated `i` glyphs over low-detail Glyph Pixel Art terrain. Functional browser tests alone had missed both deficiencies.
- Corrected dark-terrain glyph selection in WebGL2 and Canvas2D: low-information cells use solid cell backgrounds, with only sparse, deterministic punctuation. Added real Canvas2D rendered-pixel acceptance (alpha and nonzero RGB) plus a post-scene-transition frame delay before PNG capture. The previous capture must not be considered an accepted visual baseline.
- Art acceptance remains open pending **new** screenshot review and human readability assessment; high-level story and physical-device acceptance are out of scope for this rendering fix.

## 2026-10-22 — Glyph Pixel Art geometry-aware compositing and GPU upload

- Visually reviewed the four deterministic captures from CI `39807555358`. All four are now opaque, including previously blank ASCII/Canvas2D; however, pixel-mode bright surfaces still showed regular vertical glyph bands.
- Replaced pixel glyph selection driven by raw luminance with structure-driven selection (local color deviation and edge contrast) on both WebGL2 and Canvas2D. Uniform colored cell backgrounds should now read as continuous surfaces, while real boundaries receive glyph detail.
- Preallocated the fixed source-scene GPU texture and replaced per-frame texture-storage redefinition with `texSubImage2D`; preserves scene size and game state while reducing GL texture-allocation work. Browser validation and visual acceptance of this revision must run again before closing.

## 2026-10-22 — WebGL texture update rollback

- The fixed-allocation WebGL2 `texSubImage2D` experiment from `81ce49a` caused repeated first-variant Chromium CI timeouts (`39808164260` and `39808563603`) whereas the previous `texImage2D` renderer passed all four browser checks.
- Reverted **only** the unverified upload optimization. Structure-driven pixel glyph selection remains in place. Do not count the texture optimization as shipped or performance-improving without measured evidence.

## 2026-10-22 — Hero visual focus

- The reviewed same-seed Chromium montage reveals a disproportionate ground area and an easily lost main-player silhouette. Added a restrained, localized teal ambient halo and small ground contact ring beneath the player, consistently in both renderer modes. The visual cue is scene-space, camera-following, uses existing Canvas2D compositing, and changes no collision, save or animation logic.
- Screenshot comparison and release verification must pass for this change; real-device visual inspection remains mandatory for artistic acceptance.

## 2026-10-22 — Legacy routes and guaranteed trail challenges (v0.27.1)

- Diagnosis (source-confirmed): `visibleEncounters` required `terrain === 'path'` but legacy `worldSeed=0` returns only `ground` and `grass` along the central walkable trail, yielding zero visible route encounters in pre-generator saves. These players miss the three finite first-win XP/recovery opportunities per hostile region.
- Change: for the actual legacy world only, select reachable ground/grass tiles within two rows of the established central road; retain path-only placement for generated worlds, minimum landmark clearance and six-tile roamer separation. For generated paths obstructed near preferred x bands, try another valid reachable path before omitting a first-win fight. No terrain, NPC, economy rules, or save schema changed.
- Acceptance: new runtime tests check three deterministic encounters in both legacy regions, physical reachable tiles, terrain preservation, landmark clearance, separation, 512 generated seeds, and world-snapshot reloading. **CI, browser matrix, Pages publication and public smoke are pending at time of this source commit.** Do not infer acceptance from this entry alone.
- Domain quality scorecard remains **2.5/5** (no subjective uplift without player evidence). Source baseline immediately before this change: `fee09adb6362cc90896b16c533a1867af914cf88`. Pages metadata before this change points to `fee09adb6362cc90896b16c533a1867af914cf88` (Pages head `cce943412c960bc198ab8a5d8a4daf756b0fb313`; workflow last reported successful). Public `github.io` smoke is unavailable from this reader.
- Next: inspect CI for this change and verify Pages provenance; then quantify multi-seed win/loss and resource pacing for all three starters from forest through guardian/crypt. Subjective artwork and complete campaign gates remain open.

## 2026-10-22 — v0.27.1 release verification (documentation-only closure)

- Gameplay source commit on `main`: `053d201a8b90a082e55a4fbed015380daffefb3f`. Exactly three source changes: `src/world/encounters.ts`, `tests/encounters-graphics.test.mjs`, and this evolution log. Code release diff: 1 fast-forward commit, no unrelated files.
- GitHub Actions quality-gates run [39827806102](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39827806102): **SUCCESS**. `verify` and `Publish validated game` jobs both succeeded, including TypeScript compilation, Node regressions, standalone/release audit and four Chromium graphics/backend combinations.
- GitHub Pages source artifact: `gh-pages` commit `db28b87d9149deca33873e5902c585c257b2bc41`. `build-info.json.source_commit` is the above gameplay source commit, and `dist/world/encounters.js` contains the legacy-world and fallback placement code. Pages deployment workflow [39827992120](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39827992120): **SUCCESS**.
- External public-site navigation/interactive HTTP smoke: **UNVERIFIED**; this environment cannot directly access `https://akumanomi1988.github.io/ASCII_AZUR/`. Successful Actions and GitHub branch content do not prove an external user's page loads. Hardware Android QA, independent art judgment, multi-seed player balance and full commercial campaign are still open.
- Quality scorecard: unchanged, **2.5/5** overall; **0/16** independently accepted at 4/5 or higher. No premium-quality gate claim.
- This is a **documentation-only closure commit marked [skip ci]** to avoid re-running browser quality gates or unnecessarily redeploying identical binaries. Deployed gameplay provenance intentionally remains the earlier verified source commit above.
- Highest-value next iteration: instrument or simulate legitimate combat paths and consumables across seeds and all three starters, then remediate confirmed Guardian/crypt bottlenecks.

## 2026-10-22 — Durable combat turn checkpoints

- Source diagnosis: player attacks, capture seals, tonics, swaps and guarding checkpoint HP/consumption, then schedule enemy retaliation with a timer; loading that checkpoint previously reset `busy=false` and discarded the promised enemy turn. Repeat reloads gave free attacks or lost capture rolls.
- New optional `activeBattle.pending` turn phase ('enemy', 'capture', 'victory', 'defeat') fits existing v1 saves. Pending turns remain input-locked on reload, paid captures settle exactly once, victory/defeat transitions resume, and old v1 saves without a phase remain valid. No simulation rules, world geometry, renderer contracts, or economy formulas changed.
- Tests added: saved retaliation, consumed capture and idempotent victory reload, plus invalid phase rejection. **Feature CI, main CI, deployed provenance and external HTTP smoke must still be verified.** Do not inflate scores on code-only evidence.
- Quality baseline: unchanged 2.5/5. Next: multi-seed legitimate gameplay balancing of Guardian and crypt, complete global authored campaign, mobile-device QA.

## 2026-10-22 — Durable combat resolution: verified release closure

- Gameplay commit: `f3beb2e1d9e17d16279304082d8f1ccf10f7f053` (fast-forwarded from `feature/combat-turn-checkpoint-20261022` to `main`). Feature workflow `39829275031` SUCCESS; main quality gates workflow [39829437499](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39829437499) SUCCESS.
- Verified CI evidence: TypeScript build PASS, **198/198 Node tests PASS, zero failures**, release audit PASS (**33 compiled JS dependency modules, 34 offline cached assets**) and the four actual headless Chromium combinations PASS: Atmospheric ASCII and Glyph Pixel Art, each with WebGL2 and Canvas2D. This is limited browser acceptance, **not** long-duration FPS, accessibility or external-player experience evidence.
- GitHub Pages: `gh-pages` commit `95e991be386ce3d8a7a38f3d58c6da23c9ca81b9`; Pages workflow [39829564972](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39829564972) **SUCCESS**. `gh-pages/build-info.json.source_commit` matches the above gameplay commit and the published `dist/main.js` contains the pending-turn and capture-resolution logic.
- Direct external public-site HTTP smoke is **UNVERIFIED** (the reader cannot access the `github.io` domain). Neither green CI nor the `gh-pages` source commit proves an unrelated external browser's availability. No physical Android stress test or independent playability assessment.
- Final quality gate remains **IN PROGRESS, 2.5/5 average; 0 of 16 dimensions demonstrated at >=4/5**. The old defects across global story, high-level pacing, original content completeness, physical mobile and external validation remain in the backlog. This documentation-only `[skip ci]` closure does not change the deployed gameplay commit.
- **Next prioritized slice:** test real move/guard/tonic command sequences over multiple seeds and all three starters through Hollowhart and crypt; fix observed bottlenecks before expanding the global story.

## 2026-10-22 — Forest trail elemental counterplay and evidence (next evolution slice)

- Previous shipped code: `94d888b2b4e502e18995fc36399a6e742a5d9b18` on `main`; latest published playable code `f3beb2e1d9e17d16279304082d8f1ccf10f7f053`.
- Controlled baseline: 12 seeded worlds x 3 starters x 6 first-time trail fights = 216 actual VM battle commands with enemy turns, TONIC consumption, and first-win experience. Deliberately **no recurring altar detours**, reserve allies or captured helpers. Baseline: Cindrel **31/72** (forest 23/36; sanctuary 8/36), Velaria **22/72** (forest 12/36; sanctuary 10/36), Thorne **55/72** (forest 27/36; sanctuary 28/36). Solo late-game win rates are NOT representative of parties using captures and lumbres.
- Root cause in authored onboarding: the forest's visible encounter species lacked Ether entirely, denying Bruma/Velaria an elemental advantage among the three finite first-win training encounters. Random placement and random species could turn an intended choice into a disadvantageous start.
- Remediation: map the deterministic forest encounters to three escalating elemental lessons, `Bruma → Raíz → Éter`, with two authored species variants per lesson. Every starter has a favourable matchup without per-player scaling or altering the save/world schema. Sanctuary encounters, wild random fights, XP/HP economy and combat formulas stay unchanged.
- Feature-branch before/after controlled results using the same 12 seeds and battle algorithm: Cindrel **29/72** (forest 23/36, sanctuary 6/36), Velaria **42/72** (forest 24/36, sanctuary 18/36), Thorne **70/72** (forest 36/36, sanctuary 34/36); combined **141/216 vs 108/216**. This improved access for Velaria but **did not establish class parity**, and Cindrel's sanctuary survival marginally decreased. The 22/36 early-forest floor is an automated regression threshold, **not** a player experience completion claim.
- Quality scorecard stays **2.5/5 (all sixteen domain scores unchanged)**, with zero premium domains independently accepted >=4. Complete global storyline, party balance, physical Android, sustained rendering and independent external playtests remain open.
- Next priority: measured Guardian/crypt balance with actual captured party rosters and consumable routes, including tuning Thorne's superior solo durability and Cindrel's sanctuary weakness without flattening class identity.
- Publication evidence: the source change is on a feature branch; require passing feature CI and main quality gates, `gh-pages/build-info.json`, Pages workflow and external HTTP smoke separately. Do not mark this slice released based on these measurements alone.

## 2026-10-22 — Forest elemental onboarding released (verified closeout)

- Gameplay source commit on `main`: `529cb25dc99301517347feb0a8cd4827ac8e241e`, squashed and fast-forwarded from audited feature branch `feature/balance-probe-20261022`. Changed only `src/world/encounters.ts`, `tests/encounters-graphics.test.mjs`, `tests/runtime.test.mjs`, and this evolution state file. No force push or generated secrets.
- Confirmed static code and deterministic balance tests: **200/200 Node tests PASS**, TypeScript compilation PASS, release audit PASS (33 compiled JS dependency modules; 34 offline cached assets). Across 12 predetermined world seeds and 3 starters, 216 actual combat action sequences improved from **108/216** to **141/216** wins overall in the solo/no-altar-detour probe. Forest first-win counts: Cindrel **23/36**, Velaria **24/36**, Thorne **36/36**. Caveat: Cindrel sanctuary wins **6/36** and Thorne’s solo viability remains excessively high; this is not evidence of polished late-game balance.
- GitHub Actions main run [39833839330](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39833839330) ultimately **SUCCESS (attempt 2)** including the four Chromium rendering combinations, bundle/release audit and Pages publication. **Attempt 1 failed** due a 35-second headless Chromium first-scene timeout on ASCII/WebGL2 (not a unit test failure); this flaky production gate is a documented risk, not suppressed.
- GitHub Pages deployment: `gh-pages` commit `2314625b53a93995083696454de966c1f7c6c68d`; workflow [39834325931](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39834325931) **SUCCESS**; `gh-pages/build-info.json.source_commit=529cb25dc99301517347feb0a8cd4827ac8e241e`. Published `dist/world/encounters.js` contains the same Mist/Root/Ether trail sequence. Public-site HTTP interactive smoke **UNVERIFIED** because `github.io` is inaccessible to the available reader; do not claim it passed.
- Scoring unchanged: artistic 3, ASCII 3, animation 2, world 2, procedural 3, exploration 3, gameplay 3, combat 3, creatures 2, story 2, progression 2, UX 3, mobile 2, audio 3, technical 3, production 1. **Average 2.5/5**, zero domains at independently verified 4/5; no global story closure or premium release declaration.
- Priority: instrument multi-seed Guardian and crypt routes **with genuine captured parties** and altar use, then solve the Cindrel sanctuary and Thorne solo balance divergence. Separately harden/reproduce the Chromium CI timeout, evaluate physical Android performance and complete authored global chapters. This closure is documentation-only and marked `[skip ci]`; the deployed binary still corresponds to the above gameplay source SHA.
