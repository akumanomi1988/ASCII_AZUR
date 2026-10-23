import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES,MOVES,SIGNATURE_MOVES,createCreature,gainExp,learnableMoves,validateSave,maxHp,damage} from '../dist/domain.js';
import {MOVE_EFFECTS,skillUtility} from '../dist/combat/tactics.js';
import {BIOME_WILD_SPECIES,BIOME_DUEL_SPECIES,drawBiomeWild,biomeDuelLevel,biomeWildLevel,visibleEncounters} from '../dist/world/encounters.js';
import {RIGS,rigFor,performanceChecksum} from '../dist/actors/creature-performance.js';

test('P2: four authored identities cover distinct tactical archetypes and rigs',()=>{
 const expected={mourveil:['Bruma',12],mnemoshade:['Éter',13],bellroot:['Raíz',14],ashglass:['Ceniza',15]};
 for(const [id,[element,shape]] of Object.entries(expected)){
  const sp=SPECIES[id];
  assert.ok(sp,id);assert.equal(sp.element,element);assert.equal(sp.shape,shape);
  assert.ok(sp.role?.length>12,id+' tactical identity');
  assert.ok(RIGS[id]);assert.equal(rigFor(id).family.length>0,true);
  assert.equal(performanceChecksum(id,3.5),performanceChecksum(id,3.5));
  const c=createCreature(id,14,()=>.42);
  assert.equal(c.hp,maxHp(c));assert.ok(c.moves.includes(SIGNATURE_MOVES[id]));
 }
 assert.equal(Object.keys(SPECIES).length,17);
});

test('P2: inherited creatures evolve without save-schema changes or losing support skills',()=>{
 const veil=createCreature('velaria',11,()=>.1);
 assert.ok(veil.moves.includes('drizzle'));
 const a=gainExp(veil,200);
 assert.equal(a.evolved,true);assert.equal(veil.speciesId,'mourveil');
 assert.ok(veil.moves.includes('drizzle'));assert.ok(veil.moves.includes('lament'));
 const shade=createCreature('wispawn',12,()=>.2);
 assert.ok(shade.moves.includes('siphon'));
 const b=gainExp(shade,200);
 assert.equal(b.evolved,true);assert.equal(shade.speciesId,'mnemoshade');
 assert.ok(shade.moves.includes('siphon'));assert.ok(shade.moves.includes('sigilbite'));
 const save={version:1,zone:'marsh',x:10,y:16,team:[veil,shade],storage:[createCreature('bellroot',13),createCreature('ashglass',15)],inventory:{seals:2,tonics:1},defeatedBoss:true,flags:[],playSeconds:10};
 assert.equal(validateSave(save),true);
 assert.ok(learnableMoves('mourveil',12).includes('lament'));
});

test('P2: battle roles produce distinct, real combat effects',()=>{
 assert.equal(MOVES.lament.role,'cleanse');
 assert.equal(MOVES.sigilbite.role,'drain');
 assert.equal(MOVES.bellguard.role,undefined);
 assert.equal(MOVE_EFFECTS.sigilbite.kind,'fracture');
 assert.equal(MOVE_EFFECTS.glassflare.kind,'scorch');
 const bell=createCreature('bellroot',13),glass=createCreature('ashglass',13);
 bell.hp-=20;
 assert.equal(skillUtility(bell,MOVES.bellguard,[{kind:'scorch',remaining:2}]).cleanse,false);
 assert.equal(skillUtility(createCreature('mourveil',13),MOVES.lament,[{kind:'scorch',remaining:2}]).cleanse,true);
 assert.ok(damage(bell,glass,MOVES.bellguard).value>0);
 assert.ok(damage(glass,bell,MOVES.glassflare).value>0);
 assert.ok(glass.level===bell.level&&SPECIES.ashglass.stats.speed>SPECIES.bellroot.stats.speed);
});

test('P2: each new region has distinct capturable wild and direct challenge populations',()=>{
 assert.ok(BIOME_WILD_SPECIES.marsh.includes('bellroot'));
 assert.ok(BIOME_WILD_SPECIES.marsh.includes('mourveil'));
 assert.ok(BIOME_WILD_SPECIES.spire.includes('ashglass'));
 assert.ok(BIOME_WILD_SPECIES.spire.includes('mnemoshade'));
 assert.ok(!BIOME_WILD_SPECIES.forest.includes('bellroot'));
 assert.ok(!BIOME_WILD_SPECIES.sanctuary.includes('ashglass'));
 assert.deepEqual(BIOME_DUEL_SPECIES.marsh,['bellroot','mourveil','rillfin']);
 assert.deepEqual(BIOME_DUEL_SPECIES.spire,['ashglass','mnemoshade','cinderwulf']);
 assert.equal(drawBiomeWild('marsh',0),'bellroot');
 assert.equal(drawBiomeWild('spire',0),'ashglass');
 assert.equal(drawBiomeWild('village',.5),undefined);
 assert.equal(biomeDuelLevel('marsh',2),13);
 assert.equal(biomeDuelLevel('spire',0),13);
 assert.equal(biomeWildLevel('spire',.99),16);
});

test('P2: compulsory story witnesses remain compatible with legacy seeded encounters',()=>{
 for(const seed of [1,7,42,99,512]){
  const marsh=visibleEncounters('marsh',seed);
  const spire=visibleEncounters('spire',seed);
  assert.equal(marsh.length,3);assert.equal(spire.length,3);
  assert.ok(['rillfin','mireling'].includes(marsh[0].speciesId));
  assert.ok(['ashboar','cinderwulf'].includes(spire[0].speciesId));
  assert.ok(['rillfin','mireling'].includes(spire[1].speciesId));
  assert.equal(new Set([...marsh,...spire].map(e=>e.id)).size,6);
 }
});
