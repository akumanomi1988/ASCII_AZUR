export function materialStructure(s) {
    return Math.max(0, Math.min(1, s.edge * .88 + s.localVariation * 2.4 + s.chroma * .07));
}
export function materialGlyphIndex(s, mode) {
    const detail = materialStructure(s);
    if (mode === 'glyph-pixel') {
        return detail > .58 ? 26 : detail > .42 ? 25 : detail > .28 ? 24 : detail > .16 ? 23 : 0;
    }
    // Flat fields become real colored negative space, not repeating lines of text.
    // Marks concentrate on boundaries, authored motifs, and distinct silhouettes.
    if (detail < .12)
        return 0;
    if (detail < .21)
        return s.noise > .75 ? 2 : 1;
    return Math.max(3, Math.min(22, Math.floor(detail * 17 + 3 + s.noise * 2)));
}
export function materialColors(r, g, b, mode, brightness = 0, contrast = 1) {
    // Pixel mode lets contiguous cell backgrounds carry solid forms; glyph ink is an accent.
    const bgGain = mode === 'ascii' ? .49 : .86, fgGain = mode === 'ascii' ? 1.77 : 1.27;
    const fgLift = mode === 'ascii' ? 37 : 16;
    const quantize = (n) => mode === 'glyph-pixel' ? Math.round(n / 255 * 31) * 255 / 31 : n;
    r = quantize(r);
    g = quantize(g);
    b = quantize(b);
    const clamp = (n) => Math.max(0, Math.min(255, Math.round((n - 128) * (1 + (contrast - 1) * .3) + 128)));
    return {
        background: [clamp(r * bgGain + 5 + brightness * 22), clamp(g * bgGain + 6 + brightness * 22), clamp(b * bgGain + 8 + brightness * 22)],
        foreground: [clamp(r * fgGain + fgLift), clamp(g * fgGain + fgLift), clamp(b * fgGain + fgLift)]
    };
}
