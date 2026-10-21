/** Continuous tonal halftone. Only perfectly black, unlit pixels may remain empty.
 * Dark midtones are drawn with small, low-coverage glyphs rather than stochastic holes.
 * Synced with the GPU shader in render.ts. */
export function glyphVisible(luminance, edge, _noise) {
    return luminance + edge * .3 >= .012;
}
