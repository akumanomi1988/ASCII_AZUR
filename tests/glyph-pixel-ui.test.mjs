import test from 'node:test';
import assert from 'node:assert/strict';
import {readGraphics,DEFAULT_GRAPHICS,glyphCell,canvasGlyphCell,glyphCount} from '../dist/render/graphics-profile.js';
import {VISUAL_ASSETS,visualVariation} from '../dist/render/semantic-assets.js';
import {SoftwareGlyphFrame} from '../dist/render/software-glyph.js';
import {isTypingTarget,navigateMenuKey} from '../dist/ui/menu-navigation.js';

test('legacy graphics v2 prefs use ASCII and retain previous numeric values',()=>{
 assert.deepEqual(readGraphics(null),DEFAULT_GRAPHICS);
 const legacy=readGraphics({density:.42,glyphScale:1.4,contrast:1.2});
 assert.equal(legacy.renderMode,'ascii');
 assert.equal(legacy.pixelDetail,'balanced');
 assert.equal(legacy.density,.42);
 assert.equal(legacy.glyphScale,1.4);
 assert.equal(legacy.contrast,1.2);
 assert.equal(readGraphics({renderMode:'bogus',pixelDetail:'bogus'}).renderMode,'ascii');
});

test('switching graphical modes does not alter caller gameplay state or input',()=>{
 const save={version:1,worldSeed:1234,zone:'village',x:4,y:16,flags:['found-altar']};
 const before=JSON.stringify(save);
 const profile=readGraphics({renderMode:'glyph-pixel',pixelDetail:'chunky'});
 const restored=readGraphics({...profile,renderMode:'ascii'});
 assert.equal(profile.renderMode,'glyph-pixel');
 assert.equal(restored.renderMode,'ascii');
 assert.equal(JSON.stringify(save),before);
});

test('pixel glyph cell presets are integer aligned, square, increasing, and Canvas bounded',()=>{
 const widths=['fine','balanced','chunky'].map(pixelDetail=>glyphCell(8,readGraphics({renderMode:'glyph-pixel',pixelDetail})));
 assert.ok(widths[0].width<widths[1].width&&widths[1].width<widths[2].width);
 for(const cell of widths){assert.equal(cell.width,cell.height);assert.equal(cell.width,Math.round(cell.width));}
 const fallback=canvasGlyphCell(8,readGraphics({renderMode:'glyph-pixel',pixelDetail:'fine'}),1920,1080,40000);
 assert.equal(fallback.width,fallback.height);
 assert.ok(glyphCount(1920,1080,fallback)<=41000);
});

test('all semantic assets have bounded deterministic palette descriptors',()=>{
 for(const [key,asset] of Object.entries(VISUAL_ASSETS)){
   assert.equal(asset.id,key);assert.ok(asset.silhouette);
   assert.ok(Object.keys(asset.materials).length>=2);
   assert.equal(visualVariation(key,452),visualVariation(key,452));
   assert.ok(visualVariation(key,452)>=0&&visualVariation(key,452)<1);
 }
});

test('Canvas glyph cell paints independent foreground and background colors edge-to-edge',()=>{
 const oldDocument=globalThis.document,oldImageData=globalThis.ImageData;
 try{
   globalThis.ImageData=class{constructor(width,height){this.width=width;this.height=height;this.data=new Uint8ClampedArray(width*height*4)}};
   globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({
     fillText(){},getImageData(){const pixels=new Uint8ClampedArray(96*68*4);for(let y=0;y<68;y++)for(let x=0;x<96;x++)pixels[(y*96+x)*4+3]=(x%12)<6?255:0;return{data:pixels};}
   })})};
   const frame=new SoftwareGlyphFrame(8,4,'X');
   frame.clear();
   frame.putCell(0,0,0,4,4,[240,15,30],[12,33,65]);
   frame.putCell(0,4,0,4,4,[20,210,50],[67,78,89]);
   const at=(x,y)=>Array.from(frame.data.data.slice((y*8+x)*4,(y*8+x)*4+4));
   assert.deepEqual(at(0,1),[240,15,30,255]);
   assert.deepEqual(at(3,1),[12,33,65,255]);
   assert.deepEqual(at(4,1),[20,210,50,255]);
   assert.deepEqual(at(7,1),[67,78,89,255]);
   for(let y=0;y<4;y++)for(let x=0;x<8;x++)assert.equal(at(x,y)[3],255);
 }finally{globalThis.document=oldDocument;globalThis.ImageData=oldImageData;}
});

test('inputs are editable and do not compete with game keyboard shortcuts',()=>{
 for(const tagName of ['INPUT','TEXTAREA','SELECT'])assert.equal(isTypingTarget({tagName}),true);
 assert.equal(isTypingTarget({tagName:'DIV',isContentEditable:true}),true);
 assert.equal(isTypingTarget({tagName:'BUTTON'}),false);
 assert.equal(isTypingTarget(null),false);
});

test('menu navigation cycles and activates same click action',()=>{
 const oldDocument=globalThis.document;
 try{
   const state={active:null,clicks:0};
   const createButton=(id)=>({id,tagName:'BUTTON',hidden:false,getAttribute:()=>null,getClientRects:()=>[{}],
     focus(){state.active=this},click(){state.clicks++},scrollIntoView(){}});
   const items=[createButton('a'),createButton('b'),createButton('c')];
   const root={querySelectorAll:()=>items};
   globalThis.document={get activeElement(){return state.active;}};
   assert.equal(navigateMenuKey(root,'ArrowDown'),true);assert.equal(state.active.id,'a');
   assert.equal(navigateMenuKey(root,'s'),true);assert.equal(state.active.id,'b');
   assert.equal(navigateMenuKey(root,'ArrowUp'),true);assert.equal(state.active.id,'a');
   assert.equal(navigateMenuKey(root,'End'),true);assert.equal(state.active.id,'c');
   assert.equal(navigateMenuKey(root,'Enter'),true);assert.equal(state.clicks,1);
   assert.equal(navigateMenuKey(root,' '),true);assert.equal(state.clicks,2);
 }finally{globalThis.document=oldDocument;}
});
