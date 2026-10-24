# ASCII AZUR — Glyph-Based Visual Direction v3

## Primary principle

Every glyph must improve silhouette, navigation or material recognition. Flat terrain is a color field, not a canvas to fill with random letters. The viewer should first perceive an authored pixel-art RPG and only then notice that each cell is a real glyph with independently colored ink and background.

## Semantic layer priority

1. **Background** — broad calm fields with minimal marks.
2. **Navigable terrain** — clear routes and softly outlined transitions; never a competing high-frequency texture.
3. **Obstacles and structures** — stable perimeter shapes, deep contact shadows and coherent foreground/background colors.
4. **Player, NPCs and creatures** — strongest silhouette contrast, expressive motion and readable faces/equipment.
5. **Interaction and effects** — recognizable glowing beacons, sparse particles, no obstruction of mandatory information.

## Renderer requirements

- Use the same deterministic source geometry for Atmospheric ASCII and Glyph Pixel Art.
- Flat source colors become contiguous background-colored glyph cells without random punctuation.
- Atmospheric mode may use alphanumeric/punctuation glyphs on meaningful edges and authored materials.
- Pixel mode uses Unicode block coverage, five-bit color quantization and seamless cell boundaries. Background color carries the main mass; bright foreground ink is reserved for structure.
- Use a per-tile decoration budget of 0–1 authored motifs. Leave flat soil undecorated. Clear a two-tile-radius square around every landmark. Never allow procedural texture to overwhelm a player silhouette.
- Keep the saved terrain and world generation untouched. All visual randomness is deterministic by zone/tile seed and is cosmetic only.
- Balance visual budget with performance: skip cache allocation for blank tiles and allow adaptive glyph-cell scaling on Canvas2D fallback.

## Acceptance matrix

For each of the seven biomes, inspect the same seed and camera in Atmospheric ASCII and Glyph Pixel Art on WebGL2 and Canvas2D. Compare before/after at desktop and mobile viewport sizes. Review route recognition, player/NPC silhouette, tree/rock/structure separation, interactable contrast, grid seams, temporal shimmer and effect occlusion.

Automated tests prove deterministic budgets and renderer stability; they do not replace independent art-direction acceptance. Real Android FPS/thermal/battery evidence is a separate release gate.

## v0.48 authored pixel world language

- **Silhouette first:** five distinct hand-authored tree masks (cypress, ash-oak, reliquary, mangrove, obelisk) with integer-aligned five-pixel blocks; species, buildings and the playable hero retain independent shapes. Each pixel cluster uses the local biome's deliberate dark/mid/light/rim accents.
- **Sprite cache:** tree masses are rasterized once per zone/variant and drawn as single offscreen sprites, avoiding per-frame hundreds of rectangle operations. Camera movement does not change their variant or generate shimmer.
- **Human-scale architecture:** village cottages gain stepped roofs, masonry, recessed doors and glowing windows. The distant scene reads as buildings before glyph marks.
- **Materials:** continuous grass, water and stone fields eliminate inset rectangles, repeated animated water strokes, and visible grid seams. Decoration frequency is deliberately reduced, while navigable paths keep coherent three-pixel outlines.
- **Presentation:** Glyph Pixel Art is the default for **new** players and preserves source-color masses and negative space. Existing stored profiles and legacy graphic settings retain their atmospheric choice. Atmospheric ASCII also benefits from calmer ink thresholds and brighter colored backgrounds.
- **QA:** all five sprite masks and all seven biome palettes need deterministic tests, four browser rendering configurations, screenshots and original v1 save compatibility. Visual/art director acceptance still requires independent inspection; a green visual smoke test does not automatically close G2.

This update is **visual-only**: no collision, terrain, encounters, save schema or RPG mechanics may be changed.


## v0.48.1 — Ground legibility correction

Microscopic Atmospheric ASCII revealed spurious floating characters caused by tiny isolated source-painted cobbles and pebbles. Roads and bare ground now carry **no incidental micro-motifs**, and their boundary rim is subdued. Grass, water and stone retain fewer deliberate motifs so the world does not become sterile. Authored trees, buildings, characters and world geometry are unchanged. The mode still displays glyph ink for genuine scene boundaries; renderer-level semantic segmentation remains a separate art-direction opportunity.

## v0.49 — Scene landmark atlas and non-verbal microscopic glyph grammar

- All six interactive world landmarks (portal, altar, memory, verdict, rune and chest) now use authored, cached, pixel-aligned masks with a shared six-tone material language. The same geometry is recolored through each of the seven existing biome palettes. Beacons remain legible and all positions, activation rules, collisions and saves stay unchanged.
- Microscopic Atmospheric ASCII now uses abstract punctuation and architectural glyphs for its low/middle ink ramp. Incidental alphanumeric clusters can no longer spell misleading words or numbers across path boundaries. The original four contiguous Unicode block glyphs are untouched for Glyph Pixel Art.
- Navigable path tiles receive deterministic neighbor-aware stepped corner cuts at true isolated corners. Continuous straight corridors have no cuts; the traversability model remains authoritative. There are no random path/soil decorations.
- Acceptance: authored shape/budget/contour/ramp tests, full TypeScript + Node + PWA release audit, all four browser renderer/mode configurations with seven-region screenshots. G2 still requires independent visual signoff; physical Android GPU/Canvas2D FPS and battery are G4.

## v0.50 — Bounded static-ground compositor

- Static soil, paths, water margins and sparse authored ground motifs are rasterized into 8×8-tile Canvas2D chunks only when first visible. Actors, combat, focal beacons, biome climate and soft light stay animated at full frame rate.
- A 24-chunk LRU limits retained RGBA ground pixels to at most about 14.2 MiB (plus browser canvas overhead); scrolling reuses recent chunks. No 46×32-world-sized persistent framebuffer is allocated.
- `getWorldRevision()` invalidates all cached chunks when configuring a world, including same-seed save snapshots; each zone owns separate cache keys. No source tile, collision, navigation, save schema or animation clock is changed.
- Automated coverage checks deterministic viewport coverage, camera reuse, zone/snapshot isolation and strict cache bounds. Browser screenshots on all four render combinations must remain playable; this does not establish real Android G4 acceptance.
