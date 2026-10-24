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
