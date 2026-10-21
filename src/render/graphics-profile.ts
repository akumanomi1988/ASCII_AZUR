/** Portable, bounded presentation preferences. Kept outside of the save-game schema. */
export interface GraphicsProfile {
  density:number;
  glyphScale:number;
  contrast:number;
  edgeStrength:number;
  brightness:number;
  quality:number;
}
export const DEFAULT_GRAPHICS:Readonly<GraphicsProfile>={density:.32,glyphScale:.8,contrast:1.18,edgeStrength:1.2,brightness:.02,quality:1};
const LIMITS:Record<keyof GraphicsProfile,readonly [number,number]>={
  density:[.18,1.5],glyphScale:[.5,1.85],contrast:[.65,1.8],edgeStrength:[.5,2.4],brightness:[-.25,.25],quality:[.2,1]
};
export function boundGraphic<K extends keyof GraphicsProfile>(key:K,value:unknown):number{
  const [min,max]=LIMITS[key];
  if(typeof value!=='number'||!Number.isFinite(value))return DEFAULT_GRAPHICS[key];
  return Math.round(Math.min(max,Math.max(min,value))*100)/100;
}
export function readGraphics(raw:unknown):GraphicsProfile{
  const settings=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Partial<GraphicsProfile>:{};
  return Object.fromEntries((Object.keys(DEFAULT_GRAPHICS) as (keyof GraphicsProfile)[])
    .map(key=>[key,boundGraphic(key,settings[key])])) as unknown as GraphicsProfile;
}
export function glyphCell(base:number,profile:GraphicsProfile):{width:number;height:number}{
  const width=Math.max(1.25,base*profile.density*profile.glyphScale);
  return{width,height:width*1.38};
}

/** A Canvas2D device draws glyphs individually, unlike the shader which shades a full quad.
 * Never silently cap WebGL; bound only the fallback work per frame to a tested glyph budget. */
export function canvasGlyphCell(base:number,profile:GraphicsProfile,canvasWidth:number,canvasHeight:number,maxGlyphs=100000):{width:number;height:number}{
  const requested=glyphCell(base,profile);
  const budgetWidth=Math.sqrt((canvasWidth*canvasHeight)/(maxGlyphs*1.38));
  const width=Math.ceil(Math.max(requested.width,budgetWidth));
  return {width,height:Math.ceil(width*1.38)};
}

/** The number of independently sampled cells — useful for tuning density without guessing. */
export function glyphCount(width:number,height:number,cell:{width:number;height:number}):number{
  return Math.ceil(width/cell.width)*Math.ceil(height/cell.height);
}
