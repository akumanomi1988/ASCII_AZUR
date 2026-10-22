# ASCII AZUR — Autonomous Evolution State

Last audited: 2026-10-22, v0.26 candidate. Source of truth: `akumanomi1988/ASCII_AZUR` / `main` once promoted. One iteration per invocation; do not run scheduled or Work tasks without explicit consent.

## Vision and invariant contracts

Original dark fantasy creature RPG with visually distinctive colored ASCII/Unicode art. Character silhouettes must remain readable, creatures should have meaningful personalities, combat strategic, procedural worlds persistent per save, and mobile controls usable. No Pokémon franchise content. Existing v1 saves remain compatible. Game source in TypeScript; `play.html` is generated, not committed. GitHub Pages publishes modular static assets (`index.html`, styles, `dist/`, PWA files) and provenance to avoid limits and collisions from one giant HTML.

## Current release scope and premium completion gate

Three regions, 12 species, a playable closed Arken narrative arc, seeded roguelite expeditions, physical crypt, 34 moves, visible/direct and random encounters, creature evolution and persistent saves. Incomplete *global* campaign, content, audio mastering, physical Android device QA and external playtesting. Premium-complete gate: all 16 dimensions >=4/5, average >=4.5/5, start-to-end playthrough, 0 high/critical issues, build+CI+verified Pages provenance and validated game flow. This is not close to completion.

## Evidence-based quality scorecard (0–5)

| Domain | v0.25 | v0.26 | Evidence and measurable next acceptance |
|---|---:|---:|---|
| Art direction | 3 | 3 | Four hero directions; need consistent designs/biome art, validated by independent players |
| ASCII rendering | 3 | 3 | v0.15 continuous tiny glyphs + faster software buffer; GPU Android timings still unverified |
| Animation | 2 | 2 | Deterministic 4-view pose and motion; need authored combat poses & readable transition frames |
| World design | 2 | 2 | Three areas with landmarks; need differentiated locations and meaningful spatial exploration |
| Procedural generation | 3 | 3 | Stable seeded geometry and test coverage; need varied layouts and persistence replay QA |
| Exploration | 3 | 3 | Visible encounters, secrets, runes; need player-test exploration reward flow |
| Core gameplay | 3 | 3 | v0.19 quest compass follows walkable routes instead of Euclidean direction through obstacles; player-perceived natural navigation remains unverified |
| Combat | 3 | 3 | Tactical moves/battle replay; need encounter pacing/balance matrix and real-device interaction |
| Creatures | 2 | 2 | Two unique motifs added; need 12 distinct readable designs at minimum mobile glyph size |
| Story and lore | 2 | 2 | One fully integrated Arken arc (v0.17); global beginning-middle-ending campaign still missing; need a complete multi-region campaign |
| Progression | 2 | 2 | Evolution, team and quests; need balanced full campaign progression and economy |
| UX / HUD | 3 | 3 | v0.19 route-aware compass, compact remaining-steps cue; real-device readability and usability tests pending |
| Mobile | 2 | 2 | Emulated portrait/landscape Chromium PASS; require real Android touch/FPS verification |
| Audio | 3 | 3 | Generated ambience and combat feedback; need memorable themes, mixing and accessibility |
| Technical | 3 | 3 | v0.19 cached shortest route fields and world-revision invalidation, procedureally seeded route tests; real-device stress/performance pending |
| Production readiness | 1 | 1 | No complete campaign or published real-device QA; need whole-game E2E and release checks |

Mean: **2.5/5** previous and current. No invented percentage or score gain; test evidence demonstrates scope completion, not commercially validated quality. Each next score increase requires observable acceptance beyond feature count.

## Iteration v0.19 — Walkable quest navigation

- **Diagnosis:** v0.18 compass used Euclidean straight-line bearings; its pointer could lead the player into trees, walls and stones.
- **Selected improvement:** cache a reverse breadth-first search on the exact solid-terrain/NPC collision map, then show the next walkable cardinal step and route distance to an actionable tile. The NPC/Guardian tile itself is never a travel waypoint.
- **Safety/integration:** no changes to procedural terrain, combat, saves, touch controls or micro-glyph shader. Reset route cache on every world generation and snapshot load, even when the seed does not change.
- **Evidence:** initial local release candidate 149/149 Node tests, TypeScript compilation, 28 JS dependencies / 29 offline cached items PASS. Tests traverse target routes over 40 procedural seeds and validate detours and save snapshot invalidation. Chromium standalone desktop and mobile landscape smoke PASS without uncaught JS exceptions.
- **Unverified:** independent players, real Android WebGL2, complete global campaign and direct live `github.io` browser test. Previous/current global rating **2.5/5 → 2.5/5**. Do not represent this as a premium-complete product.

## Iteration v0.18 — In-world quest compass (verified delivery)

