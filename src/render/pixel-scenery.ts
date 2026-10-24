import {biomePalette,stableVisualVariant,type SilhouetteFamily} from './biome-art.js';
import type {ZoneId} from '../world.js';

/**
 * Authored, pixel-aligned silhouettes. A calm color mass is much more important
 * than thousands of random glyph marks: both rendering profiles sample this art.
 * The five families deliberately have different crowns, negative space and roots.
 */
type Tone='d'|'m'|'l'|'h'|'a';
export interface TreePixel {readonly x:number;readonly y:number;readonly tone:Tone;}
const TREES:Readonly<Record<SilhouetteFamily,readonly string[]>>={
  cypress:[
    '.........h.........',
    '.........l.........',
    '........hll........',
    '........llmd.......',
    '.......hllmmd......',
    '.......llmmmd......',
    '......hlllmmmd.....',
    '.......llmmmd......',
    '.....hllllmmmdd....',
    '......lllmmmdd.....',
    '....hllllmmmmddd...',
    '.....llllmmmddd....',
    '...hlllllmmmmmddd..',
    '....llllmmmmmddd...',
    '......dmmmmddd.....',
    '.......ddddd.......'
  ],
  'ash-oak':[
    '......hllll.........',
    '....hlllllmm..h.....',
    '...hlllllmmmllll....',
    '..hlllllmmmmmmmmdd..',
    '.hllllmmmmmmmmmmmdd.',
    'hllllmmmmmmmddmmmddd',
    'hllllmmmdddddmmmmddd',
    '.hllllmmmmmmmmmmddd.',
    '..lllllmmmmmmmddddd.',
    '....lllmmmmmddddd...',
    '...dmmmmmmmmmddd....',
    '....ddmmmmmmddd.....',
    '......ddmmmmdd......',
    '.......ddmmdd.......'
  ],
  reliquary:[
    '.........h.........',
    '.........l.........',
    '........hll........',
    '.......hllmd.......',
    '.......lllmd.......',
    '....h...llmd...h...',
    '....ll..lllmd..ll...',
    '...hll..lllmd.hll...',
    '...llmd.lllmd.llmd..',
    '..hllmd.llllmdllmd..',
    '..lllmd.llllmdllmdd.',
    '...llmddllllmdlmdd..',
    '...dmmddllllmmdd....',
    '.....dddmmddd.......',
    '.......ddddd........'
  ],
  mangrove:[
    '....hllll.....hllll.',
    '...hllllmd...hlllmm.',
    '..hllllmmmd.hllllmmd',
    '.hllllmmmmddllllmmm.',
    '.llllmmmmmmmmmlllmm.',
    '..lllmmmmddddmmmmmd.',
    '...llllmmmd..ddmmd..',
    '....dmmmmdd...ddmd..',
    '.....dddmd......ddd.',
    '.......dmd..........',
    '.......dmd..........',
    '......ddmd....dd....',
    '.....ddmmmd..dd.....',
    '.....dmmmd....d.....'
  ],
  obelisk:[
    '.........h.........',
    '........hll........',
    '........llmd.......',
    '.......hllmdd......',
    '.......llmddd......',
    '......hllmmddd.....',
    '...h...llmddd...h..',
    '..hll..llmddd..hll.',
    '..llmd.llmddd..lmdd.',
    '...lmd.llmddd..ddd..',
    '....dd.llmddd.dd....',
    '.......llmddd.......',
    '.......llmddd.......',
    '......dllmdddd......',
    '......ddmmdddd......',
    '.......ddddd........'
  ]
};
const TONES:Readonly<Record<Tone,keyof ReturnType<typeof biomePalette>>> ={
  d:'canopyDark',m:'canopyMid',l:'canopyLight',h:'rim',a:'accent'
};
const CELL=5,SPRITE_W=120,SPRITE_H=136;
const spriteCache=new Map<string,HTMLCanvasElement>();

