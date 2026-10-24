import test from 'node:test';
import assert from 'node:assert/strict';
import {GLYPHS} from '../dist/render/glyph-ramp.js';
import {pathCornerCuts} from '../dist/render/path-contour.js';
import {landmarkPixelCells,landmarkSilhouetteSignature} from '../dist/render/pixel-landmarks.js';
import {BIOME_ART} from '../dist/render/biome-art.js';
import {ZONE_IDS} from '../dist/world.js';

const KINDS=['portal','altar','memory','verdict','rune','chest'];

test('microscopic ASCII uses graphic punctuation, never letter/number debris',()=>{
  assert.equal([...GLYPHS].length,31);
  assert.ok(!/[a-z0-9]/i.test([...GLYPHS].slice(0,23).join('')));
  assert.deepEqual([...GLYPHS].slice(23,27),['░','▒','▓','█']);
  assert.equal(GLYPHS[0],' ');
  assert.notEqual(GLYPHS[3],GLYPHS[22]);
});

test('contiguous pathways have no disconnected corner cutouts',()=>{
  const open={north:true,east:true,south:true,west:true};
  assert.deepEqual(pathCornerCuts(48,open),[]);
  assert.deepEqual(pathCornerCuts(48,{...open,north:false}),[]);
  assert.deepEqual(pathCornerCuts(48,{...open,east:false}),[]);
});

test('one-tile path islands have four pixel-stepped bevels and stay traversable',()=>{
  const cuts=pathCornerCuts(48,{north:false,east:false,south:false,west:false});
  assert.equal(cuts.length,8);
  for(const cut of cuts){
    assert.ok(cut.width>=3&&cut.height>=3);
    assert.ok(cut.x>=0&&cut.y>=0);
    assert.ok(cut.x+cut.width<=48&&cut.y+cut.height<=48);
  }
  assert.equal(pathCornerCuts(48,{north:false,east:true,south:false,west:true}).length,0);
  assert.equal(pathCornerCuts(48,{north:false,east:true,south:false,west:false}).length,4);
  assert.throws(()=>pathCornerCuts(0,{north:false,east:false,south:false,west:false}));
});

test('six authored landmark silhouettes are distinct, legible and deterministic',()=>{
  const signatures=new Set();
  for(const kind of KINDS){
    const one=landmarkPixelCells(kind),two=landmarkPixelCells(kind);
    assert.deepEqual(one,two,kind+' does not have stable authored geometry');
    assert.ok(one.length>=100,kind+' is an unfinished pixel asset');
    assert.ok(new Set(one.map(cell=>cell.ink)).size>=4,kind+' lacks material depth');
    assert.ok(one.every(c=>c.x>=0&&c.y>=0));
    const signature=landmarkSilhouetteSignature(kind);
    assert.ok(signature.length>100);
    signatures.add(signature);
  }
  assert.equal(signatures.size,KINDS.length);
});

test('landmark art adapts to every approved biome palette without altering world IDs',()=>{
  assert.equal(ZONE_IDS.length,7);
  for(const zone of ZONE_IDS){
    const p=BIOME_ART[zone];
    for(const key of ['stoneDark','stoneMid','stoneLight','rim','accent','canopyDark']){
      assert.match(p[key],/^#[0-9a-f]{6}$/i,zone+':'+key);
    }
  }
});
