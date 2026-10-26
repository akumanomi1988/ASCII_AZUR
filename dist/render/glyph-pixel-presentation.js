const ACCENTS = ['·', ':', '▒', '▓'];
/** Adaptive fallback may lose one detail tier, never the character silhouette. */
export function pixelSourceDivisor(detail, performanceScale) {
    const base = detail === 'fine' ? 2 : detail === 'chunky' ? 4 : 3;
    return Math.min(5, base + (Number.isFinite(performanceScale) && performanceScale >= 2.15 ? 1 : 0));
}
export function pixelAccent(edge, variation) {
    if (!Number.isFinite(edge) || edge < .22 || variation >= .30)
        return -1;
    return edge > .65 ? 3 : edge > .42 ? 2 : edge > .30 ? 1 : 0;
}
function luminance(data, width, x, y) {
    const i = (y * width + x) * 4;
    return ((data[i] ?? 0) * .2126 + (data[i + 1] ?? 0) * .7152 + (data[i + 2] ?? 0) * .0722) / 255;
}
function jitter(x, y) {
    let n = Math.imul(x + 37, 374761393) ^ Math.imul(y + 71, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
/** Source colors occupy every pixel. Sparse glyph ink is reserved for real edges.
 * This avoids allocating and painting an output-sized ImageData on every frame. */
export class GlyphPixelPresentation {
    constructor() {
        this.reduced = document.createElement('canvas');
        const context = this.reduced.getContext('2d', { alpha: false, willReadFrequently: true });
        if (!context)
            throw Error('Canvas2D pixel presentation unavailable');
        this.context = context;
    }
    present(source, target, output, crop, detail, performanceScale) {
        const divisor = pixelSourceDivisor(detail, performanceScale);
        const width = Math.ceil(source.width / divisor), height = Math.ceil(source.height / divisor);
        if (this.reduced.width !== width || this.reduced.height !== height) {
            this.reduced.width = width;
            this.reduced.height = height;
        }
        const context = this.context;
        context.imageSmoothingEnabled = false;
        context.globalAlpha = 1;
        context.drawImage(source, crop.x * source.width, crop.y * source.height, crop.w * source.width, crop.h * source.height, 0, 0, width, height);
        // Decorative glyphs are drawn at semantic color edges, never on flat soil.
        // A four-pixel sampling stride bounds glyph draw calls even in fine mode.
        const pixels = context.getImageData(0, 0, width, height).data;
        context.font = 'bold 5px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        for (let y = 3; y < height - 3; y += 4)
            for (let x = 3; x < width - 3; x += 4) {
                const center = luminance(pixels, width, x, y);
                const edge = Math.max(Math.abs(center - luminance(pixels, width, x + 2, y)), Math.abs(center - luminance(pixels, width, x - 2, y)), Math.abs(center - luminance(pixels, width, x, y + 2)), Math.abs(center - luminance(pixels, width, x, y - 2)));
                const glyph = pixelAccent(edge, jitter(x, y));
                if (glyph < 0)
                    continue;
                const index = (y * width + x) * 4;
                const r = pixels[index] ?? 0, g = pixels[index + 1] ?? 0, b = pixels[index + 2] ?? 0;
                context.fillStyle = 'rgb(' + Math.min(255, Math.round(r * 1.24 + 23)) + ',' +
                    Math.min(255, Math.round(g * 1.24 + 23)) + ',' +
                    Math.min(255, Math.round(b * 1.24 + 23)) + ')';
                context.globalAlpha = .38;
                context.fillText(ACCENTS[glyph], x, y);
            }
        context.globalAlpha = 1;
        output.imageSmoothingEnabled = false;
        output.clearRect(0, 0, target.width, target.height);
        output.drawImage(this.reduced, 0, 0, target.width, target.height);
    }
}