- **Diagnosis:** v0.17 quests contained detailed directions but the field-of-view HUD did not show bearings, distance or actionable portal/NPC targets. In dense procedurally seeded biomes this increased navigation friction, especially on small phones.
- **Change:** `src/story-navigation.ts` derives a purely visual next-objective cue from the actual *seed-adjusted* world landmarks. Shows dynamic eight-way arrow, estimated tile distance, proximity ACTION hint for Archivist/Hollowhart/portals, appropriate east/west inter-zone navigation, direct crypt menu guidance, in-crypt clue and completed story status. Does not pretend to offer obstacle-aware pathfinding.
- **Integration:** `#storyCompass` within existing location HUD, refreshed 5x/sec during exploration and on mission/zone changes. CSS constrained for desktop, mobile landscape and portrait; no joystick/menu overlap. Legacy save schema unchanged; no location or path data written.
- **Evidence:** local Node tests 145/145 PASS (eight new story-navigation and runtime checks), TypeScript compile PASS, PWA audit 28 reachable modules/29 cached entries PASS, generated standalone boot PASS. Playwright Chromium rendered desktop 1180×740 and simulated touchscreen landscape 844×390; startup/starter/dialog, objective label, presence and menu overlap PASS, no page JS exceptions. Real mobile GPU and outdoor readability remain unverified.
- **Risk:** compass gives a straight-line bearing, not guaranteed walkable path; the authored deterministic path network must remain navigable. Subjective AAA quality cannot be asserted from tests alone. Quality score remains **2.5/5**.
- **Release provenance:** recorded in the v0.18 verified release ledger. Public HTTP smoke remains unverified.

## Iteration v0.17 — Arken main-story vertical slice

- **Diagnosis**: guardian and crypt completion were isolated: defeating Hollowhart ended chapter I and completing the crypt provided treasure, but there was no main-story connective tissue, objective list or persistent local narrative closure.
- **Implementation**: pure `src/story-campaign.ts` defines six sequential authored objectives and closing state, derived entirely from existing flags (`archivist`, two zone visits, boss victory, saved crypt `finished`). Menu → Misiones and HUD always show current objective, instructions and 0–6 milestones. After both major trials, speaking with the Archivist performs a one-time ending with three authored dialogue beats, +200 Ecos, +4 seals and the `arken-vow-restored` flag. Refreshed boss/crypt dialogues direct players onward. This closes one regional story, **not** the full campaign.
- **State safety**: no SaveGame version change; legacy saves recover milestones automatically, order-independent. One-time reward is idempotent, and the conclusion is locked until both guardian and crypt finish. Existing optional expeditions, captures and replays remain available.
- **Technical evidence**: `npm run verify` 137/137 Node tests, TS compilation and 27-module dependency audit PASS, standalone generated. Chromium HTML browser smoke desktop 1250x780 and simulated landscape mobile 844x390: intro → starter → dialogue → main quest journal, no page exceptions. Runtime test simulates story transition after boss and dungeon and asserts persistent, once-only reward.
- **Unverified**: natural whole-arc manual playthrough, real Android/WebGL2 hardware FPS, independent player feedback, remote HTTP `github.io` smoke. Mean remains **2.5/5**; no quality-score increase without user/device evidence.
- **Next**: exercise the narrative end-to-end on physical mobile and add genuine authored chapter 2 content or perf optimization with hardware metrics.

## Iteration v0.16 — Creature-specific combat direction

- **Diagnosis:** v0.15 offered the same attack lunge and hit presentation for almost every species; it undermined creature identity despite already having functional tactical combat.
- **Implementation:** `src/actors/battle-direction.ts` provides deterministic directional and family-specific physical attack curves across nine families covering all 12 species. `src/render.ts` layers dedicated attack signatures and hit glyphs over the existing combat FX and preserves the microscopic ASCII compositor. Damage, AI, captures, combat checkpoints and game saves are unchanged.
- **Accessibility:** reduced-motion preferences suppress new camera/character movement; animations never decide damage or combat timing.
- **Acceptance evidence:** local TypeScript build PASS; Node tests 130/130 PASS (five new); offline cache audit PASS (26 reachable modules, 27 cached); standalone HTML build PASS. Chromium self-contained HTML smoke passed new-game/starter/dialog/direct battle/attack on desktop (1180×740) and simulated mobile landscape (844×390) with zero uncaught JS errors.
- **Regression corrected in QA:** a top-level identifier in the standalone concat build collided with an earlier module. Renamed its helper and rebuilt; initial HTML failed to start, final build and runtime tests PASS. The CI verify sequence now regenerates the standalone before running runtime tests; the generated `play.html` is no longer committed.
- **Limits:** UI/animation visuals manually inspected but not judged by independent testers; physical Android device, GPU time, public-site HTTP smoke and full campaign playthrough remain unverified. Baseline score 2.5/5; updated score **2.5/5** (do not inflate). Animation domain remains 2/5 until external polish verification.

## v0.16 distribution architecture (2026-10-21)

- Static Pages uses `index.html`, `style.css`, `assets/icon.svg`, `manifest.webmanifest`, `sw.js`, all compiled `dist/` modules, `.nojekyll`, and `build-info.json`. Every deployment commit points to the actual compiled source tree blob SHA, with `build-info.json.source_commit` recording its origin.
- Standalone HTML is generated by `npm run verify` and attached as a CI/release artifact, not committed: its size and one-big-script lexical collisions made direct GitHub imports fragile.
- Pages source remains the published `gh-pages` branch; each iteration must verify CI, Pages and an independent public web smoke where available.