export function treePixelCells(family:SilhouetteFamily,variant=0):readonly TreePixel[]{
  const rows=TREES[family],cells:TreePixel[]=[];
  for(let y=0;y<rows.length;y++){
    const line=rows[y]!;
    for(let x=0;x<line.length;x++){
      const symbol=line[x]!;
      if(symbol==='.')continue;
      if(!(symbol in TONES))throw Error('Unexpected sprite material '+symbol);
      const sparkle=stableVisualVariant(x,y,variant+family.length*43);
      // Rare single-block mineral/flower highlights, never random line texture.
      const tone:Tone=symbol==='l'&&sparkle>.967?'a':symbol as Tone;
      cells.push({x:(x-9)*CELL,y:-114+y*CELL,tone});
    }
  }
  return cells;
}
export function treeSilhouetteSignature(family:SilhouetteFamily):string{
  return TREES[family].join('/');
}
function treeSprite(zone:ZoneId,variant:number):HTMLCanvasElement{
  const key=zone+'/'+variant;
  const cached=spriteCache.get(key);if(cached)return cached;
  const a=biomePalette(zone),canvas=document.createElement('canvas');
  canvas.width=SPRITE_W;canvas.height=SPRITE_H;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Pixel tree canvas unavailable');
  ctx.translate(SPRITE_W/2,SPRITE_H-8);
  // Pixel-carved contact roots remain visible below the crown.
  ctx.fillStyle=a.canopyDark;
  ctx.fillRect(-12,-16,24,11);ctx.fillRect(-22,-7,17,8);ctx.fillRect(5,-7,18,8);
  ctx.fillStyle=a.trunk;
  ctx.fillRect(-9,-61,18,62);
  if(a.silhouette==='mangrove'){
    ctx.fillRect(-21,-30,13,25);ctx.fillRect(8,-33,13,30);
    ctx.fillRect(-29,-4,16,5);ctx.fillRect(13,-4,18,5);
  }
  ctx.fillStyle=a.stoneDark;ctx.fillRect(4,-50,5,43);
  ctx.fillStyle=a.stoneMid;ctx.fillRect(-7,-55,4,40);
  // Authored clusters, no anti-aliased paths or subpixel scrolling.
  for(const pixel of treePixelCells(a.silhouette,variant)){
    ctx.fillStyle=a[TONES[pixel.tone]] as string;
    ctx.fillRect(pixel.x,pixel.y,CELL,CELL);
  }
  ctx.fillStyle=a.rim;ctx.fillRect(-6,-23,3,13);
  if(a.silhouette==='mangrove'){
    ctx.fillStyle=a.waterRim;ctx.fillRect(-31,-1,13,3);ctx.fillRect(18,-1,12,3);
  }
  spriteCache.set(key,canvas);return canvas;
}
/** Reusable source asset; does not depend on renderer profile, animation or save state. */
export function paintPixelTree(ctx:CanvasRenderingContext2D,x:number,y:number,zone:ZoneId,seed:number):void{
  const variant=Math.min(2,Math.floor(stableVisualVariant(7,11,Math.floor(seed*1000000))*3));
  ctx.drawImage(treeSprite(zone,variant),Math.round(x-SPRITE_W/2),Math.round(y-SPRITE_H+8));
}
/** Cozy village homes with roof tiles, recessed entrance, masonry and warm windows. */
export function paintPixelCottage(ctx:CanvasRenderingContext2D,x:number,y:number,variant:number,time:number):void{
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  const trim=variant>.5?'#bb977c':'#9f8b82';
  ctx.fillStyle='#292c39';ctx.fillRect(-31,-40,63,42);
  ctx.fillStyle='#a58c78';ctx.fillRect(-27,-38,55,39);
  ctx.fillStyle='#c7aa8e';ctx.fillRect(-23,-35,47,30);
  // Roof uses stepped pixel stair edges rather than a thin diagonal wireframe.
  ctx.fillStyle='#302d3e';ctx.fillRect(-36,-45,73,7);
  ctx.fillRect(-31,-53,63,8);ctx.fillRect(-25,-61,51,8);
  ctx.fillRect(-19,-69,39,8);ctx.fillRect(-12,-75,25,7);
  ctx.fillStyle='#6b576b';ctx.fillRect(-33,-47,66,5);
  ctx.fillRect(-27,-55,54,5);ctx.fillRect(-21,-63,42,5);ctx.fillRect(-14,-71,28,5);
  ctx.fillStyle='#c6a08d';ctx.fillRect(-25,-60,7,3);ctx.fillRect(9,-54,10,3);
  ctx.fillStyle=trim;ctx.fillRect(-29,-42,7,44);ctx.fillRect(22,-42,7,44);
  ctx.fillStyle='#343039';ctx.fillRect(-10,-27,20,29);
  ctx.fillStyle='#705449';ctx.fillRect(-7,-24,14,25);
  ctx.fillStyle='#ae8569';ctx.fillRect(-5,-22,3,20);
  ctx.fillStyle='#ffdda1';ctx.fillRect(3,-12,3,3);
  for(const xx of [-21,13]){
    ctx.fillStyle='#3d3942';ctx.fillRect(xx,-29,11,13);
    ctx.fillStyle='#ffcc82';ctx.fillRect(xx+2,-27,7,9);
    ctx.fillStyle='#fff2b7';ctx.fillRect(xx+3,-26,3,5);
    ctx.fillStyle='#6c4c48';ctx.fillRect(xx+5,-29,2,13);
  }
  ctx.fillStyle='#6c5b5a';ctx.fillRect(-30,0,62,5);
  ctx.restore();
  // The glow is deliberately weak so the lit window remains visually precise.
  void time;
}
