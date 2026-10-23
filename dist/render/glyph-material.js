export function materialStructure(s) {
    return Math.max(0, Math.min(1, s.edge * .88 + s.localVariation * 2.4 + s.chroma * .07));
}
export function materialGlyphIndex(s, mode) {
    const detail = materialStructure(s);
    if (mode === 'glyph-pixel') {
        return detail > .57 ? 26 : detail > .40 ? 25 : detail > .24 ? 24 : detail > .12 ? 23 : detail > .065 && s.noise > .72 ? 1 : 0;
    }
    // Flat fields become real colored negative space, not repeating lines of text.
    // Marks concentrate on boundaries, authored motifs, and distinct silhouettes.
    if (detail < .085)
        return s.noise > .91 ? 1 : 0;
    if (detail < .16)
        return s.noise > .37 ? 2 : 1;
    return Math.max(3, Math.min(22, Math.floor(detail * 17 + 3 + s.noise * 2)));
}
export function materialColors(r, g, b, mode, brightness = 0, contrast = 1) {
    const bgGain = mode === 'ascii' ? .49 : .72, fgGain = mode === 'ascii' ? 1.77 : 1.47;
    const fgLift = mode === 'ascii' ? 37 : 24;
    const clamp = (n) => Math.max(0, Math.min(255, Math.round((n - 128) * (1 + (contrast - 1) * .3) + 128)));
    return {
        background: [clamp(r * bgGain + 5 + brightness * 22), clamp(g * bgGain + 6 + brightness * 22), clamp(b * bgGain + 8 + brightness * 22)],
        foreground: [clamp(r * fgGain + fgLift), clamp(g * fgGain + fgLift), clamp(b * fgGain + fgLift)]
    };
}
