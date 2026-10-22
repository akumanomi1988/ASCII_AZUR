import test from 'node:test';
import assert from 'node:assert/strict';
import {configureWorld,ZONES,isBlocked,getReachableTiles,captureWorldSnapshot,WORLD_W,terrain} from '../dist/world.js';
import {visibleEncounters,nearbyEncounter,ROAMER_FIRST_VICTORY_XP,firstRoamerVictoryBonus,recoverTrailParty} from '../dist/world/encounters.js';
import {DEFAULT_GRAPHICS,boundGraphic,glyphCell,canvasGlyphCell,glyphCount,readGraphics} from '../dist/render/graphics-profile.js';
import {validateBattleCheckpoint,createCreature,gainExp,maxHp,SPECIES,TYPE_ADV} from '../dist/domain.js';

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

test('first-trail respite restores 25% maximum HP to conscious companions without mutating input or reviving fainted allies',()=>{
 const a=createCreature('cindrel',5),b=createCreature('velaria',5),fainted=createCreature('thorne',5);
 a.hp=2;b.hp=maxHp(b)-1;fainted.hp=0;
 const originals=[a.hp,b.hp,fainted.hp];
 const recovered=recoverTrailParty([a,b,fainted]);
 assert.deepEqual([a.hp,b.hp,fainted.hp],originals,'recovery must not mutate battle checkpoint references');
 assert.equal(recovered[0].hp,2+Math.ceil(maxHp(a)*.25));
 assert.equal(recovered[1].hp,maxHp(b),'cannot overheal');
 assert.equal(recovered[2].hp,0,'do not revive unconscious companions');
 assert.equal(recovered[0].uid,a.uid);
 assert.equal(recovered[0].exp,a.exp);
 assert.equal(recoverTrailParty([]).length,0);
});

test('legacy world v1 supplies three reachable trail encounters without changing its terrain',()=>{
 configureWorld(0);
 for(const zone of ['forest','sanctuary']){
  const before=Array.from({length:WORLD_W*32},(_,i)=>terrain(zone,i%WORLD_W,Math.floor(i/WORLD_W))).join(',');
  const monsters=visibleEncounters(zone,0);
  assert.deepEqual(monsters.map(m=>m.id),[zone+'-0',zone+'-1',zone+'-2'],zone+' lost its first-win training route');
  const reachable=getReachableTiles(zone);
  for(const m of monsters){
   assert.ok(reachable.has(m.y*WORLD_W+m.x),zone+': unreachable encounter '+m.id);
   assert.ok(['ground','grass'].includes(terrain(zone,m.x,m.y)),zone+': encounter not on legacy road');
   assert.ok(Math.abs(m.y-16)<=2,'legacy roamer must stay on the central road');
   assert.ok(ZONES[zone].landmarks.every(l=>Math.hypot(l.x-m.x,l.y-m.y)>=3));
   assert.ok(monsters.every(n=>n.id===m.id||Math.hypot(n.x-m.x,n.y-m.y)>=6),'encounters must remain separated');
  }
  assert.deepEqual(visibleEncounters(zone,0),monsters,'legacy encounters should be deterministic');
  const after=Array.from({length:WORLD_W*32},(_,i)=>terrain(zone,i%WORLD_W,Math.floor(i/WORLD_W))).join(',');
  assert.equal(after,before,'legacy layout must not be regenerated or mutated');
 }
});
test('three visible fights are guaranteed across 512 seeded worlds and survive snapshot reload',()=>{
 try{
  for(let n=1;n<=512;n++){
   const seed=(Math.imul(n,2654435761))>>>0;
   configureWorld(seed);
   for(const zone of ['forest','sanctuary']){
    const monsters=visibleEncounters(zone,seed);
    assert.equal(monsters.length,3,zone+' seed '+seed+' must have three first-win encounters');
    const accessible=getReachableTiles(zone);
    for(const m of monsters){
     assert.ok(accessible.has(m.y*WORLD_W+m.x),m.id+' is unreachable');
     assert.equal(terrain(zone,m.x,m.y),'path',m.id+' is not on its generated road');
     assert.ok(monsters.every(other=>other.id===m.id||Math.hypot(m.x-other.x,m.y-other.y)>=6));
     assert.ok(ZONES[zone].landmarks.every(l=>Math.hypot(l.x-m.x,l.y-m.y)>=3));
    }
   }
  }
  const seed=91234567;configureWorld(seed);
  const snapshot=captureWorldSnapshot();
  assert.ok(snapshot);
  const before=['forest','sanctuary'].map(zone=>visibleEncounters(zone,seed));
  configureWorld(123);
  configureWorld(seed,snapshot);
  assert.deepEqual(['forest','sanctuary'].map(zone=>visibleEncounters(zone,seed)),before);
 }finally{configureWorld(0);}
});

