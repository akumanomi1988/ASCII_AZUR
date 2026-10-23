# ASCII AZUR v0.36 — G2 World Art Direction, Material Glyphs & Legibility

## Macroiteration scope

A cohesive environment-art and glyph-presentation overhaul spanning all five regions, both rendering profiles and both supported graphics backends. This is a full player-facing art pipeline change, not a collection of isolated cosmetic tweaks.

### Integrated changes

1. **Material-aware glyph synthesis:** flat surfaces retain colored negative space; glyph marks concentrate on meaningful silhouette boundaries and authored details. Atmospheric ASCII no longer blankets broad terrain with uniform letters. Glyph Pixel Art keeps independent RGB foreground/background and gapless cells. Canvas2D and WebGL2 share the same thresholds and composition philosophy.
2. **Five authored route material families:** village cobblestones, forest leaf litter, sanctuary sigils, marsh reeds, and Crown shards. Ground, grass, stone and water receive separate deterministic motifs, layered over the existing biome silhouettes, lighting and weather.
3. **Navigation and composition:** 1.16× world-only camera framing makes actors and landmarks more readable without changing coordinates, physics, combat or save data. In-world beacons distinguish NPCs and significant relics.
4. **Detail and performance:** balanced Glyph Pixel Art uses smaller square glyph cells for sharper forms. A bounded 384-tile material cache prevents re-drawing the full decorative stroke set every frame.
5. **Offline integrity:** all new modules enter the versioned service-worker asset list; existing v1 save snapshots and graphics settings remain compatible.

### Acceptance gates

- TypeScript build, release dependency audit and all Node regression tests.
- New deterministic material, motif, contrast, glyph-density, pixel-cell and world-persistence tests.
- Chromium desktop acceptance in Atmospheric ASCII and Glyph Pixel Art, each with WebGL2 and Canvas2D, covering five regions and combat (24 screenshots).
- Production deployment, build provenance, public smoke and human screenshot review.

### Deliberately open

This iteration does not claim human-approved premium visual quality. The G2 roadmap gate remains open until actual screenshots are inspected at representative desktop/mobile sizes and independent players confirm silhouette recognition and art readability. Real Android sustained FPS (G4), Android touch validation (U2), accessibility (U3), balancing and release testing remain separate.
