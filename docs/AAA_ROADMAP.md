# ASCII AZUR — AAA-inspired Roadmap

Source of truth: `src/`, the automated quality gate, verified Pages `build-info.json`, and externally reproduced gameplay. Scores are separate from milestone completion. Established 2026-10-22 (macroiteration 001) from source head `93a254cb53b9cdaa374e318a004cd46880061c53`.

## Fixed progress method
Each phase has **four equally weighted (25%) milestones**. Phase weights (sum=100): 1 Core 20%, 2 World 15%, 3 Story 20%, 4 Creatures 10%, 5 Graphics 10%, 6 UX 10%, 7 Audio 5%, 8 Release 10%. A milestone is either 0 or 100%: partial implementation does not count. Global percent = sum(phase weight × completed milestones / 4). Changing these milestone definitions or weights requires an explicit versioned roadmap revision, never an ad-hoc percentage adjustment.

A checkbox means the evidence stated below exists. A completed automated gate means only that gate passed, not that players approve the quality. All release-level gates require independently checked results; a binary on GitHub without external smoke is not completed.

| Phase | Weight | Completed | Progress | Remaining milestone gate |
|---|---:|---:|---:|---|
| 1. Core gameplay and balance | 20% | 3/4 | 75% | C4 human combat balance |
| 2. World and exploration | 15% | 3/4 | 75% | W4 exploratory QA, especially physical mobile traversal |
| 3. Complete story and narrative | 20% | 3/4 | 75% | N4 independent narrative / human playtest approval |
| 4. Creatures and progression | 10% | 3/4 | 75% | P4 external pacing and balance |
| 5. Graphics and animation | 10% | 2/4 | 50% | G2 independent visual acceptance; G4 verified minimum-device FPS |
| 6. UX and mobile | 10% | 1/4 | 25% | U2 real Android testing; U3 accessibility audit; U4 human usability validation |
| 7. Audio and atmosphere | 5% | 1/4 | 25% | A2 mastered themes; A3 dynamic scene mixing; A4 external audio evaluation |
| 8. QA and release | 10% | 2/4 | 50% | Q2 save/import and concurrency stress; Q4 independent public/hardware release |

## Evidence and exact acceptance criteria per milestone

