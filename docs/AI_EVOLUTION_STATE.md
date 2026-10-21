# ASCII AZUR — Autonomous Evolution State

Last audited: 2026-10-21, v0.15. Source of truth: `akumanomi1988/ASCII_AZUR` / `main` once promoted. One iteration per invocation; do not run scheduled or Work tasks without explicit consent.

## Vision and invariant contracts

Original dark fantasy creature RPG with visually distinctive colored ASCII/Unicode art. Character silhouettes must remain readable, creatures should have meaningful personalities, combat strategic, procedural worlds persistent per save, and mobile controls usable. No Pokémon franchise content. Existing v1 saves remain compatible. Game source in TypeScript; `play.html` is generated, not edited manually. GitHub Pages publishes only a standalone HTML plus provenance.

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
| Technical | 3 | 3 | 125 tests, new software compositor, offline cache; need real-device stress/performance runs |
| Production readiness | 1 | 1 | No complete campaign or published real-device QA; need whole-game E2E and release checks |

Mean: **2.5/5** previous and current. No invented percentage or score gain; test evidence demonstrates scope completion, not commercially validated quality. Each next score increase requires observable acceptance beyond feature count.

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

The release agent must update the GitHub commit ID, CI job outcomes, Pages deployment SHA and live smoke test evidence after release. A green CI is not proof of public web health.

1. Improve subject prominence at phone glyph density, and do *real* WebGL2/Android visual and performance testing (target >=30 stable FPS on defined supported hardware).
2. Introduce authored creature-specific combat poses, readable hit reactions and differentiated original audio.
3. Deliver a complete authored narrative slice with beginning, region climax, rewards and consequences.
4. Measure accessibility and player experience with external testers.

## Verified distribution ledger — v0.14 historical reference

- Previous v0.14 source: `f07d3db72dc4b1257c6cd9178766e983f037c5df`; Pages build `e53c310c6bce045d9d635d6035463fbdfbd6c47f`, run `39620740026` SUCCESS; source state documentation update `94cceba2f6aa303187cd60ffd1574f1a9f03d906` succeeded. This is **not** a v0.15 publication claim.
- Target site: `https://akumanomi1988.github.io/ASCII_AZUR/`; browser smoke from this environment is restricted.

## v0.15 shipping ledger (fill with evidence only after publishing)

- Source commit: pending GitHub Actions verification.
- gh-pages deployment: pending.
- Public site HTTP smoke: unverified.
