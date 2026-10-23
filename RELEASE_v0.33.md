# ASCII AZUR v0.33.0 — The Five Faces of Arken

## Player-facing changes
- Five distinct authored overworld visual identities now share the same deterministic world and save data: Arken cypresses and lantern cottages, Ash Forest twisted trees, Sanctuary reliquaries, Marsh mangroves, and Crown ink obelisks.
- Roads, water, grass, architecture, rock and silhouette highlights use region-specific materials with measurable separation from adjacent ground.
- Source-world glyph rendering remains compatible with both Atmospheric ASCII and Glyph Pixel Art, on WebGL2 and Canvas2D. This is a render-only update; no story, terrain, battle or save-schema changes.
- Rain strokes are reduced and shortened to let object shapes remain legible.

## Verification gate
- New pure-data tests enforce distinct shape families and minimum color separation for paths, structure rims and interactive accents across all five regions.
- Chromium acceptance now captures twenty screenshots: five regions × two rendering modes × two backends; each matrix row is checked for actual distinct captures.
- Existing main release gate remains the authority for TypeScript, Node regressions, offline packaging and GitHub Pages provenance.
- Actual visual signoff, independent player evaluation and minimum Android FPS are separate gates and must not be inferred from screenshots alone.
