import type {GraphicsProfile} from '../render/graphics-profile.js';
/** Reduce GPU fragment load at runtime, independently of persisted art choices. */
export function gpuResolutionFactor(scale:number):number{
 const value=Number.isFinite(scale)?Math.max(1,Math.min(2.4,scale)):1;
 return Math.max(.62,Math.min(1,Math.round(100/Math.sqrt(value))/100));
}
/** Touch microscopic art gets reversible adaptive support unless the user opts out. */
export function adaptiveDefault(touches:number,backend:'gpu'|'fallback',profile:GraphicsProfile):boolean{
 return backend==='fallback'||Number.isFinite(touches)&&touches>0&&
  (profile.renderMode==='glyph-pixel'&&profile.pixelDetail==='fine'||profile.renderMode==='ascii'&&profile.density<=.24);
}
export function initialAdaptiveScale(touches:number,backend:'gpu'|'fallback',profile:GraphicsProfile):number{
 if(backend==='fallback')return 1.6;
 return touches>0&&(profile.renderMode==='glyph-pixel'&&profile.pixelDetail==='fine'||profile.renderMode==='ascii'&&profile.density<=.24)?1.18:1;
}