## Iteration v0.15 — Microscopic ASCII visual restoration

- **User feedback**: v0.14 looked worse. Sparse luminance/gradient thresholds removed far too many background glyphs. High-density, tiny-characters appearance is the intended aesthetic.
- `src/render/legibility.ts` and shader: no stochastic background deletion, keep dark tonal punctuation; no bare geometry shown outside the glyph compositor.
- `src/render/graphics-profile.ts`: default density .32 and scale .8; WebGL microscopic options down to .18 density/.5 scale, 1.25 physical px minimum. Canvas2D uses a workload cap when unsupported hardware cannot deliver requested resolution.
- `src/render/software-glyph.ts`: one CPU ImageData per frame, atlas-derived glyph bitmaps, preserving glyph-shaped strokes. Replaces thousands of drawImage calls.
- Options: selection labels normalized, glyph count/effective size display, versioned `ascii-azur-graphics-v2` key so older sparse visual preferences do not override new defaults; game save schema untouched.
- Local acceptance: 125 Node tests PASS, TypeScript build PASS, offline module audit 26/26 PASS. Headless Chromium manual start + options in software fallback; v0.15 settings UI checked without page errors. Fallback at 900×600 initial screen improved from ~5 FPS to ~22 FPS in the headless environment; real Android performance unverified.
- Score **2.5/5** remains evidence-conservative. Explicitly await player validation and Android WebGL2 QA.

## Iteration v0.14 — Art readability vertical slice

- `src/actors/hero-performance.ts`: 4-way deterministic directional pose, blink, gait, cape sway and full reduced-motion freeze.
- `src/render.ts`: independently composed back/front/profile hero views, authored motifs for Cindrel/Cinderwulf and Velaria.
- `src/render/legibility.ts`: sparse, edge-aware glyph field; shader and fallback paths updated to reject uniform-ground noise while preserving bright figures.
- Unit tests: 123 PASS (116 in previous release); 4-view checksums distinct; Chromium desktop, mobile landscape and legacy v0.13 regression checks PASS on Canvas2D. Offline cache audit 25/25 PASS.
- **Not yet verified**: Android hardware GPU performance, user-perceived quality, complete campaign/playthrough.

## Architecture / risk decisions

- Keep gameplay and save state unchanged. Character performance pure functions; drawing remains in Canvas prepass and goes through ASCII compositor.
- v0.14 sparse-field suppression was rejected by user feedback and reversed in v0.15. Full tonal glyph coverage is a permanent art-direction constraint unless users explicitly select a low-density mode.
- `src/main.ts` remains a large unit; refactor incrementally without disturbing working systems.
- Use only GitHub account `akumanomi1988` for writes; branch and Pages integrity checked with expected refs. No force pushes.

## Shipping and next priority

Source commit, GitHub Actions and Pages provenance are recorded below. Direct public-site browser smoke remains unverified and must not be assumed from a green deployment workflow.

1. Improve subject prominence at phone glyph density, and do *real* WebGL2/Android visual and performance testing (target >=30 stable FPS on defined supported hardware).
2. Validate the new combat choreography with real players; add species-specific sound and richer readable hit effects.
3. Deliver a complete authored narrative slice with beginning, region climax, rewards and consequences.
4. Measure accessibility and player experience with external testers.

## Verified distribution ledger — v0.14 historical reference

- Previous v0.14 source: `f07d3db72dc4b1257c6cd9178766e983f037c5df`; Pages build `e53c310c6bce045d9d635d6035463fbdfbd6c47f`, run `39620740026` SUCCESS; source state documentation update `94cceba2f6aa303187cd60ffd1574f1a9f03d906` succeeded. This is **not** a v0.15 publication claim.
- Target site: `https://akumanomi1988.github.io/ASCII_AZUR/`; browser smoke from this environment is restricted.

## v0.15 verified distribution ledger — 2026-10-21

- Published source commit: `4125d36579a4f70d0a0b5bf928e62335f2bd60db` on `main`; feature CI `39632636805` SUCCESS; main CI `39632864910` SUCCESS.
- Source SHA is the original gameplay source; subsequent documentation-only commit: `9572987fb9d9fabc0e435c7529e4568539e7b961`.
- GitHub Pages commit: `568a06c77b1e7f7cacec32d6acd538021da57774`; workflow `39632917162` SUCCESS (build, deploy and report).
- Pages `index.html` matches source `play.html` blob `bde44c7969f1b8517a88ccf903182e815de46111`. `build-info.json` references v0.15 and the source commit.
- Public URL: `https://akumanomi1988.github.io/ASCII_AZUR/`.
- Public-site HTTP/browser smoke: **NOT VERIFIED**, as the available network/browser cannot connect to that host. No claim of functional smoke success.
- Local TypeScript build PASS; 130/130 tests PASS (v0.16); offline cache check PASS. Physical Android WebGL2 benchmarks remain unverified.
- Quality score unchanged 2.5/5 (16 domain model). Next: Android GPU and performance validation, then creature combat animation and complete narrative progression.

