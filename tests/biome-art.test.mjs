import test from 'node:test';
import assert from 'node:assert/strict';
import {BIOME_ART,biomePalette,stableVisualVariant,contrastRatio} from '../dist/render/biome-art.js';
import {ZONE_IDS,configureWorld,captureWorldSnapshot,terrain,WORLD_W,WORLD_H} from '../dist/world.js';

test('all five regions have a unique readable visual language',()=>{
 const families=new Set(),palettes=new Set();
 for(const id of ZONE_IDS){
  const p=biomePalette(id);
  assert.equal(p.id,id);
  families.add(p.silhouette);
  palettes.add(p.path);
  for(const color of [...p.soil,p.soilMark,p.path,p.pathRim,p.pathMark,p.water,p.waterRim,p.grass,p.grassLight,p.trunk,p.canopyDark,p.canopyMid,p.canopyLight,p.rim,p.stoneDark,p.stoneMid,p.stoneLight,p.accent,p.atmosphere]){
   assert.match(color,/^#[0-9a-f]{6}$/i,id+' malformed material');
  }
  assert.ok(contrastRatio(p.path,p.soil[0])>=2.1,id+' route blends into terrain');
  assert.ok(contrastRatio(p.pathRim,p.soil[0])>=3.0,id+' route rim illegible');
  assert.ok(contrastRatio(p.rim,p.canopyDark)>=3.0,id+' silhouette highlight illegible');
  assert.ok(contrastRatio(p.stoneLight,p.stoneDark)>=3.0,id+' architecture has no depth');
  assert.ok(contrastRatio(p.accent,p.soil[0])>=4.0,id+' interactive accents are invisible');
 }
 assert.equal(families.size,5);
 assert.equal(palettes.size,5);
 assert.equal(Object.keys(BIOME_ART).length,ZONE_IDS.length);
});

test('visual variants are deterministic and never mutate a procedural world snapshot',()=>{
 const points=[[0,0],[11,7],[43,29],[20,16]];
 for(const seed of [0,1,91,0xffffffff]){
  configureWorld(seed);
  const before=captureWorldSnapshot();
  const tiles=ZONE_IDS.map(zone=>Array.from({length:WORLD_W*WORLD_H},(_,i)=>terrain(zone,i%WORLD_W,Math.floor(i/WORLD_W))).join(''));
  for(const [x,y] of points){
   const a=stableVisualVariant(x,y,seed);
   assert.equal(a,stableVisualVariant(x,y,seed));
   assert.ok(a>=0&&a<1);
  }
  assert.deepEqual(captureWorldSnapshot(),before);
  assert.deepEqual(ZONE_IDS.map(zone=>Array.from({length:WORLD_W*WORLD_H},(_,i)=>terrain(zone,i%WORLD_W,Math.floor(i/WORLD_W))).join('')),tiles);
 }
 configureWorld(0);
});
