export const DEFAULT_GRAPHICS = {
    density: .32, glyphScale: .8, contrast: 1.18, edgeStrength: 1.2, brightness: .02, quality: 1,
    renderMode: 'ascii', pixelDetail: 'balanced'
};
const LIMITS = {
    density: [.18, 1.5], glyphScale: [.5, 1.85], contrast: [.65, 1.8],
    edgeStrength: [.5, 2.4], brightness: [-.25, .25], quality: [.2, 1]
};
export function boundGraphic(key, value) {
    const [min, max] = LIMITS[key];
    if (typeof value !== 'number' || !Number.isFinite(value))
        return DEFAULT_GRAPHICS[key];
    return Math.round(Math.min(max, Math.max(min, value)) * 100) / 100;
}
export function readGraphics(raw) {
    const settings = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const numbers = Object.fromEntries(Object.keys(LIMITS)
        .map(key => [key, boundGraphic(key, settings[key])]));
    return { ...numbers,
        renderMode: settings.renderMode === 'glyph-pixel' ? 'glyph-pixel' : 'ascii',
        pixelDetail: settings.pixelDetail === 'fine' || settings.pixelDetail === 'chunky' ? settings.pixelDetail : 'balanced'
    };
}
/** Pixel mode uses integer-aligned square cells, with no implicit text line-spacing. */
export function glyphCell(base, profile) {
    if (profile.renderMode === 'glyph-pixel') {
        const factor = profile.pixelDetail === 'fine' ? .75 : profile.pixelDetail === 'chunky' ? 1.7 : 1.1;
        const width = Math.max(4, Math.round(base * factor));
        return { width, height: width };
    }
    const width = Math.max(1.25, base * profile.density * profile.glyphScale);
    return { width, height: width * 1.38 };
}
/** Bound expensive Canvas2D compositing without altering WebGL detail settings. */
export function canvasGlyphCell(base, profile, canvasWidth, canvasHeight, maxGlyphs = 100000) {
    const requested = glyphCell(base, profile);
    const aspect = requested.height / requested.width;
    const budgetWidth = Math.sqrt((canvasWidth * canvasHeight) / (maxGlyphs * aspect));
    const width = Math.ceil(Math.max(requested.width, budgetWidth));
    return { width, height: Math.ceil(width * aspect) };
}
export function glyphCount(width, height, cell) {
    return Math.ceil(width / cell.width) * Math.ceil(height / cell.height);
}
