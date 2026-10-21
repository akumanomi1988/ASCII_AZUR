# ASCII AZUR — Autonomous Evolution State

Last audited: 2026-10-21, v0.16. Source of truth: `akumanomi1988/ASCII_AZUR` / `main` once promoted. One iteration per invocation; do not run scheduled or Work tasks without explicit consent.

## Vision and invariant contracts

Original dark fantasy creature RPG with visually distinctive colored ASCII/Unicode art. Character silhouettes must remain readable, creatures should have meaningful personalities, combat strategic, procedural worlds persistent per save, and mobile controls usable. No Pokémon franchise content. Existing v1 saves remain compatible. Game source in TypeScript; `play.html` is generated at verify/release time, not committed. GitHub Pages distributes modular static assets (`index.html`, styles, `dist/`, PWA files) plus provenance.

## Current release scope and premium completion gate

Three regions, 12 species, opening narrative, seeded roguelite expeditions, physical crypt, 34 moves, visible/direct and random encounters, creature evolution and persistent saves. Incomplete campaign/story arc, content, audio mastering, physical Android device QA and external playtesting. Premium-complete gate: all 16 dimensions >=4/5, average >=4.5/5, start-to-end playthrough, 0 high/critical issues, build+CI+verified Pages provenance and validated game flow. This is not close to completion.

## Evidence-based quality scorecard (0–5)

| Domain | v0.14 | v0.15 | Evidence and measurable next acceptance |
|---|---:|---:|---|
| Art direction | 3 | 3 | Four hero directions; need consistent designs/biome art, validated by independent players |
| ASCII rendering | 3 | 3 | v0.15 continuous tiny glyphs + faster software buffer; GPU Android timings still unverified |
| Animation | 2 | 2 | Deterministic 4-view pose and motion; need authored combat poses & readable transition frames |
| World design | 2 | 2 | Three areas with landmarks; need differentiated locations and meaningful spatial exploration |
| Procedural generation | 3 | 3 | Stable seeded geometry and test coverage; need varied layouts and persistence replay QA |
| Exploration | 3 | 3 | Visible encounters, secrets, runes; need player-test exploration reward flow |
| Core gameplay | 3 | 3 | Navigation/capture/story available; need objective feedback and flow satisfaction testing |
| Combat | 3 | 3 | Tactical moves/battle replay; need encounter pacing/balance matrix and real-device interaction |
| Creatures | 2 | 2 | Two unique motifs added; need 12 distinct readable designs at minimum mobile glyph size |
| Story and lore | 2 | 2 | First chapter only; require a coherent complete beginning-middle-ending campaign |
| Progression | 2 | 2 | Evolution, team and quests; need balanced full campaign progression and economy |
| UX / HUD | 3 | 3 | Settings/joystick/drawer work; need device testing, information hierarchy and usability studies |
| Mobile | 2 | 2 | Emulated portrait/landscape Chromium PASS; require real Android touch/FPS verification |
| Audio | 3 | 3 | Generated ambience and combat feedback; need memorable themes, mixing and accessibility |
| Technical | 3 | 3 | 130 tests, combat direction and software compositor, offline cache; need real-device stress/performance runs |
| Production readiness | 1 | 1 | No complete campaign or published real-device QA; need whole-game E2E and release checks |

Mean: **2.5/5** previous and current. No invented percentage or score gain; test evidence demonstrates scope completion, not commercially validated quality. Each next score increase requires observable acceptance beyond feature count.

## Iteration v0.16 — Creature-specific combat choreography

- **Diagnosis:** attacks for very different species shared practically identical movement and impact effects. This reduced the identity and readability of tactical fights.
- **Design/implementation:** new pure `src/actors/battle-direction.ts` samples nine deterministic signature styles mapped across all twelve species; `src/render.ts` stages anticipation, mirrored lunges, recoil and themed hit silhouettes. Visual presentation never changes combat damage, AI, save format or turn order. Reduced-motion configuration suppresses kinetic effects.
- **Local tests:** TypeScript PASS; **130/130 Node tests PASS**, including five new choreography tests; offline cache audit PASS (26 modules reachable, 27 cache entries); rebuilt standalone. Chromium self-contained HTML smoke: start game, pick starter, dismiss dialogue, initiate direct combat and execute a move on desktop 1180×740 and simulated mobile landscape 844×390; no uncaught JavaScript exceptions. The first generated HTML had a top-level helper collision, corrected before release.
- **Distribution refactor:** stopped committing the giant `play.html`. CI regenerates and tests it before packaging, while GitHub Pages serves 34 modular files (compiled JS, HTML, CSS, assets, PWA and provenance) from `gh-pages`. This avoids giant-file GitHub write limits and stale bundled code. HTML standalone remains attached as an artifact.
- **Limitations:** WebGL2/Android physical GPU benchmarking, independent player testing, complete story, and public-site browser smoke are not verified. Average quality remains **2.5/5**; the animation dimension remains 2/5 until stronger evidence.