## v0.16 verified distribution ledger (2026-10-21)

- Gameplay source commit `4f2a3c3daa3bf5a204392cda2d8503ccc0caae4c`, feature CI `39640111719` SUCCESS, `main` CI `39640354602` SUCCESS.
- GitHub Pages modular-static release commit `9a1d3e17b2dbffe836d1e6812551670f3fb59fc3`, Pages workflow `39640540615` SUCCESS (build/deploy/report).
- `gh-pages/build-info.json`: version `0.16.0`, source commit `4f2a3c3daa3bf5a204392cda2d8503ccc0caae4c`.
- Documentation-only commits followed. They do not change the deployed binary or source artifact.
- Direct public browser HTTP smoke is **NOT VERIFIED** because this execution environment cannot access `github.io`; CI and Pages success are not sufficient proof of user-side operation.
- Vertical slice 130/130 local tests and Chromium standalone smoke PASS on desktop and simulated mobile landscape. Android physical hardware, WebGL2 benchmark, end-to-end campaign and external art reviews remain open.
- Quality score previous 2.5/5; current 2.5/5, with 16-domain baseline maintained.
- Next priority: measure and optimize actual Android GPU FPS, verify combat identity and readability with users, then complete story progression.

## v0.17 verified GitHub delivery ledger — 2026-10-21

- Source branch `feature/arken-story-arc-v017` and `main` code commit: `ea4e18409149c47d59f6ae10b4248edc04cd6d1c`.
- Quality CI feature workflow `39645007749`: SUCCESS. Quality CI on `main` `39645143810`: SUCCESS.
- GitHub Pages deployment branch `gh-pages`, commit `34065e3b941872766f65d3d7f3db0090dab82c77`, workflow `39645316526`: SUCCESS (build, deploy and report all successful).
- `gh-pages/build-info.json` says `0.17.0`, source SHA `ea4e18409149c47d59f6ae10b4248edc04cd6d1c`. Published `dist/story-campaign.js` git blob `a613fb66906919bee6ddf82870be8ce9229c8a0f` equals compiled `main` artifact.
- Local acceptance `npm run verify`: 137/137 Node PASS; TypeScript PASS; 27 reachable / 28 cached assets PASS. Desktop/mobile landscape Chromium `set_content` navigation→quest journal passed without JS exceptions. Story ending simulated in runtime tests, not a complete human end-to-end route.
- Public URL `https://akumanomi1988.github.io/ASCII_AZUR/`. **Direct external HTTP/browser smoke UNVERIFIED** because the available browser refused `github.io`; never treat GitHub Actions SUCCESS as proof of public end-user playability.
- Prior/current 16-dimension global quality average **2.5/5 → 2.5/5**; all 16 domain observations retained above. Premium completion gate remains unmet. Immediate risk: Android physical-device rendering, player-perceived quality, incomplete broader campaign and full natural end-to-end.


## v0.18 verified release ledger — 2026-10-21

- Personal GitHub repository only: `akumanomi1988/ASCII_AZUR`. No unrelated repositories or accounts modified.
- Quality branch: `feature/quest-compass-v018`. Source commit promoted to `main`: `6fc981a6e569cf577293b29980ff7b9e91b5d6f6`.
- GitHub quality CI on branch run `39648729280`: **SUCCESS**. CI on `main` run `39648895070`: **SUCCESS**.
- GitHub Pages branch `gh-pages` publication commit: `0044a1c7e640457c9fd36b20bc3b76069bf24c8f`. Pages workflow `39649176586`: **SUCCESS**, all build, deploy, report steps passed.
- `gh-pages/build-info.json` confirms `0.18.0` with exact source commit. Published `dist/story-navigation.js` blob `5bd3bd9e5ff0c8452826c409ccd166a3af1df14a` matches compiled `main` source artifact.
- `npm run verify`: **145/145 PASS**, TypeScript build, browser-bootable standalone HTML, offline audit **28 reachable / 29 cached**. Chromium visual/smoke: desktop 1180×740 and landscape touch 844×390, visible compass and no menu overlap or JavaScript exceptions. Pathfinding is not implemented; compass indicates direction and approximate Euclidean distance only.
- Target URL: `https://akumanomi1988.github.io/ASCII_AZUR/`. **Independent public-site HTTP and interaction smoke NOT VERIFIED**: tools cannot resolve or access `github.io` host (DNS failure). A successful Pages deployment is not evidence that the public website can be fully played on an external client.
- **Quality**: v0.17 2.5/5 → v0.18 2.5/5. All 16 domain scores remain conservative. Completion gate still fails: no complete global commercial campaign, physical Android WebGL2 GPU FPS/performance validation, real-player usability/art feedback, and whole-campaign human end-to-end run.
- **Next priority**: real-device ultra-dense ASCII performance and gameplay input QA; then broader campaign/creature content validated through external play sessions.

