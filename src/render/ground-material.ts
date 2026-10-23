import type {ZoneId} from '../world.js';
import {stableVisualVariant,type BiomePalette} from './biome-art.js';

/** Deterministic visual detail. This module never changes terrain or the save format. */
export type GroundSurface='path'|'grass'|'ground'|'stone'|'water';
export type GroundMotifKind='cobble'|'leaf'|'sigil'|'reed'|'shard'|'tuft'|'grain'|'ripple'|'shell'|'frost';
export interface GroundMotif {
  kind:GroundMotifKind;
  x:number;y:number;scale:number;turn:number;shade:number;
}
const PATH_MOTIFS:Readonly<Record<ZoneId,GroundMotifKind>>={
  village:'cobble',forest:'leaf',sanctuary:'sigil',marsh:'reed',spire:'shard',ossuary:'shell',garden:'frost'
};
export function pathMotif(zone:ZoneId):GroundMotifKind{return PATH_MOTIFS[zone];}
export function groundMotifs(zone:ZoneId,surface:GroundSurface,x:number,y:number,seed:number):readonly GroundMotif[]{
  const count=surface==='path'?8:surface==='grass'?4:surface==='water'?2:surface==='stone'?3:3;
  const result:GroundMotif[]=[];
  for(let i=0;i<count;i++){
    const a=stableVisualVariant(x*37+i*19,y*41+i*13,seed+101);
    const b=stableVisualVariant(x*23+i*31,y*17+i*47,seed+307);
    const c=stableVisualVariant(x*11+i*53,y*29+i*23,seed+509);
    const kind:GroundMotifKind=surface==='path'?PATH_MOTIFS[zone]:
      surface==='water'?'ripple':surface==='grass'?'tuft':
      surface==='stone'?(i%3===0?'shard':'grain'):'grain';
    result.push({kind,x:4+Math.floor(a*39),y:4+Math.floor(b*39),
      scale:.6+c*.85,turn:(a+b)*Math.PI,shade:c});
  }
  return result;
}
function stroke(ctx:CanvasRenderingContext2D,x:number,y:number,toX:number,toY:number){
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(toX,toY);ctx.stroke();
}
/** All details are painted into the common source scene, then converted to real glyphs. */
export function paintGroundMotifs(ctx:CanvasRenderingContext2D,zone:ZoneId,surface:GroundSurface,
    tileX:number,tileY:number,seed:number,screenX:number,screenY:number,palette:BiomePalette):void{
  const motifs=groundMotifs(zone,surface,tileX,tileY,seed);
  ctx.save();ctx.translate(screenX,screenY);
  for(const m of motifs){
    ctx.save();ctx.translate(m.x,m.y);ctx.rotate(m.turn);
    const s=m.scale;
    ctx.globalAlpha=.38+m.shade*.40;
    switch(m.kind){
      case 'cobble':
        ctx.fillStyle=m.shade>.5?palette.pathMark:palette.pathRim;
        ctx.fillRect(-4*s,-2*s,8*s,4*s);
        ctx.fillStyle=palette.stoneDark;ctx.fillRect(-4*s,1*s,8*s,1.2*s);
        ctx.fillStyle=palette.stoneLight;ctx.fillRect(-3*s,-2*s,3*s,1*s);
        break;
      case 'leaf':
        ctx.fillStyle=m.shade>.5?palette.grassLight:palette.canopyMid;
        ctx.beginPath();ctx.moveTo(-5*s,0);ctx.quadraticCurveTo(0,-4*s,5*s,0);
        ctx.quadraticCurveTo(0,4*s,-5*s,0);ctx.fill();
        ctx.strokeStyle=palette.trunk;ctx.lineWidth=.9;stroke(ctx,-4*s,0,4*s,0);
        break;
      case 'sigil':
        ctx.strokeStyle=palette.pathMark;ctx.lineWidth=1.5*s;
        ctx.beginPath();ctx.arc(0,0,5*s,.2,2.8);ctx.stroke();
        stroke(ctx,-2*s,-4*s,3*s,3*s);
        ctx.fillStyle=palette.accent;ctx.fillRect(-1*s,-1*s,2*s,2*s);
        break;
      case 'reed':
        ctx.strokeStyle=palette.grassLight;ctx.lineWidth=1.8*s;
        stroke(ctx,-4*s,3*s,-2*s,-5*s);stroke(ctx,1*s,4*s,3*s,-4*s);
        ctx.fillStyle=palette.waterRim;ctx.fillRect(-4*s,3*s,9*s,1.5*s);
        break;
      case 'shard':
        ctx.fillStyle=palette.stoneMid;
        ctx.beginPath();ctx.moveTo(-4*s,3*s);ctx.lineTo(0,-6*s);ctx.lineTo(5*s,4*s);ctx.closePath();ctx.fill();
        ctx.strokeStyle=palette.stoneLight;ctx.lineWidth=1.2*s;stroke(ctx,0,-6*s,1*s,3*s);
        break;
      case 'shell':
        ctx.strokeStyle=palette.pathMark;ctx.lineWidth=1.4*s;
        ctx.beginPath();ctx.arc(0,1*s,5*s,Math.PI,Math.PI*2);ctx.stroke();
        for(let k=-2;k<=2;k++)stroke(ctx,k*1.8*s,1*s,k*2.4*s,-3.5*s);
        break;
      case 'frost':
        ctx.strokeStyle=palette.pathMark;ctx.lineWidth=1.25*s;
        stroke(ctx,-5*s,0,5*s,0);stroke(ctx,0,-5*s,0,5*s);
        stroke(ctx,-3.5*s,-3.5*s,3.5*s,3.5*s);stroke(ctx,-3.5*s,3.5*s,3.5*s,-3.5*s);
        break;
      case 'tuft':
        ctx.strokeStyle=palette.grassLight;ctx.lineWidth=1.6*s;
        stroke(ctx,-4*s,3*s,-5*s,-4*s);stroke(ctx,0,4*s,1*s,-7*s);stroke(ctx,4*s,3*s,7*s,-4*s);
        break;
      case 'ripple':
        ctx.strokeStyle=palette.waterRim;ctx.lineWidth=1.2*s;
        ctx.beginPath();ctx.ellipse(0,0,7*s,2.4*s,0,.2,Math.PI-.2);ctx.stroke();
        break;
      case 'grain':
        ctx.fillStyle=m.shade>.5?palette.soilMark:palette.stoneMid;
        ctx.fillRect(-3*s,-1*s,6*s,2*s);
        break;
    }
    ctx.restore();
  }
  ctx.restore();
}

