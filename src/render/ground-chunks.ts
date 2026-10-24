import {TILE,WORLD_W,WORLD_H,type ZoneId} from '../world.js';

/** Static ground layers are rasterized in bounded viewport chunks, never once per frame.
 * Dynamic actors, lighting and climate stay outside this cache. */
export const GROUND_CHUNK_TILES=8;
export const GROUND_CHUNK_CAPACITY=24;
export interface GroundChunk {
  readonly column:number;readonly row:number;
  readonly tileX:number;readonly tileY:number;readonly tileWidth:number;readonly tileHeight:number;
  readonly pixelX:number;readonly pixelY:number;readonly width:number;readonly height:number;
}
export function visibleGroundChunks(camX:number,camY:number,width:number,height:number):readonly GroundChunk[]{
  if(![camX,camY,width,height].every(Number.isFinite)||width<=0||height<=0)
    throw Error('Invalid ground viewport');
  const startX=Math.max(0,Math.floor(camX/TILE)-1),startY=Math.max(0,Math.floor(camY/TILE)-1);
  const endX=Math.min(WORLD_W-1,Math.ceil((camX+width)/TILE)+1);
  const endY=Math.min(WORLD_H-1,Math.ceil((camY+height)/TILE)+2);
  if(startX>endX||startY>endY)return [];
  const result:GroundChunk[]=[];
  for(let row=Math.floor(startY/GROUND_CHUNK_TILES);row<=Math.floor(endY/GROUND_CHUNK_TILES);row++){
    for(let column=Math.floor(startX/GROUND_CHUNK_TILES);column<=Math.floor(endX/GROUND_CHUNK_TILES);column++){
      const tileX=column*GROUND_CHUNK_TILES,tileY=row*GROUND_CHUNK_TILES;
      const tileWidth=Math.min(GROUND_CHUNK_TILES,WORLD_W-tileX);
      const tileHeight=Math.min(GROUND_CHUNK_TILES,WORLD_H-tileY);
      result.push({column,row,tileX,tileY,tileWidth,tileHeight,
        pixelX:tileX*TILE,pixelY:tileY*TILE,width:tileWidth*TILE,height:tileHeight*TILE});
    }
  }
  return result;
}
export type GroundTilePainter=(ctx:CanvasRenderingContext2D,x:number,y:number,px:number,py:number)=>void;
export class GroundChunkCache {
  private readonly cache=new Map<string,HTMLCanvasElement>();
  private revision=-1;
  constructor(private readonly capacity=GROUND_CHUNK_CAPACITY){
    if(!Number.isInteger(capacity)||capacity<12)throw Error('Ground cache capacity must cover the viewport');
  }
  get size():number{return this.cache.size;}
  /** The world revision is bumped on configureWorld(), including same-seed snapshot reloads. */
  draw(ctx:CanvasRenderingContext2D,zone:ZoneId,worldRevision:number,
    camX:number,camY:number,width:number,height:number,paint:GroundTilePainter):void{
    if(this.revision!==worldRevision){this.cache.clear();this.revision=worldRevision;}
    const chunks=visibleGroundChunks(camX,camY,width,height);
    ctx.save();ctx.imageSmoothingEnabled=false;
    try{
      for(const chunk of chunks){
        const key=zone+'/'+chunk.column+'/'+chunk.row;
        let canvas=this.cache.get(key);
        if(!canvas){
          canvas=document.createElement('canvas');canvas.width=chunk.width;canvas.height=chunk.height;
          const painter=canvas.getContext('2d');
          if(!painter)throw Error('Canvas2D chunk context unavailable');
          for(let y=chunk.tileY;y<chunk.tileY+chunk.tileHeight;y++){
            for(let x=chunk.tileX;x<chunk.tileX+chunk.tileWidth;x++)
              paint(painter,x,y,(x-chunk.tileX)*TILE,(y-chunk.tileY)*TILE);
          }
        }else this.cache.delete(key);
        this.cache.set(key,canvas);
        ctx.drawImage(canvas,chunk.pixelX-camX,chunk.pixelY-camY);
        while(this.cache.size>this.capacity){
          const oldest=this.cache.keys().next().value;
          if(oldest!==undefined)this.cache.delete(oldest);
        }
      }
    }finally{ctx.restore();}
  }
}
