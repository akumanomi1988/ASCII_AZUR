/** Allocate the 960x540 authored scene storage once; refresh content without reallocating GPU storage.
 * Output viewport size and devicePixelRatio do not affect this texture's dimensions. */
export function allocateSceneTexture(gl, width, height) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0)
        throw Error('Invalid scene texture dimensions');
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
}
export function updateSceneTexture(gl, source) {
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
}
