/** Pre-rasterized tinted glyph tiles for the Canvas fallback. GPU pathway unchanged. */
const BASE_PALETTE:readonly [number,number,number][]=[
 [177,198,207], // neutral stone
 [127,204,189], // luminous teal
 [126,185,128], // root green
 [239,165,114], // ember
 [170,149,235], // aether
 [135,199,221], // mist blue
];
export const ATLAS_COLORS=18;
export function classifyGlyphColor(r:number,g:number,b:number):number{
 const max=Math.max(r,g,b),min=Math.min(r,g,b);
 if(max-min<15)return 0;
 if(r>g*1.15&&r>b*1.13)return 3;
 if(g>r*1.13&&g>b*.96)return 2;
 if(b>r*1.22&&b>g*1.08)return 4;
 if(b>r*1.10)return 5;
 return 1;
}
export function glyphPaletteIndex(r:number,g:number,b:number):number{
 const color=classifyGlyphColor(r,g,b);
 const bright=Math.max(r,g,b);
 const shade=bright<65?0:bright<130?1:2;
 return color*3+shade;
}
export class CanvasGlyphCache {
 private readonly atlases:HTMLCanvasElement[]=[];
 constructor(private readonly glyphs:string){
  for(const [r,g,b] of BASE_PALETTE){
   for(const shade of [.61,.93,1.24]){
    const canvas=document.createElement('canvas');canvas.width=96;canvas.height=68;
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('No glyph atlas context');
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 15px monospace';
    ctx.fillStyle=`rgb(${Math.min(255,Math.round(r*shade))},${Math.min(255,Math.round(g*shade))},${Math.min(255,Math.round(b*shade))})`;
    for(let i=0;i<glyphs.length;i++)ctx.fillText(glyphs[i]!,i%8*12+6,Math.floor(i/8)*17+9);
    this.atlases.push(canvas);
   }
  }
 }
 draw(ctx:CanvasRenderingContext2D,glyph:number,x:number,y:number,w:number,h:number,r:number,g:number,b:number,alpha:number){
  if(glyph<=0||alpha<=0)return;
  const atlas=this.atlases[glyphPaletteIndex(r,g,b)];if(!atlas)return;
  ctx.globalAlpha=alpha;
  ctx.drawImage(atlas,glyph%8*12,Math.floor(glyph/8)*17,12,17,x,y,w,h);
 }
}
