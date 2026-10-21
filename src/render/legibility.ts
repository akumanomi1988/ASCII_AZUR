/** Sparse tonal field: preserve high-gradient silhouettes while suppressing static visual noise.
 * Mirrored by the fragment shader in render.ts. Quantities are normalized luminance/edge. */
export function glyphVisible(luminance:number,edge:number,noise:number):boolean {
  if(luminance<.20&&edge<.09)return false;
  if(edge<.11&&luminance<.58&&noise>.34)return false;
  return true;
}
