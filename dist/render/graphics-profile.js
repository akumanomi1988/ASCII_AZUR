export const DEFAULT_GRAPHICS = { density: .56, glyphScale: 1, contrast: 1.12, edgeStrength: 1.2, brightness: 0, quality: 1 };
const LIMITS = {
    density: [.42, 1.5], glyphScale: [.65, 1.85], contrast: [.65, 1.8], edgeStrength: [.5, 2.4], brightness: [-.25, .25], quality: [.2, 1]
};
export function boundGraphic(key, value) {
    const [min, max] = LIMITS[key];
    if (typeof value !== 'number' || !Number.isFinite(value))
        return DEFAULT_GRAPHICS[key];
    return Math.round(Math.min(max, Math.max(min, value)) * 100) / 100;
}
export function readGraphics(raw) {
    const settings = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    return Object.fromEntries(Object.keys(DEFAULT_GRAPHICS)
        .map(key => [key, boundGraphic(key, settings[key])]));
}
export function glyphCell(base, profile) {
    const width = Math.max(3, base * profile.density * profile.glyphScale);
    return { width, height: width * 1.38 };
}
