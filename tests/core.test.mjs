import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES,MOVES,TYPE_ADV,createCreature,maxHp,damage,gainExp,validateSave} from '../dist/domain.js';
import {ZONES,WORLD_W,WORLD_H,terrain,isBlocked,canOccupy,isWild,nearbyLandmark} from '../dist/world.js';
test('12 original species plus final boss and four affinities',()=>{assert.equal(Object.keys(SPECIES).length,13);assert.equal(new Set(Object.values(SPECIES).map(s=>s.element)).size,4);});
test('every species has valid base stats and known moves',()=>{for(const [id,s] of Object.entries(SPECIES)){assert.ok(s.stats.hp>20,id);assert.ok(s.stats.attack>0);assert.ok(s.stats.defense>0);assert.ok(s.stats.speed>0);if(s.evo)assert.ok(SPECIES[s.evo.id]);}assert.ok(Object.keys(MOVES).length>=9);});
test('capture-generated creature has correct stats',()=>{const c=createCreature('cindrel',5,()=>0.5);assert.equal(c.level,5);assert.equal(c.hp,maxHp(c));assert.equal(c.uid,'cindrel-500000000');assert.ok(c.moves.length>=2);});
test('type advantages are directional',()=>{for(const [att,def] of Object.entries(TYPE_ADV))assert.notEqual(TYPE_ADV[def],att);});
test('effective hit deals more damage',()=>{const a=createCreature('cindrel',6),d=createCreature('thorne',6);const e=damage(a,d,MOVES.ember,1);const n=damage(a,d,MOVES.pulse,1);assert.equal(e.effective,true);assert.ok(e.value>n.value);});
test('damage cannot be negative or zero',()=>{const a=createCreature('thorne',1),d=createCreature('hollowhart',28);assert.ok(damage(a,d,MOVES.thorn,.5).value>=1);});
test('evolution at threshold and maximum HP increases',()=>{const c=createCreature('cindrel',8);const before=maxHp(c);const gained=gainExp(c,100);assert.equal(gained.evolved,true);assert.equal(c.speciesId,'cinderwulf');assert.ok(maxHp(c)>before);});
test('experience can cross several levels',()=>{const c=createCreature('velaria',1);gainExp(c,250);assert.ok(c.level>4);});
test('save game accepts valid payload and rejects malformed',()=>{const c=createCreature('velaria',5);const save={version:1,zone:'village',x:4,y:16,team:[c],storage:[],inventory:{seals:5,tonics:2},defeatedBoss:false,flags:[],playSeconds:0};assert.equal(validateSave(save),true);assert.equal(validateSave({...save,team:[]}),false);assert.equal(validateSave({...save,team:[{...c,speciesId:'missing'}]}),false);assert.equal(validateSave({...save,zone:'imaginary'}),false);});
test('world dimensions and zone IDs',()=>{assert.ok(WORLD_W>40&&WORLD_H>25);assert.deepEqual(Object.keys(ZONES).sort(),['forest','marsh','sanctuary','spire','village']);});
test('primary corridor is passable in every zone',()=>{for(const zone of Object.keys(ZONES))for(let x=4;x<43;x++)assert.equal(isBlocked(zone,x,16),false,`${zone} x${x}`);});
test('world bounds reject movement',()=>{assert.equal(terrain('forest',-1,4),'wall');assert.equal(terrain('village',WORLD_W,1),'wall');assert.equal(terrain('sanctuary',4,WORLD_H),'wall');});
test('every zone has an altar and traversable portals',()=>{for(const zone of Object.values(ZONES)){assert.ok(zone.landmarks.some(l=>l.kind==='altar'));for(const l of zone.landmarks)assert.ok(!isBlocked(zone.id,l.x,l.y),`${zone.name}/${l.label}`);}});
test('nearby landmark resolves by distance',()=>{assert.equal(nearbyLandmark('village',8,16)?.kind,'npc');assert.equal(nearbyLandmark('village',1,1),undefined);});
test('forest offers wild-encounter cells',()=>{let n=0;for(let x=2;x<44;x++)for(let y=3;y<28;y++)if(isWild('forest',x,y))n++;assert.ok(n>100);});

test('footprint collision: circle cannot clip through tree/stone or world bounds',()=>{
 for (const zone of Object.keys(ZONES)) {
  assert.equal(canOccupy(zone,4,16,.20),true);
  assert.equal(canOccupy(zone,-1,16,.2),false);
  let blocked=null;
  for(let y=4;y<28&&!blocked;y++)for(let x=3;x<43;x++)if(isBlocked(zone,x,y)){blocked={x,y};break;}
  if(blocked)assert.equal(canOccupy(zone,blocked.x,blocked.y,.2),false);
 }
});
