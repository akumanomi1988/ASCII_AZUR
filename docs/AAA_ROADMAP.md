# ASCII AZUR — AAA-inspired Roadmap

Source of truth: `src/`, the automated quality gate, verified Pages `build-info.json`, and externally reproduced gameplay. Scores are separate from milestone completion. Established 2026-10-22 (macroiteration 001) from source head `93a254cb53b9cdaa374e318a004cd46880061c53`.

## Fixed progress method
Each phase has **four equally weighted (25%) milestones**. Phase weights (sum=100): 1 Core 20%, 2 World 15%, 3 Story 20%, 4 Creatures 10%, 5 Graphics 10%, 6 UX 10%, 7 Audio 5%, 8 Release 10%. A milestone is either 0 or 100%: partial implementation does not count. Global percent = sum(phase weight × completed milestones / 4). Changing these milestone definitions or weights requires an explicit versioned roadmap revision, never an ad-hoc percentage adjustment.

A checkbox means the evidence stated below exists. A completed automated gate means only that gate passed, not that players approve the quality. All release-level gates require independently checked results; a binary on GitHub without external smoke is not completed.

| Phase | Weight | Completed | Progress | Remaining milestone gate |
|---|---:|---:|---:|---|
| 1. Core gameplay and balance | 20% | 3/4 | 75% | C4 human combat balance |
| 2. World and exploration | 15% | 2/4 | 50% | W3 authored new regions; W4 exploratory QA |
| 3. Complete story and narrative | 20% | 2/4 | 50% | N3 global climax/ending; N4 human narrative QA |
| 4. Creatures and progression | 10% | 1/4 | 25% | P2 broader roles/collection; P3 sidequests/evolution identity; P4 player-tested balance |
| 5. Graphics and animation | 10% | 1/4 | 25% | G2 expressive biome/character polish; G3 animation breadth; G4 verified minimum-device FPS |
| 6. UX and mobile | 10% | 1/4 | 25% | U2 real Android testing; U3 accessibility audit; U4 human usability validation |
| 7. Audio and atmosphere | 5% | 1/4 | 25% | A2 mastered themes; A3 dynamic scene mixing; A4 external audio evaluation |
| 8. QA and release | 10% | 1/4 | 25% | Q2 save/import and concurrency stress; Q3 full campaign E2E; Q4 independent public/hardware release |

## Evidence and exact acceptance criteria per milestone

- **C1 [x]** Real damage, status, creature-capture and save/checkpoint mechanics; `tests/runtime.test.mjs`, `tests/combat-quality.test.mjs`; previous main CI 39836396417 SUCCESS.
- **C2 [x]** Scripted Arken-to-crypt interactive battle/guardian/ending walkthrough without injected wins in `tests/runtime.test.mjs` (single preselected build/seed; not all starter balance).
- **C3 [x]** Across >=12 deterministic world seeds × 3 starters: route capture through player commands, >=90% Guardian win and crypt completion under a documented fixed resource policy, no forced wins/XP, all saves reload without duplication.
- **C4 [ ]** At least 20 externally observed complete combat sessions, no dominant starter, no critical progression traps, signoff of tuning.
- **W1 [x]** Deterministic procedural topology, reachable visible routes and v1 snapshot/reload regression on 512 seeds in `tests/encounters-graphics.test.mjs`.
- **W2 [x]** Every starter has exactly one advantageous Sanctuary encounter across >=512 seeds; three reachable seeded encounters/levels 8–10; two/three/three species variants; in-game optional scouting uses actual equipped moves and cleared flags; Keeper awards a single 2-seal/2-tonic/40-echo oath completion on defeating or capturing each distinct roamer (including old saves), without a save schema bump; TS/Node/runtime and published build pass.
- **W3 [ ]** Add at least two original meaningful world regions with distinct NPCs, creatures, exploration loops, authored quests and persistent terrain.
- **W4 [ ]** Across >=200 saved seeds, end-to-end traversal, discovery and route QA including human mobile navigation.
- **N1 [x]** Original six-objective Arken arc, Guardian/crypt outro, one-time reward and idempotent save-backed conclusion.
- **N2 [x]** Authored full second chapter integrating unique region(s), characters, choices and progression.
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