- **C1 [x]** Real damage, status, creature-capture and save/checkpoint mechanics; `tests/runtime.test.mjs`, `tests/combat-quality.test.mjs`; previous main CI 39836396417 SUCCESS.
- **C2 [x]** Scripted Arken-to-crypt interactive battle/guardian/ending walkthrough without injected wins in `tests/runtime.test.mjs` (single preselected build/seed; not all starter balance).
- **C3 [x]** Across >=12 deterministic world seeds × 3 starters: route capture through player commands, >=90% Guardian win and crypt completion under a documented fixed resource policy, no forced wins/XP, all saves reload without duplication.
- **C4 [ ]** At least 20 externally observed complete combat sessions, no dominant starter, no critical progression traps, signoff of tuning.
- **W1 [x]** Deterministic procedural topology, reachable visible routes and v1 snapshot/reload regression on 512 seeds in `tests/encounters-graphics.test.mjs`.
- **W2 [x]** Every starter has exactly one advantageous Sanctuary encounter across >=512 seeds; three reachable seeded encounters/levels 8–10; two/three/three species variants; in-game optional scouting uses actual equipped moves and cleared flags; Keeper awards a single 2-seal/2-tonic/40-echo oath completion on defeating or capturing each distinct roamer (including old saves), without a save schema bump; TS/Node/runtime and published build pass.
- **W3 [x]** Two deterministic original post-campaign regions (Ossuary and Garden), each with one NPC, two discoverable memories, three persistent encounter witnesses, altar, reward chest and one irreversible choice. Two original capturable creatures, authored moves, distinct biomes and audio, quest guidance and save-v1 compatibility. Verified by v0.37 source/browser acceptance; human quality remains W4/N4.
- **W4 [ ]** Across >=200 saved seeds, end-to-end traversal, discovery and route QA including human mobile navigation.
- **N1 [x]** Original six-objective Arken arc, Guardian/crypt outro, one-time reward and idempotent save-backed conclusion.
- **N2 [x]** Authored full second chapter integrating unique region(s), characters, choices and progression.
- **N3 [x]** Original global campaign climax, playable finale and ending sequence with persisted consequences. Completed as Crown of the Unwritten Chapter III (v0.30.0), Nullscribe boss, irreversible final choice, four Nael-consequence epilogues, deterministic region and v1 reload: 36/36 seeded chapter paths, 200 world seeds, 227/227 tests and published Pages provenance; human full-campaign new-game run remains a separate Q3/N4 gate.
- **N4 [ ]** Independent narrative/playtest signoff for clarity, pacing, coherence and endings.
- **P1 [x]** Capturable species, party/reserve, moves, experience and evolution persist with regressions.
- **P2 [x]** Four authored capturable late-game roles (Mourveil support/cleanse, Mnemoshade drain/fracture, Bellroot tank/fracture, Ashglass speed/scorch), two level-based evolutions, signature skills/animation silhouettes, biome-appropriate optional duels and gated wild ecology. Dedicated unit/integration tests plus all 12 legitimate trilogy paths pass; external player balance remains P4.
- **P3 [x]** Connected collection quests, discoveries and meaningful evolution arcs through the campaign.
- **P4 [ ]** Measured economy/collection pacing with external player acceptance.
- **G1 [x]** Two graphics modes, WebGL2/Canvas2D browser acceptance and four screenshot artifacts in CI 39836396417.
- **G2 [ ]** Distinct authored silhouettes/biome palettes and inspected screenshots across required regions for both profiles. v0.36 has a complete material/negative-space/foreground/background redesign and five authored route motifs, but independent desktop/mobile visual-quality signoff remains pending.
- **G3 [x]** Comprehensive motion/combat reaction coverage with reduced-motion QA.
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
- **Q3 [x]** 12 new-game-to-finale campaign paths (3 starters × 2 Marsh verdicts × 2 Crown verdicts) with physical overworld walking, crypt tiles, actual encounters/captures/combat, chapter save/reload and persistent four endings; main v0.31 CI and Pages provenance verified. Independent human acceptance remains N4/Q4.
- **Q4 [ ]** Main/Pages exact-source release success, publicly verified HTTP smoke, real-device QA, no high/critical defects, external testers and 16/16 quality >=4/5 averaging >=4.5.

## Baseline and current macroiteration
Baseline before macroiteration 001: completed=9/32 milestones. Phase sequence=2/4, 1/4, 1/4, 1/4, 1/4, 1/4, 1/4, 1/4. **Baseline global 30.00%**.

**Verified after macroiteration 001 (2026-10-22): 10/32 milestones.** Phase sequence=2/4, 2/4, 1/4, 1/4, 1/4, 1/4, 1/4, 1/4. **World 25% → 50%; global 30.00% → 33.75% (+3.75 pp).** W2 is closed by 512-seed regressions, real-move scouting + Keeper one-time reward/runtime save tests, main CI [39846519978](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39846519978) SUCCESS (207/207 Node tests; 4 Chromium render/backend integrations), `gh-pages` commit `b3a089b19ba2055323892f68a4ebeda11bbc0842`, Pages workflow [39846691519](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39846691519) SUCCESS, and `gh-pages/build-info.json.source_commit=748b86f855b130fe535eb18813d5e477b3ec701b`. Public external `github.io` HTTP smoke could not be performed and remains UNVERIFIED; this is not a required W2 gate and remains Q4 blocked.

## Premium blockers
The authored three-chapter storyline now has a scripted conclusion and automated **new-game → Chapter I → Chapter II → Chapter III** paths (Q3 verified), but physical Android hardware performance, independent human playtests, accessible UX, full mastering and final public release acceptance remain unfinished. C3 multi-seed Guardian/crypt automated acceptance was already verified. Premium production readiness is not established. Automated green does not qualify as commercial release acceptance.


## Verified macroiteration 002 — C3 Guardian and crypt progression (2026-10-22)