## v0.19 verified GitHub delivery ledger — 2026-10-21

- Source branch: `feature/walkable-compass-v019`; promoted into `main` at commit `5b339de3897ae295eb34f83ce1da89ccf2f17e5e`.
- Quality gates: feature workflow `39660514588` SUCCESS; `main` workflow `39660654643` SUCCESS.
- `gh-pages` commit: `dfcb95fc09ea4210538a0320f47bc2a79c21fcb0`; Pages workflow `39660831110` SUCCESS.
- `gh-pages/build-info.json` says `0.19.0` and exact source commit `5b339de3897ae295eb34f83ce1da89ccf2f17e5e`. Published `dist/story-navigation.js` blob `590eb29998208a1f3166f39e2cc40639ee9e1094` and `dist/world.js` blob `02f27f263ce304505a1039ba1eac1bcd108f7f93` correspond to that source tree.
- Local acceptance: 149/149 Node tests, TypeScript and offline audit PASS. 40 procedurally generated worlds checked for actionable routes; Chromium self-contained HTML desktop and touch landscape start/play/compass, no JS page errors. Independent Android/physical-GPU FPS test not performed.
- Public URL `https://akumanomi1988.github.io/ASCII_AZUR/` and `/build-info.json`: **DIRECT HTTP/INTERACTIVE SMOKE UNVERIFIED** because available public-web tool cannot access that origin. GitHub Pages deploy SUCCESS is not an independent user-side verification.
- Previous/current mean across 16 dimensions: **2.5/5 → 2.5/5**. Full premium/AAA-inspired gate remains unmet; real-device performance, complete global campaign, full human route playthrough and playtester evidence remain outstanding.

## v0.20 verified delivery ledger — 2026-10-21

- **Diagnosis:** on some devices microscopic glyphs can produce low framerates; v0.19 only reported FPS rather than reducing render workload. Preserve user-requested tiny characters by default.
- **Implemented:** `AdaptiveGlyphs` optional main-thread pacing controller. It raises effective glyph-cell size gradually when p95/mean requestAnimationFrame timing stays slow, and restores finer glyphs after three fast windows; requires >=20 samples and >=1.8 seconds between checks. Scale is bounded to 1.0–2.4x. Works in Canvas2D and WebGL2 without modifying the selected density, save-game v1, combat, or world generation. Toggle defaults OFF and is stored separately in `ascii-azur-adaptive-fps-v1`; disabling immediately restores manual fidelity.
- **Local acceptance:** `npm run verify` PASS: TypeScript, regenerated standalone HTML, **154/154 tests**, offline cache audit **29 imported JS / 30 cached resources**. Chromium desktop settings and mobile landscape start→starter→drawer→settings PASS, enabled/disabled checkbox and mocked localStorage checked, no uncaught JS errors. Origin navigation is blocked in test browser; mocked storage does not certify real-origin persistence.
- **Source:** `feature/adaptive-glyph-fps-v020` commit `9757239473120248643a24b95804f2c3cd399349`, promoted to `main`. Feature CI `39670906478` SUCCESS and `main` CI `39671021689` SUCCESS.
- **Pages:** `gh-pages` commit `e7601c7e882a4fb29e7b140f9b6f67ddffa5b520`, Pages workflow `39671211482` SUCCESS (build, deploy, report). Published `build-info.json` states v0.20.0 and the above exact source commit; `dist/core/adaptive-glyphs.js` blob `7e3730838479fc296a72bdc8d8f927f5f350bc31`.
- **Live URL:** `https://akumanomi1988.github.io/ASCII_AZUR/`. Public-origin HTTP and full interaction smoke **NOT VERIFIED**: web/browser tool cannot access `github.io`; successful deployment is not proof of live-client behavior.
- **Quality scorecard:** all 16 dimensions retained at conservative prior values. Previous mean **2.5/5**, current mean **2.5/5**. The 30 FPS target is best-effort and is NOT validated on Android physical hardware. Full premium gate remains open (entire global campaign, full natural playthrough, real-device performance and independent playtests).
- **Next priority:** instrument physical Android GPU/CPU, p95 FPS and sustained heat/battery tests; tune the controller using observed traces, then finish the global campaign and full end-to-end journey.

## v0.21 verified release ledger — 2026-10-22