## v0.16 verified distribution ledger

- Source branch: `feature/creature-battle-direction-v016`, promoted into `main` at commit `4f2a3c3daa3bf5a204392cda2d8503ccc0caae4c`.
- Quality CI feature: run `39640111719` SUCCESS; CI `main`: run `39640354602` SUCCESS.
- Modular `gh-pages` deployment: commit `9a1d3e17b2dbffe836d1e6812551670f3fb59fc3`; Pages workflow `39640540615` SUCCESS (build/deploy/report).
- `gh-pages/build-info.json` identifies `0.16.0` and exact game-source commit `4f2a3c3daa3bf5a204392cda2d8503ccc0caae4c`.
- Live URL: `https://akumanomi1988.github.io/ASCII_AZUR/`. Public site HTTP/browser smoke: **NOT VERIFIED** because the available external browser/network cannot access `github.io`; deploy success is not proof of full user playability.
- Quality score previous/current **2.5/5 → 2.5/5**. Vertical-slice checks passed locally and via CI; premium completion gate remains unsatisfied.
- Next priority: real Android WebGL2 FPS/instrumentation, combat feel playtesting, full authored campaign.

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

GitHub commit, CI results and Pages deployment are documented in the v0.15 ledger below. The direct public-site smoke and physical Android GPU validation are still open gates; a green CI is not proof of public web health.

1. Improve subject prominence at phone glyph density, and do *real* WebGL2/Android visual and performance testing (target >=30 stable FPS on defined supported hardware).
2. Validate the new battle choreography with players, improve creature-specific sound and readable impact feedback.
3. Deliver a complete authored narrative slice with beginning, region climax, rewards and consequences.
4. Measure accessibility and player experience with external testers.

## Verified distribution ledger — v0.14 historical reference

- Previous v0.14 source: `f07d3db72dc4b1257c6cd9178766e983f037c5df`; Pages build `e53c310c6bce045d9d635d6035463fbdfbd6c47f`, run `39620740026` SUCCESS; source state documentation update `94cceba2f6aa303187cd60ffd1574f1a9f03d906` succeeded. This is **not** a v0.15 publication claim.
- Target site: `https://akumanomi1988.github.io/ASCII_AZUR/`; browser smoke from this environment is restricted.

## v0.15 verified distribution ledger — 2026-10-21

- Source branch: `feature/microscopic-ascii-v015`; promoted source commit: `4125d36579a4f70d0a0b5bf928e62335f2bd60db`.
- Branch CI: `39632636805` SUCCESS. `main` CI: `39632864910` SUCCESS.
- GitHub Pages deployment branch: `gh-pages` commit `568a06c77b1e7f7cacec32d6acd538021da57774`.
- Pages workflow: `39632917162` SUCCESS (build, deployment and status report completed).
- `gh-pages/index.html` references the exact `main/play.html` blob `bde44c7969f1b8517a88ccf903182e815de46111`.
- `gh-pages/build-info.json` indicates v0.15.0 and source commit `4125d36579a4f70d0a0b5bf928e62335f2bd60db`.
- Public URL: `https://akumanomi1988.github.io/ASCII_AZUR/`.
- **Public HTTP/browser smoke: NOT VERIFIED** — current browser/network tool cannot access the Pages hostname. Remote deployment PASS is not evidence of successful user interaction.
- Local release acceptance: 125/125 tests, TypeScript build and offline audit PASS; real Android WebGL2 remains untested.
- Quality scores remain **2.5/5** before and after this shipping iteration, because no new end-user/device evidence justifies an increase.
- Next highest-impact gap: measure and optimize ultradense renderer on a physical Android GPU; follow with authored combat animations and a complete narrative slice.
