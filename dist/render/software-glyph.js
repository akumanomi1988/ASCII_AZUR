/** Rasterized ASCII for Canvas2D-only devices. Draws a single ImageData per frame
 * rather than tens of thousands of drawImage calls. All marks originate in glyph masks. */
export class SoftwareGlyphFrame {
    data;
    packed;
    alpha;
    scaled = new Map();
    width;
    height;
    constructor(width, height, glyphs) {
        this.width = width;
        this.height = height;
        this.data = new ImageData(width, height);
        this.packed = new Uint32Array(this.data.data.buffer);
        const atlas = document.createElement('canvas');
        atlas.width = 96;
        atlas.height = 68;
        const ctx = atlas.getContext('2d', { willReadFrequently: true });
        if (!ctx)
            throw Error('Canvas2D glyph atlas unavailable');
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < glyphs.length; i++)
            ctx.fillText(glyphs[i], i % 8 * 12 + 6, Math.floor(i / 8) * 17 + 9);
        const raw = ctx.getImageData(0, 0, atlas.width, atlas.height).data;
        this.alpha = Array.from(glyphs, (_, i) => {
            const a = new Uint8Array(12 * 17), ox = i % 8 * 12, oy = Math.floor(i / 8) * 17;
            for (let y = 0; y < 17; y++)
                for (let x = 0; x < 12; x++)
                    a[y * 12 + x] = raw[((oy + y) * atlas.width + ox + x) * 4 + 3];
            return a;
        });
    }
    clear() { this.packed.fill(0xff160e08); }
    /** Area-coverage sampling plus a hint of local maximum keeps punctuation at 2px. */
    mask(index, w, h) {
        const key = `${index}/${w}/${h}`;
        let m = this.scaled.get(key);
        if (m)
            return m;
        const alpha = this.alpha[index];
        m = new Uint8Array(w * h);
        if (!alpha)
            return m;
        for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) {
                const x0 = Math.floor(x * 12 / w), x1 = Math.max(x0 + 1, Math.ceil((x + 1) * 12 / w));
                const y0 = Math.floor(y * 17 / h), y1 = Math.max(y0 + 1, Math.ceil((y + 1) * 17 / h));
                let sum = 0, max = 0, n = 0;
                for (let sy = y0; sy < Math.min(17, y1); sy++)
                    for (let sx = x0; sx < Math.min(12, x1); sx++) {
                        const v = alpha[sy * 12 + sx];
                        sum += v;
                        max = Math.max(max, v);
                        n++;
                    }
                m[y * w + x] = Math.round(max * .28 + (sum / n) * .72);
            }
        this.scaled.set(key, m);
        return m;
    }
    put(index, x, y, w, h, r, g, b, opacity) {
        if (index <= 0 || opacity <= 0)
            return;
        const mask = this.mask(index, w, h), buf = this.data.data;
        const R = Math.min(255, r * 1.72 + 18), G = Math.min(255, g * 1.72 + 20), B = Math.min(255, b * 1.72 + 24);
        for (let sy = 0; sy < h && y + sy < this.height; sy++)
            for (let sx = 0; sx < w && x + sx < this.width; sx++) {
                const coverage = mask[sy * w + sx] / 255 * opacity;
                if (coverage < .025)
                    continue;
                const p = ((y + sy) * this.width + x + sx) * 4;
                buf[p] = Math.round(buf[p] * (1 - coverage) + R * coverage);
                buf[p + 1] = Math.round(buf[p + 1] * (1 - coverage) + G * coverage);
                buf[p + 2] = Math.round(buf[p + 2] * (1 - coverage) + B * coverage);
            }
    }
}
