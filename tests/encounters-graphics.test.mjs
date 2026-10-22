import test from 'node:test';
import assert from 'node:assert/strict';
import {configureWorld,ZONES,isBlocked} from '../dist/world.js';
import {visibleEncounters,nearbyEncounter,ROAMER_FIRST_VICTORY_XP,firstRoamerVictoryBonus} from '../dist/world/encounters.js';
import {DEFAULT_GRAPHICS,boundGraphic,glyphCell,canvasGlyphCell,glyphCount,readGraphics} from '../dist/render/graphics-profile.js';
import {validateBattleCheckpoint,createCreature,gainExp} from '../dist/domain.js';

test('visible encounters are reproducible, reachable, interactive, and not in the village for 200 seeds',()=>{
 let count=0;
 for(let seed=1;seed<=200;seed++){
  configureWorld(seed);
  assert.deepEqual(visibleEncounters('village',seed),[]);
  for(const region of ['forest','sanctuary']){
   const monsters=visibleEncounters(region,seed);
   assert.ok(monsters.length>=2,`too few direct battles at ${region} seed ${seed}`);
   assert.deepEqual(visibleEncounters(region,seed),monsters);
   for(const m of monsters){
    assert.equal(isBlocked(region,m.x,m.y),false);
    assert.ok(ZONES[region].landmarks.every(l=>Math.hypot(l.x-m.x,l.y-m.y)>=3));
    assert.equal(nearbyEncounter(monsters,[],m.x,m.y)?.id,m.id);
    assert.equal(nearbyEncounter(monsters,['roamer-'+m.id],m.x,m.y),undefined);
    count++;
   }
  }
 }
 assert.ok(count>=800);
});
test('legacy seed 0 never requires changing its generated map',()=>{
 configureWorld(0); assert.deepEqual(visibleEncounters('village',0),[]);
 assert.equal(visibleEncounters('forest',0).every(e=>!isBlocked('forest',e.x,e.y)),true);
});
test('graphics preferences clamp invalid and hostile values; legacy settings remain compatible',()=>{
 assert.deepEqual(readGraphics(null),DEFAULT_GRAPHICS);
 const v=readGraphics({density:.48,quality:.4});assert.equal(v.density,.48);assert.equal(v.quality,.4);assert.equal(v.glyphScale,.8);
 const bad=readGraphics({density:-20,glyphScale:NaN,contrast:10000,edgeStrength:0,brightness:'99',quality:Infinity});
 assert.equal(bad.density,.18);assert.equal(bad.glyphScale,.8);assert.equal(bad.contrast,1.8);assert.equal(bad.edgeStrength,.5);assert.equal(bad.brightness,.02);
 assert.equal(boundGraphic('quality',undefined),1);
});
test('glyph density and size are independent in both renderers',()=>{
 const a=glyphCell(10,readGraphics({density:.56,glyphScale:1}));
 const b=glyphCell(10,readGraphics({density:.42,glyphScale:1}));
 const c=glyphCell(10,readGraphics({density:.56,glyphScale:1.5}));
 assert.ok(b.width<a.width&&c.width>a.width);assert.ok(a.height>a.width);
});
test('checkpoints accept only canonical encounter identities',()=>{
 const c=createCreature('thorne',7);const state={enemy:createCreature('cindrel',6),type:'wild',ally:0,guarding:false,bossPhase:1,chargeStage:0,effects:{},encounterId:'forest-1'};
 assert.equal(validateBattleCheckpoint(state,[c]),true);
 assert.equal(validateBattleCheckpoint({...state,encounterId:'../../evil'},[c]),false);
});

test('microscopic GPU preset uses more than 100000 independently sampled cells at desktop size',()=>{
 const ultra=readGraphics({density:.18,glyphScale:.5});
 const cell=glyphCell(10,ultra);
 assert.equal(cell.width,1.25);
 assert.ok(glyphCount(1280,720,cell)>300000);
 const standard=glyphCell(10,DEFAULT_GRAPHICS);
 assert.ok(glyphCount(1280,720,standard)>60000);
 assert.ok(glyphCount(1280,720,cell)>glyphCount(1280,720,standard)*3);
});
test('Canvas2D density cap preserves aspect ratio and never constrains WebGL2',()=>{
 const preset=readGraphics({density:.18,glyphScale:.5});
 const fallback=canvasGlyphCell(10,preset,1920,1080);
 assert.ok(glyphCount(1920,1080,fallback)<=102000);
 assert.ok(fallback.width>glyphCell(10,preset).width);
 assert.ok(canvasGlyphCell(10,DEFAULT_GRAPHICS,320,180).width>=glyphCell(10,DEFAULT_GRAPHICS).width);
});

test('visible trail rewards are first-win only, never repeat or apply to captures, random battles or bosses',()=>{
 assert.equal(ROAMER_FIRST_VICTORY_XP,48);
 assert.equal(firstRoamerVictoryBonus('wild','forest-0',[]),48);
 assert.equal(firstRoamerVictoryBonus('wild','sanctuary-2',[]),48);
 assert.equal(firstRoamerVictoryBonus('wild','forest-0',['roamer-forest-0']),0);
 assert.equal(firstRoamerVictoryBonus('wild',undefined,[]),0);
 assert.equal(firstRoamerVictoryBonus('boss','forest-0',[]),0);
 assert.equal(firstRoamerVictoryBonus('expedition','forest-0',[]),0);
 assert.equal(firstRoamerVictoryBonus('wild','forest-4',[]),0);
 // Forest routes are level 5/6/7. Three legitimate first victories can lift
 // each level-five starter to the Guardian's recommended level without 18 repeats.
 for(const id of ['cindrel','velaria','thorne']){
  const c=createCreature(id,5,()=>.1);
  for(const level of [5,6,7])gainExp(c,11+level*3+ROAMER_FIRST_VICTORY_XP);
  assert.ok(c.level>=8,id+' did not reach level 8 from three first victories');
 }
});