- **Problem / priority:** combat skills exposed attack details primarily through a mouse-hover title. On touch screens, players lacked damage, affinity and status-probability information before choosing an attack.
- **Implemented:** pure `src/combat/move-preview.ts` creates visible, accessible move-card summaries from the game's exact damage/status model. For attacks it shows the estimated min–max damage for existing .90–1.09 roll variance, `EFICAZ` / `RESISTIDO` affinity, optional status probability in percent, draining and cleansing labels. Healing shows recoverable current HP rather than fictitious damage. The existing damage calculation, AI, damage RNG, creature stats, turn sequence, capture and v1 saves are unchanged. Each button provides the details visually and through an accessible label.
- **Evidence:** `npm run release` PASS: TypeScript, regenerated playable standalone, **161/161 tests PASS** (seven new regression tests), offline audit **30 imported JS / 31 cached assets**. Chromium local standalone smoke PASS in desktop 1180×740, simulated landscape touch 844×390 and portrait touch 390×844: new game, creature selection, drawer→direct battle→fight selection, visible move ranges, no script errors and no move-card overflow. Not a physical Android, and touch readability was not independently playtested.
- **Source branch/commit:** `feature/tactical-move-previews-v021` promoted to `main`, commit `6c94bba7bc8ecfd3cece2721861d86db1ce69de9`. Feature CI workflow `39725739719`: SUCCESS; `main` CI workflow `39725801212`: SUCCESS.
- **Published distribution:** `gh-pages` commit `84a627bd470034396ee0d5dfd52c8709fbdc93c9`, deployment workflow `39725871183` SUCCESS (build, deploy, status). `gh-pages/build-info.json` points to v0.21.0 and the exact above source commit. Published `dist/combat/move-preview.js` blob `a2d0900c1eab3450ccfa66ca27c8fc3602fe83cf`.
- **Website:** `https://akumanomi1988.github.io/ASCII_AZUR/`. External HTTP browser/tool cannot reach `github.io`, so independent public-origin gameplay smoke **NOT VERIFIED**. Pages workflow success does not certify end-user access.
- **Quality:** previous 16-domain average **2.5/5**; current **2.5/5**. Combat/UX tactical clarity increased technically, but commercial acceptance requires player feedback. The premium gate remains unpassed due to incomplete global campaign, untested physical Android/WebGL2 sustained FPS, independent player testing, and missing full natural playthrough.
- **Next highest impact:** physical-device sustained FPS and touch UX, followed by a full extended campaign and a reproducible end-to-end playthrough with no progression blockers. Automated deployment from `main` remains a desired CD improvement; current Pages requires a separate `gh-pages` update.

## v0.22 verified release ledger — 2026-10-22

- **Diagnosis:** creature capture displayed no odds, leaving players to spend scarce seals without knowing how HP, level advantage and statuses affect binding. This is a gap in the exploration→battle→capture→collection core loop.
- **Implemented:** deterministic pure `src/combat/capture-odds.ts` reused by the capture action and the battle button. The previous formula remains byte-equivalent without status ailments. Each distinct active adverse state on the target grants +8 percentage points (capped at +16 points) while the global chance remains capped at 94%; expired/repeated statuses never stack. Statuses on the ally do not count. The action displays the rounded percentage and carries an accessible description of the odds, cost and failure counterattack. Bosses remain uncapturable; no save schema, graphics or combat damage modifications.
- **Verification:** local `npm run release` PASS (TypeScript strict compile, generated standalone HTML, **167/167 Node tests**, offline dependency audit **31 imported JS / 32 cached assets**, ZIP); `git diff --check` PASS. Six new tests cover unchanged baseline, status bonus, duplicate/expired effects, zero-HP and 94%-cap behavior, determinism and battle button. Chromium self-contained HTML smoke on desktop 1180×740, simulated touch landscape 844×390 and touch portrait 390×844: direct encounter, capture button visible and accessible, no clipping or uncaught JavaScript exceptions.
- **Source:** `feature/transparent-capture-v022`, promoted into `main` at `b9db6c35c4126fddc345deefceb167bf640c5c48`. Feature quality run `39728016877` SUCCESS; main quality run `39728099698` SUCCESS.
- **GitHub Pages:** `gh-pages` distribution commit `7bbab9c742d7227a1d63548333fa1a26de7d6336`; Pages workflow `39728174003` SUCCESS for build, deploy and report. `gh-pages/build-info.json` says `0.22.0` and names the exact above source commit. Published `dist/combat/capture-odds.js` blob `4e18ced295c0b32d950b6f094501a5795322deb1` matches compiled source.
- **Public URL:** `https://akumanomi1988.github.io/ASCII_AZUR/`. The public-origin interactive smoke is **NOT VERIFIED**: external web access and a direct container HTTP request fail DNS resolution for github.io in this environment. GitHub Actions success is not independent client verification.
- **Quality:** previous overall 16-domain mean **2.5/5**, current **2.5/5**. The gameplay/capture mechanic is more transparent, but player satisfaction, full global campaign, physical Android FPS and a complete natural end-to-end playthrough remain unverified. No score increased purely because the feature exists.
- **Next priority:** full gameplay loop QA with a prolonged start-to-finale playthrough and external playtest/balance evidence; physical Android WebGL2 benchmarking; then expand the authored world and global campaign. The automatic `main`→Pages deployment remains a separate production improvement.

## v0.23 verified delivery ledger — 2026-10-22

