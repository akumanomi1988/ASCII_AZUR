import {biomePalette,type BiomePalette} from './biome-art.js';
import type {ZoneId} from '../world.js';

/** Pixel-carved interactive scenery; gameplay collision and POI identity stay in world.ts. */
export type LandmarkSpriteKind='altar'|'portal'|'memory'|'verdict'|'rune'|'chest';
type Ink='d'|'m'|'l'|'r'|'a'|'v';
export interface LandmarkPixel {readonly x:number;readonly y:number;readonly ink:Ink;}
const PIXEL=3;
const PIXELS:Readonly<Record<LandmarkSpriteKind,readonly string[]>>={
  portal:[
    '.........r.........',
    '.......rrlrr.......',
    '......rlllllr......',
    '.....rllmmmllr.....',
    '....rllmvvvmllr....',
    '...rllmvvvvvmllr...',
    '...rlmvvvvvvvmlr...',
    '...rlmvvvvvvvmlr...',
    '...rlmvvvvvvvmlr...',
    '...rlmvvvvvvvmlr...',
    '...rlmvvvvvvvmlr...',
    '...rlmvvvvvvvmlr...',
    '...rlmvvvvvvvmlr...',
    '...rlmvvvvvvvmlr...',
    '...rlmvvvvvvvmlr...',
    '..drllmvvvvvmllrd..',
    '..ddrllmmmmmlrdd..',
    '..dddrrlllllrrddd..',
    '.dddddmmmmmmmddddd.',
    'dddddddmmmmmddddddd'
  ],
  altar:[
    '........a........',
    '.......aaa.......',
    '.......rar.......',
    '......raaar......',
    '.......ara.......',
    '......rlllr......',
    '.....dmllmd.....',
    '....ddmlllmdd....',
    '....dmmmmmmmd....',
    '...ddrlllllrdd...',
    '...dmmmmmmmmmd...',
    '..ddmmvvvvmmdd..',
    '..dmmlvvvvlmmd..',
    '.dddmmmmmmmdddd.',
    'dddddllllldddddd',
    'ddddddddddddddddd'
  ],
  memory:[
    '........r........',
    '.......rlr.......',
    '......rlllr......',
    '.....rllvllr.....',
    '.....rlavalr.....',
    '.....rlavar......',
    '.....rlvvvlr.....',
    '.....rlavalr.....',
    '.....rlvvvlr.....',
    '.....rlavalr.....',
    '.....rlvvvlr.....',
    '.....rllmllr.....',
    '....ddmmmmmmdd...',
    '....dddllllddd...',
    '...ddddmmmmddd...',
    '..ddddddddddddd..'
  ],
  verdict:[
    '........a........',
    '.......rar.......',
    '.......rlr.......',
    '...r...rlr...r...',
    '..rlr..rlr..rlr..',
    '.rlllr.rlr.rlllr.',
    'rlllllrrlrrlllllr',
    'ddmddddrlddddmdd',
    '.dmmd..rlr..dmmd.',
    '.dlld..rlr..dlld.',
    '..dd...rlr...dd..',
    '.......rlr.......',
    '......rlllr......',
    '.....rlllllr.....',
    '....ddmmmmmdd....',
    '...dddlllllddd...',
    '..ddddddddddddd..'
  ],
  rune:[
    '.....r.....',
    '....rlr....',
    '...rlllr...',
    '...rlvlr...',
    '...rlalr...',
    '...rlvlr...',
    '...ralar...',
    '...rlvlr...',
    '...rlalr...',
    '...rlvlr...',
    '...rlalr...',
    '...rlvlr...',
    '...rlalr...',
    '..dmlllmd..',
    '..dddmmddd..',
    '.dddmllmddd.',
    '.dddddddddd.',
    'ddddddddddd'
  ],
  chest:[
    '....ddddddddd....',
    '...dmmmmmmmmmd...',
    '..dmmllllllllmd..',
    '.dmmllrrrrrllmmd.',
    'ddddrrrrarrrddddd',
    'dmmmmmmmmmmmmmmmd',
    'dmlmmmmmmmmmmmlmd',
    'dmlmmmmammmmmmlmd',
    'dmlmmmmammmmmmlmd',
    'dmlmmmmammmmmmlmd',
    'ddllllllllllllldd',
    '.ddddddddddddddd.'
  ]
};
const INK_COLOR:Readonly<Record<Ink,keyof BiomePalette>>={
  d:'stoneDark',m:'stoneMid',l:'stoneLight',r:'rim',a:'accent',v:'canopyDark'
};
const cache=new Map<string,HTMLCanvasElement>();

export function landmarkSilhouetteSignature(kind:LandmarkSpriteKind):string {
  return PIXELS[kind].join('/');
}
export function landmarkPixelCells(kind:LandmarkSpriteKind):readonly LandmarkPixel[]{
  const rows=PIXELS[kind];
  const width=Math.max(...rows.map(row=>row.length));
  const cells:LandmarkPixel[]=[];
  for(let y=0;y<rows.length;y++)for(let x=0;x<rows[y]!.length;x++){
    const char=rows[y]![x]!;
    if(char==='.')continue;
    if(!(char in INK_COLOR))throw Error('Unrecognized landmark pixel '+char);
    cells.push({x:x+Math.floor((width-rows[y]!.length)/2),y,ink:char as Ink});
  }
  return cells;
}
function landmarkCanvas(zone:ZoneId,kind:LandmarkSpriteKind):HTMLCanvasElement {
  const key=zone+'/'+kind,previous=cache.get(key);
  if(previous)return previous;
  const rows=PIXELS[kind],width=Math.max(...rows.map(row=>row.length));
  const canvas=document.createElement('canvas');
  canvas.width=(width+2)*PIXEL;canvas.height=(rows.length+2)*PIXEL;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('Landmark canvas unavailable');
  const palette=biomePalette(zone);
  for(const cell of landmarkPixelCells(kind)){
    ctx.fillStyle=palette[INK_COLOR[cell.ink]] as string;
    ctx.fillRect((cell.x+1)*PIXEL,(cell.y+1)*PIXEL,PIXEL,PIXEL);
  }
  cache.set(key,canvas);
  return canvas;
}
/** Source-pixel aligned and cached; no shimmering glyph decoration or game-state writes. */
export function paintPixelLandmark(ctx:CanvasRenderingContext2D,x:number,y:number,
  zone:ZoneId,kind:LandmarkSpriteKind):void{
  const sprite=landmarkCanvas(zone,kind);
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(sprite,Math.round(x-sprite.width/2),Math.round(y-sprite.height+3));
  ctx.restore();
}