- Before: Core 2/4 milestones = **50%**, weighted global **33.75%** (10/32 milestones). After verified C3: Core **3/4 = 75%**, weighted global **38.75% (+5.00 pp)** (11/32 milestones). The other seven phase percentages remain unchanged.
- Gameplay content: Arken three distinct first-win lessons (+55 XP each) and Iria's once-only two-tonic reward; selectable Guardian lead based on real offensive moves and remaining HP; Hollowhart's powerful Ether Eclipse only fires as its announced charged attack; all changes persist under the v1 save schema.
- Deterministic 12-seed × 3-starter C3 acceptance: **Cindrel 12/12 Guardian + 12/12 crypt, Velaria 12/12 + 12/12, Thorne 12/12 + 12/12**, with actual capture attempts, earned experience, no injected victory, three unique lessons, combat/guard/tonic commands, physical crypt traversal and save/reload verification. Machine gate checks >=11/12 per cohort. There were six nonfinal Cindrel route combat losses; these were not hidden by the completion metric. Surface portals and encounter entry are invoked through game handlers rather than walked tile by tile, so this evidence does **not** close full-campaign human navigation acceptance.
- Source publication: PR [#3](https://github.com/akumanomi1988/ASCII_AZUR/pull/3) merged as `b441c8968967c3d1118f7b8d922f493ddab00e37`. Main [Actions run 39860844260](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39860844260) **SUCCESS**: 214/214 Node tests, TypeScript PASS, 4/4 Chromium graphics/backend acceptance, standalone/release + PWA audit PASS (33 dependent JS modules, 34 cached modules/assets), version 0.28.0.
- Pages: `gh-pages` commit `4ca86a4037ce35e81885ce796cd3a7f5c8f606d9`, `build-info.json.source_commit=b441c8968967c3d1118f7b8d922f493ddab00e37`, [Pages workflow 39860967515](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39860967515) **SUCCESS**. Independent public HTTP smoke of the GitHub Pages game and live `build-info.json` remains **UNVERIFIED**: external reader cannot access `github.io`.
- **Quality scores unchanged** (conservative mean 2.5/5; zero independent >=4/5 acceptances). Programmatic wins on fixed seeds do not prove human game feel, Android hardware performance, finished global story, or broad difficulty balance.


## Verified macroiteration 003 — N2: Broken Mirror Marsh, Chapter II (2026-10-23)

**New verifiable gameplay:** A fourth seeded 46×32 explorable biome (Broken Mirror Marsh) with original teal water, rain/fog, a procedural Marsh score, region entrance unlocked after the Arken finale, Nael as an authored character, two permanent memory monuments, three finite discoverable seeded wild encounters at levels 11–13, and an irreversible preserve-vs-release tribunal. Different rewards (180 Echoes + 4 seals OR 180 Echoes + 4 tonics) and Nael's distinct epilogues (+80 Echoes once) persist as v1 flags. The chapter has seven pure story states (six objectives + completion) reflected in HUD, journal and pathfinding compass. The scene keeps the existing species roster: W3 still requires **two** original meaningful regions and is **not** closed.

**Compatibility:** New v1 snapshots include the Marsh. A pre-v0.29 three-zone snapshot with six Sanctuary points restores its old original three maps/landmarks unchanged, maps the old hidden cache to the correct POI, restores the original west portal and adds the new east gate without changing the frozen original terrain. Missing Marsh data is seeded and included on the next save. No save version bump.

**Measured acceptance:** [main Actions 39907764058](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39907764058) **SUCCESS**: TypeScript, 221/221 Node regressions, 200-seed Marsh reachability/three witness topology, compatible pre-Marsh snapshots and **18/18 isolated Chapter-II paths** (two decisions × three initial starter choices × three world seeds). All witness fights in the acceptance scenario use normal battle actions. The Arken-completed party is an explicit fixture, not a dishonest claim of end-to-end human play from a new game. The main release also passed **four real Chromium modes**: Atmospheric ASCII and Glyph Pixel Art, each WebGL2 and Canvas2D, including a Marsh v1 resume. PWA release audit passed (34 JavaScript dependencies, 35 offline cache assets), version 0.29.0.

**Publication:** [PR #4](https://github.com/akumanomi1988/ASCII_AZUR/pull/4) merged at `f75ae1cdab949067688663a12383fe0a867c3d35`. Successful publish from main run 39907764058 produced `gh-pages` commit `e1449a8e8cec824b459da68207cc128296e3aa56` with `build-info.json.source_commit=f75ae1cdab949067688663a12383fe0a867c3d35` and compiled `dist/story-marsh.js`. [Pages workflow 39907917877](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39907917877) **SUCCESS**. Independent public `github.io` game and `/build-info.json` requests were **UNVERIFIED**, because the external reader could not access the site; do not conflate successful Pages workflow with live public HTTP smoke.

**Roadmap math:** Before, 11/32 milestones, Story 1/4 (25%), global 38.75%. After, **12/32**, Story **2/4 (50%)**, global **43.75% (+5.00 percentage points)**. No other phase changes. The 16 quality scores are unchanged (mean 2.5/5, 0 independently approved >=4/5). No real Android performance, independent narrative player acceptance or full global campaign ending is implied.

**Remaining N3 dependency:** The chapter closes its own arcs but not the game's overall story. Next macroiteration should integrate a connected third chapter/global climax and a coherent final ending, rather than more disconnected activities; require its own acceptance gates. Other true blockers: W3 two original new regions not yet met, Q4 external public smoke, physical Android and human playtest signoff.


## Verified macroiteration 004 — N3: Crown of the Unwritten and original campaign ending (2026-10-23)

- **Scope:** Chapter III unlocks through Nael's completed Marsh chapter. Five-world original fantasy campaign with Oriel, two authored relics, three deterministic finite roamers, original Nullscribe boss (distinct silhouette, creature animation rig, charged-Ether telegraph, uncapturable), final irreversible choice Remember/Renew, and four original consequence-based narrative epilogues honoring Marsh Keep/Release. Ending adds a one-time saved reward then preserves postgame free-roam; journal, compass, HUD, biome color and music reflect the story. Saves remain v1; old three-/four-zone snapshots preserve original terrain and original landmarks.
- **Acceptance:** 200 deterministic Crown world seeds with reachable sites and challengers; 36/36 final-chapter scenarios (two Marsh choices × two Crown endings × three starters × three seeds) using player-command combat with enemy turns, selected lead, guarding, healing, permanent flags and reload without double reward. Their Arken/Marsh checkpoint is an explicit fixture: this **does not satisfy Q3** independently verified uninterrupted campaign from a fresh save.
- **Build:** PR [#5](https://github.com/akumanomi1988/ASCII_AZUR/pull/5) authored the gameplay at merge `529b36939137ea0f0a09cdfc7e7a49e8f847e3c6`. Two narrow browser QA fixture fixes via PR [#6](https://github.com/akumanomi1988/ASCII_AZUR/pull/6) and [#7](https://github.com/akumanomi1988/ASCII_AZUR/pull/7) corrected misleading test assertions, with no gameplay source modification. Final main gameplay + tests SHA `e191c010c76ae4c8e0c4e112a89f228d30776dbe`. [Main CI 39914726339](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39914726339) **SUCCESS**: 227/227 Node tests, TypeScript, release/standalone build, PWA audit (35 imported JS dependencies, 36 offline cached assets), four real Chromium render/backend modes **PASS**.
- **Deployment:** `gh-pages` head `ac9e395c1022d2a519790da039192c83a95e36c4`, `build-info.json.source_commit=e191c010c76ae4c8e0c4e112a89f228d30776dbe`, published `dist/story-finale.js`; [GitHub Pages workflow 39914896313](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39914896313) **SUCCESS**. External reader cannot access either `https://akumanomi1988.github.io/ASCII_AZUR/` or `/build-info.json`; live public HTTP smoke remains **UNVERIFIED**, not PASS.
- **Weighted roadmap:** 12/32 → **13/32**, Story **50% → 75%**, global **43.75% → 48.75% (+5.00 pp)**, all other phase progress unchanged. Sixteen independent premium quality scores conservatively unchanged (mean 2.5/5, zero independently accepted >=4/5). W3 does not close: despite Marsh + Crown, two genuinely distinct original region-specific creature sets and full experiential exploration acceptance are not yet evidenced. N4, Q3 and Q4 remain unfinished.


## Macroiteration 005 — Q3 continuity candidate (2026-10-23; NOT ACCEPTED OR SHIPPED)

- **Q3 remains [ ]** and the authoritative global baseline stays **13/32 milestones, 48.75%**, QA 1/4 = 25%. The current published production version is v0.30.0; no production artifact or quality score is credited to this candidate.
- The [PR #8](https://github.com/akumanomi1988/ASCII_AZUR/pull/8), branch `feature/q3-uninterrupted-trilogy-and-roadbook-20261023`, proposes v0.31: read-only in-game 19-beat trilogy travel ledger, real roster/injury/move/economy-based battle advice, and 12 new-game paths spanning 3 starters × all 4 Marsh/Crown endings. Chapter 1+2+3 transitions, crypt traversal, catches, wins, earned levels, and chapter reloads are executed with input-driven battle actions. No artificial boss wins, story flags, dungeon clears, or levels are supplied.
- Earlier **nonphysical-surface** acceptance succeeded 12/12 journeys with 254 battle sessions, 23 captures, 964 combat actions and Node 230/230 PASS in feature run 39915552379, including PWA release audit. **This does not close Q3:** its script called overworld landmark handlers directly without walking to them.
- Stricter overworld traversal gate exposed a *test harness defect*, not a verified engine collision bug: the Node imported world module had a separate procedural configuration from the VM's real game. The candidate head `79b298a51cf5534e8292c386e0f8e9a40542ed37` fixes this by using the same runtime world's `ZONES`, `canOccupy` and `sweepMove` as the game. An unrelated floating-point engine patch was fully reverted. Real overworld movement gate is **PENDING verified rerun**, as are main Chromium 4/4, Pages exact-source provenance and actual public HTTP smoke.
- [Latest feature workflow 39916749487](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39916749487) and [PR workflow 39916754045](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39916754045) were **QUEUED at last verified check**. Do not merge or mark Q3 complete until they pass and the released artifact is verified.

## Verified macroiteration 005 closeout — Q3 trilogy continuity (2026-10-23)
- [PR #8](https://github.com/akumanomi1988/ASCII_AZUR/pull/8) merged into `main` at `ab793da22618d6090cdeaf36ebfb8246cbcc0753` (v0.31). [CI 39943217202](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39943217202) and [Pages 39943389653](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39943389653) both SUCCESS; `gh-pages/build-info.json.source_commit` matches. External browser opened the published game, selected a starter and traversed the opening dialogue. Headless automation covered all 12 actual-input trilogy lines, portal/world movement, crypt traversal, catches, battles, reload and all outcomes. Q3 closed, **QA 25% → 50%, 13/32 → 14/32, weighted global 48.75% → 51.25% (+2.50 pp)**. Physical Android and independent human full playthrough remain unverified.

## Verified macroiteration 006 — P2 ecology and original roster (2026-10-23)
- Release v0.32.0 via [PR #9](https://github.com/akumanomi1988/ASCII_AZUR/pull/9), source `d51c6baf970eea0f59c1f1df767c854e1c6d6442`. Four unique capturable creature identities and silhouettes, two evolutions, real signature combat effects, region-specific direct duels and post-chapter wild populations. Crucially, compulsory story witnesses and first-time Marsh/Crown wild difficulty are preserved to avoid campaign regressions; `version:1` saves remain valid.
- [Feature CI 39949766853](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39949766853) SUCCESS: TypeScript/standalone/release, **235/235 Node tests**, 36 compiled JS modules and 37 cached offline assets. Complete Q3 replay: **12/12**, 317 battles, 23 captures, 1,098 player actions. Main [CI 39950404171](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39950404171) and [Pages 39950672780](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39950672780) SUCCESS; `gh-pages` head `4ce24177c87c2478b9497fc765b6053638addf87`, `build-info.json.source_commit=d51c6baf970eea0f59c1f1df767c854e1c6d6442`. Public browser smoke: PASS — public v0.32 loaded, legacy save continued, menu/Codex opened (1/15 capturable), live build-info JSON matched source commit; cloud-browser fallback readout ~1 FPS is not a hardware benchmark.
- P2 closes as automated mechanical/role acceptance, **Creatures 25% → 50%, 14/32 → 15/32, weighted global 51.25% → 53.75% (+2.50 pp)**. P4 independent collection balance, physical Android, G2/G4 art+performance and Q4 commercial readiness remain open. **16-domain conservative average stays 2.5/5; 0/16 independently premium.**

## 2026-10-23 — Verified macroiterations P3 and G3

- **P3:** Four regional creature-bond narratives and permanent Fang/Ward outcomes integrated with evolution, memory flags, battle damage, journal/Codex, save persistence and complete campaign regression. PR #11, main `5313d27f848e26e1d44d604a163520844309a219`, main CI 39954113097 and Pages 39954378584 verified.
- **G3:** Six combat animations, all 17 creature reaction rigs, hit/heal/seal/guard/switch/faint VFX, reduced-motion behavior and Chromium combat screenshots in the four rendering mode/backend combinations. PR #12, main `4e111558d2266c728eaaa79fe1683493f4f03cc8`, PR CI `39954641591`, main CI `39954863164`, Pages `39955185992` and public provenance verified.
- **Progress:** 17/32 atomic gates, 58.75% weighted global, up from 15/32 and 53.75%. **G2 stays open** despite v0.33's 20 screenshot captures: image quality/legibility still requires demanding visual acceptance. External physical hardware, player balance and premium quality remain open.

## 2026-10-23 — Macroiteration 010, G2 world-material and glyph legibility overhaul

- **Coherent player-facing implementation:** material-aware glyph synthesis (sparse marks on flat surfaces, authored silhouette emphasis), five deterministic road/material motif families, 1.16× world composition, prominent NPC/relic beacons, sharper balanced pixel cells, and bounded 384-tile art cache. Same source scene is fed to WebGL2 and Canvas2D; no gameplay coordinate or save-format mutation.
- **Verification:** PR #13 feature CI 39956690627, main `109c0dcef11ed05217b6fc7dbff2a4bdc3580c28` CI 39957435005, GitHub Pages 39958112528, public smoke PASS: WORLD ENGINE v0.36 loaded publicly; legacy save resumed, ASCII and Glyph Pixel Art profiles inspected; gh-pages/build-info.json source provenance matched (visual quality still below premium). Browser CI produces 24 captures across five regions and combat in two modes and two backends.
- **Gate disposition:** G2 remains **OPEN** pending subjective independent art/silhouette assessment, mobile readability and physical-device FPS. Technical delivery is not counted as premium visual acceptance; weighted roadmap stays **17/32 = 58.75%**.

## 2026-10-23 — Macroiteration 011, W3 Afterlight Pilgrimage (v0.37)

- **Playable post-campaign content:** Two distinct 46×32 deterministic regions, Ossuary of the Tides and Garden of the Last Frost, with gated portals, authored NPCs, two memories and three visible witnesses each, branching irreversible resolutions, one-time rewards, quest/compass/journal integration and persisted epilogue consequences. Added Tideworn and Frostlark as original capturable creatures with signatures, rigs, silhouettes and region-specific populations. Existing three/four/five-region v1 saves retain generated terrain and gain deterministic new regions.
- **Verification:** [PR #14](https://github.com/akumanomi1988/ASCII_AZUR/pull/14), feature head `65fdfae5f6d783cad201b554a1d6d2aaa1a6df13`, feature CI `39959778039`; main source `275a41222be913a10dc1dbb9a827a1f572241807`, CI `39960464550`, Pages `39961124502`; public smoke `PASS: public WORLD ENGINE v0.37 loaded; pre-existing v0.36 local save resumed in Velo de Arken; glyph canvas rendered, compass/HUD visible and no game-origin console errors. Cloud Canvas2D fallback performance is diagnostic only.`. Automated test and browser acceptance evidence: `259/259 Node tests; TypeScript and release audit PASS (40 JS modules, 42 offline assets); 32 Chromium captures (7 biomes + combat × ASCII/Pixel × WebGL2/Canvas2D), modal choice and persistent outcome PASS`.
- **Roadmap:** W3 closed on technical/playable scope. World phase 50% → 75%, **17/32 → 18/32, weighted global 58.75% → 62.50% (+3.75 pp)**. This counts an authored world milestone, **not** verified premium visual quality, physical Android usability, independent story approval or full release. G2, G4, W4, C4, N4, P4, U2–U4, A2–A4 and Q2/Q4 remain open.

## 2026-10-23 — v0.37.1 W3 persistence integration hardening

- Legacy v1 saves with only three, four or five regions are accepted; on continue, missing Afterlight regions are generated deterministically and immediately persisted as a complete seven-zone snapshot. Previously generated tiles and landmarks remain byte-for-byte unchanged. Repeat resume is idempotent.
- [PR #15](https://github.com/akumanomi1988/ASCII_AZUR/pull/15), feature `90d037b0c11a8631cb66e28a5e7a521a3cfe76ed`, feature CI `39961928608`, main `7f1fde214eb38eb0f57c1ce701f6452c3af57998`, main CI `39962563477`, Pages `39963280935`, public smoke `PASS: public WORLD ENGINE v0.37.1 loaded, pre-existing v0.36 save resumed, glyph canvas/HUD/compass rendered, both Atmospheric ASCII and Glyph Pixel Art were selected, and no game-origin console errors were observed; cloud Canvas2D fallback FPS is not an Android benchmark.`; browser and Node acceptance `259/259 Node tests; TypeScript/standalone/offline audit PASS (40 modules, 42 assets); 32 Chromium captures and legacy 5→7-region save expansion + double-resume byte stability in ASCII/Pixel and WebGL2/Canvas2D`.
- **Disposition:** W3 technical persistence complete; Q2 not closed because interrupted-write, quota, backup-corruption, concurrent sessions and long-play stress are unverified. No numerical milestone inflation: **18/32, weighted 62.50%**; visual G2, real Android, human quality and premium gate remain open.


## Macroiteration — Q2 save integrity hardening (v0.39.0 candidate, 2026-10-23)

- The v1 primary/backup save store now refuses a stale-tab overwrite when the caller supplies its observed baseline. The live game tracks this baseline and visibly warns on cross-tab changes.
- Import commits a validated save before switching the active game; quota failures or concurrent changes retain the old live world. An existing valid primary cannot be advanced if writing its backup fails.
- Regression coverage adds 500 consecutive rotations, corrupt/oversize/read-denied primary fallback, backup quota refusal, interrupted/partial write behavior, duplicate-save no-op and stale-tab conflicts. Browser acceptance exercises stale-tab rejection and failed/successful import in the actual game UI.
- **Q2 remains OPEN** pending observed prolonged play, genuine cross-device/multi-tab race testing and version-to-version restart stress. Milestone count remains **18/32, weighted 62.50%**; no external quality score change. CI and publication must be recorded after actual verification.


## Macroiteration — accessible play and adaptive procedural score (v0.40.0 candidate, 2026-10-23)

- U3 implementation: persistent high-contrast option, keyboard skip link, browser zoom restored, visible high-contrast focus ring, accessible world/quest and combat narration, save status live announcements. Automated WCAG AA contrast-token regression plus browser UI/persistence assertions are included. Screen-reader, keyboard and human low-vision review still required before closing U3.
- A3 implementation: scene-aware bounded score mix, danger-dependent lead/bass/percussion layers, ambience ducking and evolving combat intensity based on ally health and boss phase. Pure score-mix regression checks cover all ten scenes and bounded intensity; browser/device profiling remains required before A3 acceptance.
- The eight-phase weights and 32 milestone definitions are unchanged. U3 and A3 are **implementation candidates, not accepted milestones**. No unverified progress percentage is claimed; 80% requires external human and physical-device evidence under the fixed rubric.
