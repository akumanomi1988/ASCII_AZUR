import test from 'node:test';
import assert from 'node:assert/strict';
import {materialGlyphIndex,materialColors,materialStructure} from '../dist/render/glyph-material.js';
import {groundMotifs,pathMotif,GroundMaterialCache,groundMotifBudget,isFocalGroundTile} from '../dist/render/ground-material.js';
import {BIOME_ART} from '../dist/render/biome-art.js';
import {ZONE_IDS,ZONES,configureWorld,captureWorldSnapshot} from '../dist/world.js';
import {glyphCell,readGraphics} from '../dist/render/graphics-profile.js';

test('seven authored route materials remain distinct and deterministic',()=>{
 const families=new Set();
 for(const zone of ZONE_IDS){
   families.add(pathMotif(zone));
   const first=groundMotifs(zone,'path',18,27,412);
   assert.ok(first.length<=1);
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
 assert.equal(materialGlyphIndex({...flat,noise:.95},'ascii'),0);
 assert.equal(materialGlyphIndex({...flat,noise:.99},'glyph-pixel'),0);
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

test('ground-decoration budget preserves clear routes and authored focal aprons across seven biomes',()=>{
 try{
  configureWorld(412);
  const snapshot=captureWorldSnapshot();
  for(const zone of ZONE_IDS){
   let decorated=0;
   for(let y=3;y<29;y++)for(let x=3;x<43;x++){
    const count=groundMotifBudget(zone,'path',x,y,ZONES[zone].seed);
    assert.ok(count===0||count===1);
    decorated+=count;
    assert.equal(groundMotifs(zone,'path',x,y,ZONES[zone].seed).length,count);
    assert.equal(groundMotifs(zone,'ground',x,y,412).length,0);
   }
   assert.equal(decorated,0,zone+' paths must not contain isolated glyph-like debris');
   let natural=0;
   for(let y=3;y<29;y++)for(let x=3;x<43;x++)natural+=groundMotifBudget(zone,'grass',x,y,ZONES[zone].seed);
   assert.ok(natural>30&&natural<220,zone+' greenery should retain sparse authored motifs: '+natural);
   for(const landmark of ZONES[zone].landmarks){
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
     const x=landmark.x+dx,y=landmark.y+dy;
     assert.equal(isFocalGroundTile(zone,x,y),true,zone+' missed focal apron');
     for(const surface of ['path','ground','grass','stone','water'])
      assert.equal(groundMotifs(zone,surface,x,y,412).length,0,zone+' noisy point of interest');
    }
   }
  }
  assert.deepEqual(captureWorldSnapshot(),snapshot,'art decoration changed the frozen procedural world');
 }finally{configureWorld(0);}
});