- **Critical diagnosis:** Although the crypt generator created connected rooms, the swept collision footprint was calculated around tile *corners* rather than the integral coordinates representing tile centres. Some genuine one-tile passages could not be crossed, making objectives, sentinels and the final door potentially inaccessible. Confirmed reproduction on seed 1 before correction.
- **Fix:** `src/dungeons/labyrinth.ts` shifts the 9-point swept footprint sampling by (+0.5,+0.5), in line with the overworld's `canOccupy`. This changes collision only: no rerolls, new seed version, save schema, game mechanics, density or existing crypt state migration.
- **Regression coverage:** `tests/dungeon-traversal.test.mjs` physically walks the correct cardinal shortest route from crypt entrance to all seven authored events and back across **150 seeded crypts**; all PASS (before the fix seed 1 had a blocked route). `tests/runtime.test.mjs` now tests a fresh story from introduction, Archivist, portal transitions, boss result, 3 required crypt seals, physical swept corridor movement, exit, Archivist finale and reward idempotency. **Boss and sentinel victories are controlled via the existing battle victory handler**, and portals are invoked via landmark handlers; this is NOT a complete natural user end-to-end playthrough.
- **Build/quality:** v0.23 `npm run release` PASS, strict TypeScript build, regenerated 339 KB self-contained HTML, **170/170 Node tests PASS**, offline dependency audit **31 reachable JS / 32 cached resources** and source ZIP assembled. Test concurrency set to two workers to prevent resource oversubscription during local execution.
- **Source branch/commit:** `feature/walkable-crypt-v023`, merged via lease-protected `main` ref update at `b192859e9c81e25dcc5178a164fa93417d47d9b4`; feature CI run `39744865372` SUCCESS, main CI run `39744939971` SUCCESS.
- **Pages:** `gh-pages` commit `5ed2cd29152fcec72b89bbfb70b6f4ac140d8458`; Pages run `39745035646` SUCCESS (build, deploy, report). `gh-pages/build-info.json` matches version 0.23.0 and source commit; published `dist/dungeons/labyrinth.js` blob `6c726ccb7610c3f9604f9f34945fa5ddacc72a8f` equals source compiled artifact.
- **Public URL:** `https://akumanomi1988.github.io/ASCII_AZUR/`; independent external public-site HTTP and interactive smoke **NOT VERIFIED** because the available web tool cannot access the hostname. Chromium local screenshots in desktop and mobile landscape exist, but the browser QA process timed out during teardown; do not count it as a complete end-to-end smoke PASS.
- **Quality baseline:** 16-domain mean **2.5/5 previous → 2.5/5 current**. This fixes a real crypt progression blocker without establishing premium quality. Still missing a full honest player-controlled beginning-to-ending journey, global campaign, physical-device GPU FPS validation, independent playtest/quality evidence, and public-origin HTTP browser verification.
- **Next priority:** automate playable start-to-finale input path including real boss/sentinel combat and stable saves, then improve encounter balance/global campaign; benchmark mobile devices.

## v0.24 verified release ledger — 2026-10-22

- **Diagnosis:** v0.23 proved the physical crypt route but explicitly forced Guardian and sentinel victories. Natural battle balance and the Guardian's readiness messaging were untested. A deterministic first attempt with one creature at level 11 after 30 wild victories still lost to Hollowhart; this does not establish that the encounter is unwinnable, but proves solo preparation is hazardous.
- **Player-facing slice:** the `guardian` landmark now opens a **non-blocking, touch-usable preparation panel** with actual party-derived advice: two conscious companions, one level 8+ creature, health recovery at a Lumbre, spare tonics, and GUARDIA during Hollowhart's charged attack. Players may proceed regardless of readiness or retreat with no penalties. The mobile landscape panel was condensed after a first visual test found the action buttons below the fold. Buttons now remain visible. Uses pure `guardianPreparation()` in the existing story campaign module; no changes to enemy AI, damage, world generation, captured-creature stats or save format.
- **Natural-combat regression:** one seeded virtual-timer run now performs **18 wild training battles, in-game altar healing, real seal-based creature captures, normal `useMove`/`tonic`/`defend` commands against Hollowhart and both crypt sentinels, swept crypt corridor movement, gate release, and once-only Archivist finale**. No test calls `winBattle()`, injects a team, changes enemy HP, marks crypt events cleared or awards experience manually. It advances the existing evolution animation clock rather than rewriting the save. The battle AI and random outcomes use reproducible seeded rolls. This is NOT a human playthrough: dialogue, portals and combat entry are triggered through the game's existing handler methods, not a fully driven physical-world controller; only one controlled seed and team policy have been exercised.
- **Local verification:** strict TypeScript compilation PASS, standalone HTML built (342100 bytes), **174/174 Node tests PASS** (four additional checks compared with v0.23), offline imports **31/31 reachable with 32 cached assets PASS**, source bundle assembled. Chromium self-contained HTML smoke in desktop 1180×740 and simulated mobile landscape 844×390: Guardian warning text and both visible, tappable controls; dismiss action verified, no uncaught JavaScript exceptions. Physical Android GPU/real touch behavior NOT VERIFIED.
- **Source:** `feature/arken-natural-combat-v024` promoted without force to `main`, game commit `8b959aad98ec138d1eaeeacfe127867118bd8f13`. Feature CI `39749721164` SUCCESS, main quality CI `39749825557` SUCCESS.
- **Pages:** `gh-pages` commit `9c93d8171cbb63a96c958e7ea678dd922ef84cf6`, workflow `39749953707` SUCCESS. The distributed `build-info.json` reports v0.24.0 and this exact source commit; `dist/story-campaign.js` blob `31b2f577135b8045eed4232c1d500f61869f29ac` matches the compiled source.
- **Public URL:** `https://akumanomi1988.github.io/ASCII_AZUR/`. External end-user HTTP and interaction smoke **NOT VERIFIED**, because `github.io` does not resolve in the current execution environment. Pages workflow success cannot replace live browser validation.
- **16-dimension quality:** previous overall **2.5/5**, current overall **2.5/5**. A credible scripted regional completion and pre-boss readability improve technical evidence, not prove player enjoyment, global campaign completeness or AAA quality.
- **Next priority:** reduce excessive repetitive pre-boss grinding through authored progression and balanced encounters, increase procedural content quality, test more seeds and all three starter choices, and run a physical-device Android WebGL2 sustained performance test plus independent human playthrough. Automating `main`→Pages publication remains an optional separate CI/CD improvement; current deployment branch is `gh-pages`.

