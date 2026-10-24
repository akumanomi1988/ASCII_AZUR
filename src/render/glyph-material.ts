/** Shared material-to-glyph thresholds for the Canvas2D fallback.
 * The WebGL shader mirrors these equations to retain a coherent art direction. */
export type MaterialMode='ascii'|'glyph-pixel';
export interface MaterialSample {
  luminance:number;edge:number;localVariation:number;chroma:number;noise:number;
}
export function materialStructure(s:MaterialSample):number{
  return Math.max(0,Math.min(1,s.edge*.88+s.localVariation*2.4+s.chroma*.07));
}
export function materialGlyphIndex(s:MaterialSample,mode:MaterialMode):number{
  const detail=materialStructure(s);
  if(mode==='glyph-pixel'){
    return detail>.78?26:detail>.60?25:detail>.43?24:detail>.26?23:0;
  }
  // Flat fields become real colored negative space, not repeating lines of text.
  // Marks concentrate on boundaries, authored motifs, and distinct silhouettes.
  if(detail<.18)return 0;
  if(detail<.27)return s.noise>.85?2:0;
  return Math.max(3,Math.min(22,Math.floor(detail*15+3+s.noise*1.5)));
}
export function materialColors(r:number,g:number,b:number,mode:MaterialMode,brightness=0,contrast=1):{
  foreground:readonly [number,number,number];background:readonly [number,number,number]
}{
  // Pixel mode lets contiguous cell backgrounds carry solid forms; glyph ink is an accent.
  const bgGain=mode==='ascii'?.76:1.0,fgGain=mode==='ascii'?1.45:1.16;
  const fgLift=mode==='ascii'?24:8;
  const quantize=(n:number)=>mode==='glyph-pixel'?Math.round(n/255*31)*255/31:n;
  r=quantize(r);g=quantize(g);b=quantize(b);
  const clamp=(n:number)=>Math.max(0,Math.min(255,Math.round((n-128)*(1+(contrast-1)*.3)+128)));
  return {
    background:[clamp(r*bgGain+(mode==='ascii'?4:3)+brightness*22),clamp(g*bgGain+(mode==='ascii'?5:4)+brightness*22),clamp(b*bgGain+(mode==='ascii'?6:5)+brightness*22)],
    foreground:[clamp(r*fgGain+fgLift),clamp(g*fgGain+fgLift),clamp(b*fgGain+fgLift)]
  };
}
