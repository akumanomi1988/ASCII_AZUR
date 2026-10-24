import test from 'node:test';
import assert from 'node:assert/strict';
import {treePixelCells,treeSilhouetteSignature} from '../dist/render/pixel-scenery.js';
import {BIOME_ART,stableVisualVariant} from '../dist/render/biome-art.js';
import {ZONE_IDS,configureWorld,captureWorldSnapshot} from '../dist/world.js';
import {groundMotifBudget} from '../dist/render/ground-material.js';
import {materialColors,materialGlyphIndex} from '../dist/render/glyph-material.js';
import {DEFAULT_GRAPHICS,readGraphics} from '../dist/render/graphics-profile.js';

test('five hand-authored tree families have distinct and bounded solid-pixel silhouettes',()=>{
 const signatures=new Set();
 for(const family of ['cypress','ash-oak','reliquary','mangrove','obelisk']){
   const pixels=treePixelCells(family,0);
   assert.ok(pixels.length>=55&&pixels.length<330,family+' foliage coverage');
   assert.deepEqual(pixels,treePixelCells(family,0),'animation must not shimmer');
   assert.ok(pixels.every(p=>p.x>=-45&&p.x<=60&&p.y>=-114&&p.y<=-39));
   assert.ok(new Set(pixels.map(p=>p.tone)).size>=3,family+' flattened shading');
   signatures.add(treeSilhouetteSignature(family));
 }
 assert.equal(signatures.size,5);
 assert.equal(treePixelCells('ash-oak',2).length,treePixelCells('ash-oak',0).length);
});

test('every biome retains a unique palette and correct authored object family',()=>{
 const coverage=new Set();
 for(const zone of ZONE_IDS){
   const palette=BIOME_ART[zone];
   const pixels=treePixelCells(palette.silhouette,2);
   assert.ok(pixels.some(p=>p.tone==='h'));
   assert.ok(pixels.some(p=>p.tone==='d'));
   assert.match(palette.canopyLight,/^#[0-9a-f]{6}$/i);
   assert.match(palette.canopyDark,/^#[0-9a-f]{6}$/i);
   coverage.add(palette.path);
 }
 assert.equal(coverage.size,7);
});

test('compositors preserve source color masses and limit glyph ink on flat terrain',()=>{
 const flat={luminance:.3,edge:0,localVariation:0,chroma:0,noise:.95};
 for(const mode of ['ascii','glyph-pixel']){
   assert.equal(materialGlyphIndex(flat,mode),0);
   const rgb=materialColors(95,140,125,mode);
   assert.ok(rgb.background[0]>=0);
   assert.ok(rgb.foreground[1]>rgb.background[1]);
 }
 const pixel=materialColors(95,140,125,'glyph-pixel');
 assert.ok(pixel.background[1]>=140,'pixel background should not crush color mass');
 assert.ok(materialGlyphIndex({...flat,edge:.7,localVariation:.2},'glyph-pixel')>=24);
 assert.ok(materialGlyphIndex({...flat,edge:.7,localVariation:.2},'ascii')>=8);
});

test('new players see pixel art; saved legacy profile remains atmospheric ASCII',()=>{
 assert.equal(DEFAULT_GRAPHICS.renderMode,'glyph-pixel');
 assert.equal(readGraphics(null).renderMode,'glyph-pixel');
 assert.equal(readGraphics({density:.4,contrast:1.1}).renderMode,'ascii');
 assert.equal(readGraphics({renderMode:'ascii'}).renderMode,'ascii');
 assert.equal(readGraphics({renderMode:'glyph-pixel'}).renderMode,'glyph-pixel');
});

test('restyled scenery is a zero-side-effect deterministic projection of the seven world maps',()=>{
 try{
   configureWorld(847);
   const before=captureWorldSnapshot();
   for(const zone of ZONE_IDS){
     const seed=BIOME_ART[zone].id.length*17;
     assert.equal(stableVisualVariant(7,11,seed),stableVisualVariant(7,11,seed));
     for(let x=1;x<=40;x++)for(let y=1;y<=25;y++){
       assert.ok(groundMotifBudget(zone,'path',x,y,seed)<=1);
     }
   }
   assert.deepEqual(captureWorldSnapshot(),before);
 }finally{configureWorld(0);}
});