test('forest trail guarantees one favourable matchup per starter while keeping deterministic species diversity',()=>{
 try{
  for(let seed=0;seed<512;seed++){
   configureWorld(seed===0?0:(Math.imul(seed,2654435761))>>>0);
   const monsters=visibleEncounters('forest',seed);
   assert.equal(monsters.length,3);
   // Type advantage is fixed: Ash -> Root, Mist -> Ether, Root -> Mist.
   assert.ok(['mireling','velaria'].includes(monsters[0].speciesId));
   assert.ok(['thorne','briarling'].includes(monsters[1].speciesId));
   assert.ok(['wispawn','gravemoth'].includes(monsters[2].speciesId));
   for(const player of ['cindrel','velaria','thorne']){
    const favourable={cindrel:1,velaria:2,thorne:0}[player];
    assert.equal(SPECIES[monsters[favourable].speciesId].element,TYPE_ADV[SPECIES[player].element],player+' is denied a favourable forest encounter at seed '+seed);
   }
  }
 }finally{configureWorld(0);}
});

test('Sanctuary provides three ordered elemental lessons for all starters across 512 world seeds',()=>{
 try{
  const expected=['Raíz','Bruma','Éter'];
  const diversity=[new Set(),new Set(),new Set()];
  for(let i=0;i<512;i++){
   const seed=i===0?0:(Math.imul(i,2654435761))>>>0;
   configureWorld(seed);
   const a=visibleEncounters('sanctuary',seed);
   assert.equal(a.length,3,'all Sanctuary encounters must remain available');
   assert.deepEqual(a.map(x=>SPECIES[x.speciesId].element),expected);
   assert.deepEqual(a.map(x=>x.id),['sanctuary-0','sanctuary-1','sanctuary-2']);
   assert.deepEqual(a.map(x=>x.level),[8,9,10]);
   assert.deepEqual(visibleEncounters('sanctuary',seed),a,'same seed, same opponents');
   for(let slot=0;slot<3;slot++)diversity[slot].add(a[slot].speciesId);
   for(const starter of ['cindrel','velaria','thorne']){
    const element=SPECIES[starter].element;
    assert.equal(a.filter(monster=>SPECIES[monster.speciesId].element===TYPE_ADV[element]).length,1,
      'starter '+starter+' lacks exactly one favourable Sanctuary encounter');
   }
  }
  assert.deepEqual(diversity.map(s=>s.size),[2,3,3],'keep authored species variation in each stage');
 }finally{configureWorld(0);}
});

test('first Arken elemental lessons grant finite and distinct XP only for real village wild victories',async()=>{
 const {villageTrainingBonus,villageTrainingProgress,VILLAGE_TRAINING_XP,VILLAGE_TRAINING_REWARD_FLAG,VILLAGE_TRAINING_SPECIES}=await import('../dist/world/encounters.js');
 assert.equal(VILLAGE_TRAINING_XP,55);
 assert.deepEqual(VILLAGE_TRAINING_SPECIES,['cindrel','briarling','mireling']);
 for(const id of VILLAGE_TRAINING_SPECIES){
  assert.equal(villageTrainingBonus('wild','village',id,[]),55);
  assert.equal(villageTrainingBonus('wild','village',id,['training-'+id]),0);
  assert.equal(villageTrainingBonus('wild','forest',id,[]),0);
  assert.equal(villageTrainingBonus('boss','village',id,[]),0);
  assert.equal(villageTrainingBonus('expedition','village',id,[]),0);
 }
 assert.equal(villageTrainingBonus('wild','village','runeowl',[]),0);
 assert.deepEqual(villageTrainingProgress(['training-cindrel','training-cindrel','training-mireling']),{completed:2,ready:false,claimed:false});
 const flags=VILLAGE_TRAINING_SPECIES.map(id=>'training-'+id);
 assert.deepEqual(villageTrainingProgress(flags),{completed:3,ready:true,claimed:false});
 assert.deepEqual(villageTrainingProgress([...flags,VILLAGE_TRAINING_REWARD_FLAG]),{completed:3,ready:false,claimed:true});
});
