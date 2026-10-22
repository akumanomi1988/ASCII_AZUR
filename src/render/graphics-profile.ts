/** Presentation-only graphics preferences, backward compatible with v2 numeric profiles. */
export type GraphicsMode='ascii'|'glyph-pixel';
export type PixelDetail='fine'|'balanced'|'chunky';
export interface NumericGraphics {
  density:number;glyphScale:number;contrast:number;edgeStrength:number;brightness:number;quality:number;
}
export interface GraphicsProfile extends NumericGraphics {
  renderMode:GraphicsMode;
  pixelDetail:PixelDetail;
}
export const DEFAULT_GRAPHICS:Readonly<GraphicsProfile>={
  density:.32,glyphScale:.8,contrast:1.18,edgeStrength:1.2,brightness:.02,quality:1,
  renderMode:'ascii',pixelDetail:'balanced'
};
const LIMITS:Record<keyof NumericGraphics,readonly [number,number]>={
 density:[.18,1.5],glyphScale:[.5,1.85],contrast:[.65,1.8],
 edgeStrength:[.5,2.4],brightness:[-.25,.25],quality:[.2,1]
};
export function boundGraphic<K extends keyof NumericGraphics>(key:K,value:unknown):number{
 const [min,max]=LIMITS[key];
 if(typeof value!=='number'||!Number.isFinite(value))return DEFAULT_GRAPHICS[key];
 return Math.round(Math.min(max,Math.max(min,value))*100)/100;
}
export function readGraphics(raw:unknown):GraphicsProfile{
 const settings=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Partial<GraphicsProfile>:{};
 const numbers=Object.fromEntries((Object.keys(LIMITS) as (keyof NumericGraphics)[])
    .map(key=>[key,boundGraphic(key,settings[key])])) as unknown as NumericGraphics;
 return {...numbers,
   renderMode:settings.renderMode==='glyph-pixel'?'glyph-pixel':'ascii',
   pixelDetail:settings.pixelDetail==='fine'||settings.pixelDetail==='chunky'?settings.pixelDetail:'balanced'
 };
}
/** Pixel mode uses integer-aligned square cells, with no implicit text line-spacing. */
export function glyphCell(base:number,profile:GraphicsProfile):{width:number;height:number}{
 if(profile.renderMode==='glyph-pixel'){
   const factor=profile.pixelDetail==='fine'?.82:profile.pixelDetail==='chunky'?2:1.3;
   const width=Math.max(4,Math.round(base*factor));
   return {width,height:width};
 }
 const width=Math.max(1.25,base*profile.density*profile.glyphScale);
 return {width,height:width*1.38};
}
/** Bound expensive Canvas2D compositing without altering WebGL detail settings. */
export function canvasGlyphCell(base:number,profile:GraphicsProfile,canvasWidth:number,canvasHeight:number,maxGlyphs=100000):{width:number;height:number}{
 const requested=glyphCell(base,profile);
 const aspect=requested.height/requested.width;
 const budgetWidth=Math.sqrt((canvasWidth*canvasHeight)/(maxGlyphs*aspect));
 const width=Math.ceil(Math.max(requested.width,budgetWidth));
 return {width,height:Math.ceil(width*aspect)};
}
export function glyphCount(width:number,height:number,cell:{width:number;height:number}):number{
 return Math.ceil(width/cell.width)*Math.ceil(height/cell.height);
}
