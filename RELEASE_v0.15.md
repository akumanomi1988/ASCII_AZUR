# ASCII AZUR v0.15 — Microscopic glyph rendering

## Player-facing change

- Reverses the v0.14 sparse-field aesthetic. Previously, dark/flat scene cells were deleted at random, leaving empty areas. Now surfaces are continuously represented by tonal ASCII glyphs; only truly black unlit cells may be empty.
- New dense GPU default: density 0.32, glyph scale 0.8 (previously 0.56 / 1.0). At 1280×720 output and 10px base, mathematical grid grows from about 13,100 to about 100,000 glyph positions before screen scaling. Actual count varies with viewport and DPR.
- **Microscópica · máxima** option: density 0.18, scale 0.5, minimum glyph cell 1.25px in WebGL2. At 1280×720, >300,000 sample cells are possible if the canvas and device allow it. This is a grid count, not a measured frame-rate claim.
- Density options go from Microscópica through Ultra fina to Alto rendimiento, preserving contrast, edges, brightness and color controls; game saves remain v1-compatible.
- Graphics settings use a new `ascii-azur-graphics-v2` preference key so old sparse-format appearance cannot override the restored default. Other preferences and game saves are untouched.
- GUI displays estimated real grid size, effective glyph width and whether fallback cap is applied.
- Canvas2D uses `SoftwareGlyphFrame`, a single ImageData composition instead of thousands of per-frame drawImage calls. Canvas2D performance budget is separate from the shader to prevent hangs on unsupported GPUs.
- Standalone build includes the new renderer and offline cache list is complete.

## Acceptance

- TypeScript compile, all automated tests and offline audit: PASS (125 tests).
- Browser functional test: full game started, starter chosen, graphics menu operated, selected density persisted in DOM, no page JavaScript exceptions. Headless Chromium Canvas2D; WebGL2 unsupported in test environment.
- Headless fallback perf observation, initial screen: roughly 5 FPS with the prior per-glyph compositor vs roughly 22 FPS after buffer composition. Not a controlled benchmark, no Android hardware certification.
- Pending: Android WebGL2 device, external player preference study, real website HTTP smoke after GitHub Actions deployment.

## Rollback and state

- v0.14 source remains in Git history; v1 game saves unchanged. `main` is stable and `gh-pages` contains the exact generated standalone source blob, with `build-info.json` provenance.
- Quality remains 2.5/5 overall until verified player and hardware evidence improves subjective dimensions.
