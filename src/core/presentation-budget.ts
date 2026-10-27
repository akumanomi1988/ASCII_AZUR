import type {GraphicsProfile} from '../render/graphics-profile.js';
/** Reduce GPU fragment load at runtime, independently of persisted art choices. */
export function gpuResolutionFactor(scale:number):number{
 const value=Number.isFinite(scale)?Math.max(1,Math.min(2.4,scale)):1;
 return Math.max(.62,Math.min(1,Math.round(100/Math.sqrt(value))/100));
}
/** Hardware capability hints are coarse; missing values never mean weak hardware. */
export function limitedMobileHardware(touches:number,cores?:number,memoryGiB?:number):boolean{
 if(!Number.isFinite(touches)||touches<=0)return false;
 const cpu=typeof cores==='number'&&Number.isFinite(cores)&&cores>0?cores:Infinity;
 const ram=typeof memoryGiB==='number'&&Number.isFinite(memoryGiB)&&memoryGiB>0?memoryGiB:Infinity;
 return cpu<=2||ram<=2||(cpu<=4&&ram<=4);
}
/** Reversible low-end mobile protection and original tiny-glyph policy. Persisted opt-out wins. */
export function adaptiveDefault(touches:number,backend:'gpu'|'fallback',profile:GraphicsProfile,cores?:number,memoryGiB?:number):boolean{
 return backend==='fallback'||limitedMobileHardware(touches,cores,memoryGiB)||
  Number.isFinite(touches)&&touches>0&&
  (profile.renderMode==='glyph-pixel'&&profile.pixelDetail==='fine'||profile.renderMode==='ascii'&&profile.density<=.24);
}
export function initialAdaptiveScale(touches:number,backend:'gpu'|'fallback',profile:GraphicsProfile,cores?:number,memoryGiB?:number):number{
 if(backend==='fallback')return 1.6;
 if(limitedMobileHardware(touches,cores,memoryGiB))return 1.4;
 return touches>0&&(profile.renderMode==='glyph-pixel'&&profile.pixelDetail==='fine'||profile.renderMode==='ascii'&&profile.density<=.24)?1.18:1;
}
