import test from 'node:test';
import assert from 'node:assert/strict';
import {materialGlyphIndex,materialColors,materialStructure} from '../dist/render/glyph-material.js';
import {groundMotifs,pathMotif,GroundMaterialCache} from '../dist/render/ground-material.js';
import {BIOME_ART} from '../dist/render/biome-art.js';
import {ZONE_IDS,configureWorld,captureWorldSnapshot} from '../dist/world.js';
import {glyphCell,readGraphics} from '../dist/render/graphics-profile.js';

test('seven authored route materials remain distinct and deterministic',()=>{
 const families=new Set();
 for(const zone of ZONE_IDS){
   families.add(pathMotif(zone));
   const first=groundMotifs(zone,'path',18,27,412);
   assert.equal(first.length,8);
   assert.deepEqual(first,groundMotifs(zone,'path',18,27,412));
   assert.ok(first.every(m=>m.x>=4&&m.x<=42&&m.y>=4&&m.y<=42&&m.scale>=.6&&m.scale<=1.45));
   assert.ok(BIOME_ART[zone].path);
 }
 assert.equal(families.size,7);
});

test('material detail is concentrated on authored boundaries, not flat terrain',()=>{
 const flat={luminance:.4,edge:0,localVariation:0,chroma:.1,noise:.2};
 const edge={...flat,edge:.7,localVariation:.22};
 assert.equal(materialGlyphIndex(flat,'ascii'),0);
 assert.equal(materialGlyphIndex(flat,'glyph-pixel'),0);
 assert.ok(materialStructure(edge)>materialStructure(flat));
 assert.ok(materialGlyphIndex(edge,'ascii')>=8);
 assert.ok(materialGlyphIndex(edge,'glyph-pixel')>=24);
 assert.equal(materialGlyphIndex({...flat,noise:.95},'ascii'),1);
});

test('both modes preserve separate colored foreground and background, with contrast controls',()=>{
 for(const mode of ['ascii','glyph-pixel']){
   const c=materialColors(130,100,70,mode,.02,1.18);
   assert.equal(c.background.length,3);
   assert.equal(c.foreground.length,3);
   assert.ok(c.foreground[0]>c.background[0]);
   assert.ok(c.foreground[1]>c.background[1]);
   assert.ok(c.foreground[2]>c.background[2]);
   assert.notDeepEqual(materialColors(130,100,70,mode,.02,.8),c);
 }
});

test('finer balanced pixel profile increases character definition without changing game state',()=>{
 const fine=glyphCell(10,readGraphics({renderMode:'glyph-pixel',pixelDetail:'fine'}));
 const balanced=glyphCell(10,readGraphics({renderMode:'glyph-pixel',pixelDetail:'balanced'}));
 const chunky=glyphCell(10,readGraphics({renderMode:'glyph-pixel',pixelDetail:'chunky'}));
 assert.ok(fine.width<balanced.width&&balanced.width<chunky.width);
 assert.ok(balanced.width<=11);
 configureWorld(412);
 const before=captureWorldSnapshot();
 for(const zone of ZONE_IDS)for(const surface of ['path','ground','grass','stone','water']){
   groundMotifs(zone,surface,14,9,412);
 }
 assert.deepEqual(captureWorldSnapshot(),before);
 configureWorld(0);
});

test('material cache remains bounded and does not need a DOM before first draw',()=>{
 const cache=new GroundMaterialCache(8);
 assert.equal(cache.size,0);
});