## v0.25 verified delivery ledger — 2026-10-22

- **Priority and player-facing problem:** the combat finisher alone received battle experience; preparing a second captured creature demanded repeated individual training. The v0.24 full scripted Arken journey required 18 wild training encounters before the guardian route. This identifies grind pressure, not an independently validated optimal balance.
- **Vertical slice:** `grantPartyExperience()` awards 100% of the existing battle XP to the active creature and floor(50%) to each other conscious party companion. Fainted companions and stored reserves gain none. Existing per-creature level thresholds, learned moves, evolution rules and single-creature XP are retained. Non-active evolution is shown by the existing animation; battle toast identifies the number of teammates and their shared reward. No v1 schema changes or content/world seed changes.
- **New QA:** three party tests exercise full/half/zero XP, bench evolution, solo compatibility and invalid input; one runtime test verifies actual normal victory, captured-party XP and reserve exclusion. No fake boss wins or XP injection in the new test.
- **GitHub verification:** source change `64eadcb3d212e8c7194bb918ee6c44c7c0dc95f6` developed on `feature/party-shared-experience-v025` then promoted to `main` without force. Feature CI `39753741140` SUCCESS and main CI `39753962969` SUCCESS: TypeScript strict build, generated standalone (342456 bytes), **178/178 Node tests PASS**, offline audit **31 reachable JS / 32 cached** and release packaging. No independent Chromium visual pass was executed for this iteration.
- **Pages:** `gh-pages` commit `3b275d10a02920e74397f57a5bd93c547e0a3c15` contains the source commit's compiled `dist/main.js` and `dist/party.js`, updated index and versioned service worker. Pages deployment run `39754095131` SUCCESS. `gh-pages/build-info.json` records version `0.25.0`, the exact source commit above and main CI `39753962969`; module blobs match that source commit.
- **Public origin:** `https://akumanomi1988.github.io/ASCII_AZUR/`. Independent live HTTP/browser interaction smoke **NOT VERIFIED**: the external inspection tool cannot access this origin. A green Pages deployment proves successful publication workflow, not independent game operation for real players.
- **Quality model:** 16-dimension aggregate **2.5/5 previous → 2.5/5 current**. New progression behavior is technically verified; grind reduction, combat balance, Android hardware FPS and perceived player enjoyment are unverified. Premium-complete gate is NOT passed.
- **Next highest priority:** compare start-to-Guardian balance across all three starters and many deterministic world/encounter seeds using legitimate gameplay commands; reduce unnecessary grind based on the measured distribution, without making tactical encounters trivial. Then expand the global multi-region campaign and independently test on physical Android devices with sustained WebGL2 frame timing.

## Iteration v0.26 — Persistent first-trail XP (candidate; CI/deployment pending)

- **Diagnosis:** v0.24 scripted first playthrough used 18 repeated wild battles to prepare for the guardian. The three persistent forest trail enemies gave only the same XP as random battles; initial exploration did not accelerate progression.
- **Implementation:** an extra 48 XP on each first victory over a canonical visible trail encounter (forest/sanctuary slots 0–2), computed before marking the persistent `roamer-*` flag. The normal party XP payout applies; defeated and reserve creatures receive nothing. Captures remove that encounter without the victory bonus. No save, world generation, combat strength or graphics format changes.
- **Acceptance target:** deterministic three-starter experience threshold at forest levels 5–7; real combat victory via player attack commands, idempotent payout and persistent encounter flag; strict build, full tests, offline PWA audit, main CI, exact Pages provenance.
- **Score:** previous **2.5/5**, current **2.5/5** pending independent balance/playtesting. Cannot claim a human-validated 18-fight reduction; repeated fight counts depend on survival, captures and routing.
- **Outstanding:** global campaign, real Android WebGL2 and performance, external testers, complete user-input playthrough, direct public-origin gameplay smoke. Next: multi-seed three-starter natural Guardian balance testing, then authored progression expansion.
