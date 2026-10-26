import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreature,validateSave} from '../dist/domain.js';
import {configureWorld,captureWorldSnapshot,ZONE_IDS,ZONES} from '../dist/world.js';
import {reveal} from '../dist/world/discovery.js';
import {RELICS,RELIC_IDS} from '../dist/creatures/equipment.js';
import {fieldTrail,fieldTrailRewardName,planFieldTrailClaim,trailClaimRefusal,TRAIL_REWARD_PREFIX} from '../dist/world/pilgrim-trails.js';
import {mount} from './helpers/game-runtime.mjs';
const story=['arken-vow-restored','marsh-chapter-complete','crown-trilogy-complete','afterlight-ossuary-complete'];
function fresh(seed=11){configureWorld(seed);return{version:1,worldSeed:seed,worldSnapshot:captureWorldSnapshot(),zone:'village',x:4,y:16,team:[createCreature('cindrel',8,()=>.5)],storage:[],inventory:{seals:5,tonics:3},flags:[...story],defeatedBoss:false,playSeconds:0,rpg:{echoes:100,completed:[],visitedNpcs:[]}};}
function completeTrail(save,zone){
 save.zone=zone;save.flags.push('zone-'+zone,'altar-'+zone);
 const z=ZONES[zone];const npc=z.landmarks.find(l=>l.kind==='npc');
 if(npc){save.rpg.visitedNpcs.push(npc.npcId);save.flags.push(npc.npcId==='archivist'?'archivist':npc.npcId==='pilgrim'?'pilgrim-met':npc.npcId==='nael'?'marsh-met-nael':npc.npcId==='oriel'?'crown-met-oriel':npc.npcId==='keeper'?'keeper-met':'afterlight-'+zone+'-met');}
 // Use flags that the real journal already understands, not synthetic new progress.
 if(zone==='village')save.flags.push('rune-village');
 if(zone==='forest')save.flags.push('rune-forest','roamer-forest-0');
 if(zone==='sanctuary'){save.flags.push('roamer-sanctuary-0');save.defeatedBoss=true;}
 if(zone==='marsh')save.flags.push('marsh-memory-bell','roamer-marsh-0');
 if(zone==='spire')save.flags.push('crown-relic-'+z.landmarks.find(l=>l.kind==='memory').npcId,'roamer-spire-0');
 if(zone==='ossuary'||zone==='garden')save.flags.push('afterlight-'+zone+'-memory-'+z.landmarks.find(l=>l.kind==='memory').npcId,'roamer-'+zone+'-0');
 const altar=z.landmarks.find(l=>l.kind==='altar');save.x=altar.x;save.y=altar.y;
}
test('all seven authored routes require three distinct real-world acts and produce a validated finite tactical reward',()=>{
 for(const zone of ZONE_IDS){
  const s=fresh();completeTrail(s,zone);
  const trail=fieldTrail(s,zone);
  assert.ok(trail,zone+' missing');assert.equal(trail.acts.length,3,zone);assert.equal(trail.done,3,zone+': '+JSON.stringify(trail.acts));assert.equal(trail.ready,true,zone);
  assert.ok(trail.acts.every(a=>a.objective&&a.objective.done&&a.known));assert.equal(trailClaimRefusal(s,zone),null);
  const before=JSON.stringify(s),next=planFieldTrailClaim(s,zone);assert.ok(next,zone);assert.equal(JSON.stringify(s),before);
  assert.equal(next.flags.filter(f=>f===TRAIL_REWARD_PREFIX+zone).length,1);
  assert.equal(next.rpg.echoes,s.rpg.echoes+trail.echoes);
  assert.ok(RELICS[trail.reward]);assert.equal(next.relics[trail.reward],1);
  assert.ok(validateSave(next));assert.equal(planFieldTrailClaim(next,zone),null);
 }
});
test('route preview is pure and does not disclose fogged coordinates or future region identity',()=>{
 for(let seed=1;seed<=200;seed++){
  const s=fresh(seed),before=JSON.stringify(s);
  for(const zone of ZONE_IDS){
   if(zone!=='village')s.flags.push('zone-'+zone);
   const t=fieldTrail(s,zone);
   assert.ok(t);assert.equal(t.done,0);assert.ok(t.acts.every(a=>!a.known&&!a.objective));assert.equal(planFieldTrailClaim(s,zone),null);
   const altar=ZONES[zone].landmarks.find(l=>l.kind==='altar');
   s.discovered=reveal(s.discovered,zone,altar.x,altar.y);
   const seen=fieldTrail(s,zone);assert.ok(seen.acts.some(a=>a.known)||zone==='forest'||zone==='marsh'||zone==='spire'||zone==='ossuary'||zone==='garden');
  }
  assert.ok(validateSave(s));assert.equal(before.includes('field-trail'),false);
  configureWorld(seed,s.worldSnapshot);assert.deepEqual(captureWorldSnapshot(),s.worldSnapshot);
 }
});
test('claims require the actual regional visited Lumbre; combat, capped ledger, overflow and flags fail closed',()=>{
 const s=fresh();completeTrail(s,'village');const before=JSON.stringify(s);
 s.x+=4;assert.match(trailClaimRefusal(s,'village'),/LUMBRE/);assert.equal(planFieldTrailClaim(s,'village'),null);s.x-=4;
 s.activeBattle={};assert.equal(planFieldTrailClaim(s,'village'),null);delete s.activeBattle;
 s.expedition={};assert.equal(planFieldTrailClaim(s,'village'),null);delete s.expedition;
 s.rpg.echoes=999999;assert.equal(planFieldTrailClaim(s,'village'),null);s.rpg.echoes=100;
 assert.equal(JSON.stringify(s),before);
 const full={...s,relics:Object.fromEntries(RELIC_IDS.map(id=>[id,6]))};
 assert.match(fieldTrailRewardName(full,'village'),/Sin reliquia/);const rewardless=planFieldTrailClaim(full,'village');
 assert.ok(rewardless);assert.equal(rewardless.relics,full.relics);assert.equal(rewardless.rpg.echoes,120);
 s.flags.push(...Array.from({length:200-s.flags.length},(_,i)=>'unused-'+i));assert.equal(planFieldTrailClaim(s,'village'),null);
});
test('physical runtime Journal preview, CAS-safe claim, repeat refusal and resumed save v1',()=>{
 const r=mount({virtualTime:true,seed:149});const {game,storage,dom,world}=r;
 game.startNew();game.pickStarter('cindrel');while(game.dialogOpen)game.nextDialog();
 game.openFieldJournal();assert.match(dom.get('modalContent').innerHTML,/EL NOMBRE QUE FALTA/);assert.equal(game.claimFieldTrail('village'),false);
 game.save.flags.push('archivist','rune-village','altar-village');game.save.rpg.visitedNpcs.push('archivist');
 const altar=world.ZONES.village.landmarks.find(l=>l.kind==='altar');game.save.x=altar.x;game.save.y=altar.y;game.saveNow(false);
 const raw=storage.getItem('ascii-azur-save-v1'),bad=JSON.parse(raw);bad.playSeconds+=8;storage.setItem('ascii-azur-save-v1',JSON.stringify(bad));
 assert.equal(game.claimFieldTrail('village'),false);assert.ok(!game.save.flags.includes('field-trail-village'));
 game.continueGame();assert.equal(game.claimFieldTrail('village'),true);assert.equal(game.claimFieldTrail('village'),false);
 const saved=storage.getItem('ascii-azur-save-v1'),s=JSON.parse(saved);
 assert.ok(validateSave(s));assert.equal(s.flags.filter(f=>f==='field-trail-village').length,1);
 assert.equal(s.relics['hearth-bead'],1);
 const resumed=mount({virtualTime:true,priorSave:saved});resumed.game.continueGame();
 assert.equal(fieldTrail(resumed.game.save,'village').claimed,true);
 const stable=resumed.storage.getItem('ascii-azur-save-v1');resumed.game.openFieldJournal();
 assert.match(resumed.dom.get('modalContent').innerHTML,/RUTA COMPLETADA/);
 assert.equal(resumed.storage.getItem('ascii-azur-save-v1'),stable);
});
