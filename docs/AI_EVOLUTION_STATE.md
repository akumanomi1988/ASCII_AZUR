# ASCII AZUR — Autonomous Evolution State

Last audited: 2026-10-21, v0.17. Source of truth: `akumanomi1988/ASCII_AZUR` / `main` once promoted. One iteration per invocation; do not run scheduled or Work tasks without explicit consent.

## Vision and invariant contracts

Original dark fantasy creature RPG with visually distinctive colored ASCII/Unicode art. Character silhouettes must remain readable, creatures should have meaningful personalities, combat strategic, procedural worlds persistent per save, and mobile controls usable. No Pokémon franchise content. Existing v1 saves remain compatible. Game source in TypeScript; `play.html` is generated, not committed. GitHub Pages publishes modular static assets (`index.html`, styles, `dist/`, PWA files) and provenance to avoid limits and collisions from one giant HTML.

## Current release scope and premium completion gate

Three regions, 12 species, a playable closed Arken narrative arc, seeded roguelite expeditions, physical crypt, 34 moves, visible/direct and random encounters, creature evolution and persistent saves. Incomplete *global* campaign, content, audio mastering, physical Android device QA and external playtesting. Premium-complete gate: all 16 dimensions >=4/5, average >=4.5/5, start-to-end playthrough, 0 high/critical issues, build+CI+verified Pages provenance and validated game flow. This is not close to completion.

## Evidence-based quality scorecard (0–5)

| Domain | v0.14 | v0.15 | Evidence and measurable next acceptance |
|---|---:|---:|---|
| Art direction | 3 | 3 | Four hero directions; need consistent designs/biome art, validated by independent players |
| ASCII rendering | 3 | 3 | v0.15 continuous tiny glyphs + faster software buffer; GPU Android timings still unverified |
| Animation | 2 | 2 | Deterministic 4-view pose and motion; need authored combat poses & readable transition frames |
| World design | 2 | 2 | Three areas with landmarks; need differentiated locations and meaningful spatial exploration |
| Procedural generation | 3 | 3 | Stable seeded geometry and test coverage; need varied layouts and persistence replay QA |
| Exploration | 3 | 3 | Visible encounters, secrets, runes; need player-test exploration reward flow |
| Core gameplay | 3 | 3 | Navigation/capture/story available; six step objective journal added in v0.17; need natural-route playthrough and satisfaction testing |
| Combat | 3 | 3 | Tactical moves/battle replay; need encounter pacing/balance matrix and real-device interaction |
| Creatures | 2 | 2 | Two unique motifs added; need 12 distinct readable designs at minimum mobile glyph size |
| Story and lore | 2 | 2 | One fully integrated Arken arc (v0.17); global beginning-middle-ending campaign still missing; need a complete multi-region campaign |
| Progression | 2 | 2 | Evolution, team and quests; need balanced full campaign progression and economy |
| UX / HUD | 3 | 3 | Settings/joystick/drawer work; need device testing, information hierarchy and usability studies |
| Mobile | 2 | 2 | Emulated portrait/landscape Chromium PASS; require real Android touch/FPS verification |
| Audio | 3 | 3 | Generated ambience and combat feedback; need memorable themes, mixing and accessibility |
| Technical | 3 | 3 | 137 tests, authored Arken story progression and combat direction and software compositor, offline cache; need real-device stress/performance runs |
| Production readiness | 1 | 1 | No complete campaign or published real-device QA; need whole-game E2E and release checks |

Mean: **2.5/5** previous and current. No invented percentage or score gain; test evidence demonstrates scope completion, not commercially validated quality. Each next score increase requires observable acceptance beyond feature count.

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
