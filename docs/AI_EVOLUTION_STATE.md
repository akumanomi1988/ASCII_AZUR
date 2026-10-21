# ASCII AZUR — Autonomous Evolution State

Last audited: 2026-10-21, v0.14. Source of truth: `akumanomi1988/ASCII_AZUR` / `main` once promoted. One iteration per invocation; do not run scheduled or Work tasks without explicit consent.

## Vision and invariant contracts

Original dark fantasy creature RPG with visually distinctive colored ASCII/Unicode art. Character silhouettes must remain readable, creatures should have meaningful personalities, combat strategic, procedural worlds persistent per save, and mobile controls usable. No Pokémon franchise content. Existing v1 saves remain compatible. Game source in TypeScript; `play.html` is generated, not edited manually. GitHub Pages publishes only a standalone HTML plus provenance.

## Current release scope and premium completion gate

Three regions, 12 species, opening narrative, seeded roguelite expeditions, physical crypt, 34 moves, visible/direct and random encounters, creature evolution and persistent saves. Incomplete campaign/story arc, content, audio mastering, physical Android device QA and external playtesting. Premium-complete gate: all 16 dimensions >=4/5, average >=4.5/5, start-to-end playthrough, 0 high/critical issues, build+CI+verified Pages provenance and validated game flow. This is not close to completion.

## Evidence-based quality scorecard (0–5)

| Domain | v0.13 | v0.14 | Evidence and measurable next acceptance |
|---|---:|---:|---|
| Art direction | 3 | 3 | Four hero directions; need consistent designs/biome art, validated by independent players |
| ASCII rendering | 3 | 3 | Glyph dither CPU/GPU source, glyph settings; need actual Android WebGL2 screenshot+frame timings |
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
| Technical | 3 | 3 | 123 tests, TypeScript build, offline cache; need lower coupling and stress/performance runs |
| Production readiness | 1 | 1 | No complete campaign or published real-device QA; need whole-game E2E and release checks |

Mean: **2.5/5** previous and current. No invented percentage or score gain; test evidence demonstrates scope completion, not commercially validated quality. Each next score increase requires observable acceptance beyond feature count.

## Iteration v0.14 — Art readability vertical slice

- `src/actors/hero-performance.ts`: 4-way deterministic directional pose, blink, gait, cape sway and full reduced-motion freeze.
- `src/render.ts`: independently composed back/front/profile hero views, authored motifs for Cindrel/Cinderwulf and Velaria.
- `src/render/legibility.ts`: sparse, edge-aware glyph field; shader and fallback paths updated to reject uniform-ground noise while preserving bright figures.
- Unit tests: 123 PASS (116 in previous release); 4-view checksums distinct; Chromium desktop, mobile landscape and legacy v0.13 regression checks PASS on Canvas2D. Offline cache audit 25/25 PASS.
- **Not yet verified**: Android hardware GPU performance, user-perceived quality, complete campaign/playthrough.

## Architecture / risk decisions

- Keep gameplay and save state unchanged. Character performance pure functions; drawing remains in Canvas prepass and goes through ASCII compositor.
- Flat-area suppression is deliberately conservative: depends on luminance, edge contrast and per-cell dither; tune from measured gameplay feedback to avoid losing navigational cues.
- `src/main.ts` remains a large unit; refactor incrementally without disturbing working systems.
- Use only GitHub account `akumanomi1988` for writes; branch and Pages integrity checked with expected refs. No force pushes.

## Shipping and next priority

The release agent must update the GitHub commit ID, CI job outcomes, Pages deployment SHA and live smoke test evidence after release. A green CI is not proof of public web health.

1. Improve subject prominence at phone glyph density, and do *real* WebGL2/Android visual and performance testing (target >=30 stable FPS on defined supported hardware).
2. Introduce authored creature-specific combat poses, readable hit reactions and differentiated original audio.
3. Deliver a complete authored narrative slice with beginning, region climax, rewards and consequences.
4. Measure accessibility and player experience with external testers.