/** Bounded source-art cache: animated worlds do not repaint thousands of strokes every frame. */
export class GroundMaterialCache {
  private readonly tiles=new Map<string,HTMLCanvasElement>();
  constructor(private readonly capacity=384){}
  get size():number{return this.tiles.size;}
  draw(ctx:CanvasRenderingContext2D,zone:ZoneId,surface:GroundSurface,tileX:number,tileY:number,
      seed:number,screenX:number,screenY:number,palette:BiomePalette,tileSize=48):void{
    const key=zone+'/'+surface+'/'+seed+'/'+tileX+'/'+tileY;
    let canvas=this.tiles.get(key);
    if(!canvas){
      canvas=document.createElement('canvas');canvas.width=tileSize;canvas.height=tileSize;
      const painter=canvas.getContext('2d');
      if(!painter)return;
      paintGroundMotifs(painter,zone,surface,tileX,tileY,seed,0,0,palette);
      this.tiles.set(key,canvas);
      if(this.tiles.size>this.capacity){
        const oldest=this.tiles.keys().next().value;
        if(oldest!==undefined)this.tiles.delete(oldest);
      }
    }else{
      this.tiles.delete(key);this.tiles.set(key,canvas);
    }
    ctx.drawImage(canvas,screenX,screenY);
  }
}
