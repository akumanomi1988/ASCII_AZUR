import test from 'node:test';
import assert from 'node:assert/strict';
import {storyGuidance,guidanceToTarget} from '../dist/story-navigation.js';
import {ARKEN_FINALE_FLAG} from '../dist/story-campaign.js';
const story=(flags=[],defeatedBoss=false,dungeonFinished=false)=>({flags,defeatedBoss,dungeonFinished});
const position=(zone,x,y,inDungeon=false)=>({zone,x,y,inDungeon});
test('archivist objective points toward the actual NPC, then prompts interaction',()=>{
 const s=story();let cue=storyGuidance(s,position('village',4,16));
 assert.equal(cue.direction,'→');assert.equal(cue.distance,4);assert.equal(cue.target.npcId,'archivist');
 cue=storyGuidance(s,position('village',7,16));assert.equal(cue.kind,'interaction');assert.match(cue.text,/ACCIÓN/);
});
test('cross-zone targets follow the existing authored east and west portals',()=>{
 const forestGoal=story(['archivist']);
 assert.equal(storyGuidance(forestGoal,position('village',35,16)).target.x,43);
 const sanctuaryGoal=story(['archivist','zone-forest']);
 assert.equal(storyGuidance(sanctuaryGoal,position('forest',15,16)).target.x,43);
 const returning=story(['archivist','zone-forest','zone-sanctuary'],true,true);
 assert.equal(storyGuidance(returning,position('sanctuary',22,16)).target.x,2);
 assert.equal(storyGuidance(returning,position('forest',35,16)).target.x,2);
});
test('guardian stage targets Hollowhart and remains accurate from the diagonal',()=>{
 const g=story(['archivist','zone-forest','zone-sanctuary']);
 const cue=storyGuidance(g,position('sanctuary',31,12));
 assert.equal(cue.target.kind,'guardian');assert.ok(['→','←','↑','↓'].includes(cue.direction));
 assert.ok(cue.waypoint);assert.equal(Math.abs(cue.waypoint.x-31)+Math.abs(cue.waypoint.y-12),1);
 assert.equal(cue.kind,'target');assert.ok(cue.distance>0);
});
test('crypt stage guides to accessible menu without inventing a world coordinate',()=>{
 const s=story(['archivist','zone-forest','zone-sanctuary'],true);
 const cue=storyGuidance(s,position('sanctuary',22,16));assert.equal(cue.kind,'menu');assert.equal(cue.target,null);
 assert.match(cue.text,/CRIPTA/);
 assert.equal(storyGuidance(s,position('village',10,16,true)).kind,'dungeon');
});
test('Marsh completion transitions to chapter III and final completion is terminal',()=>{
 const s=story(['archivist','zone-forest','zone-sanctuary',ARKEN_FINALE_FLAG],true,true);
 for(const zone of ['village','forest','sanctuary']){
 const next=storyGuidance({...s,flags:[...s.flags,'marsh-chapter-complete']},position(zone,20,16));assert.equal(next.kind,'target');assert.ok(next.target);
 const cue=storyGuidance({...s,flags:[...s.flags,'marsh-chapter-complete','crown-nullscribe-fallen','crown-choice-renew','crown-trilogy-complete']},position(zone,20,16));assert.equal(cue.kind,'completed');assert.equal(cue.distance,null);
 }
});
test('future story flags alone do not skip the Archivist requirement',()=>{
 const s=story(['zone-forest','zone-sanctuary'],true,true);
 assert.equal(storyGuidance(s,position('village',4,16)).target.npcId,'archivist');
});
test('navigation reads landmarks relocated by seeded map generation rather than using hard-coded positions',async()=>{
 const {configureWorld,ZONES}=await import('../dist/world.js');
 const previous=ZONES.village.landmarks.map(x=>({...x}));
 try{
  configureWorld(381922);
  const target=ZONES.village.landmarks.find(x=>x.npcId==='archivist');
  const cue=storyGuidance(story(),position('village',4,16));
  assert.equal(cue.target.x,target.x);assert.equal(cue.target.y,target.y);
  configureWorld(771441);
  const changed=ZONES.village.landmarks.find(x=>x.npcId==='archivist');
  const rerender=storyGuidance(story(),position('village',4,16));
  assert.equal(rerender.target.x,changed.x);assert.equal(rerender.target.y,changed.y);
 }finally{
  configureWorld(0);
 }
});

test('W4 shared route compass physically reaches all landmarks and roamers across 200 deterministic worlds',async()=>{
 const {configureWorld,ZONES,ZONE_IDS,canOccupy,sweepMove,getWorldSeed}=await import('../dist/world.js');
 const {visibleEncounters}=await import('../dist/world/encounters.js');
 let routes=0,moves=0;
 try{
  for(let seed=1;seed<=200;seed++){
   configureWorld((Math.imul(seed,2654435761)>>>0)||1);
   for(const zone of ZONE_IDS){
    const targets=[
     ...ZONES[zone].landmarks,
     ...visibleEncounters(zone,getWorldSeed()).map(e=>({x:e.x,y:e.y,label:e.speciesId}))
    ];
    for(const target of targets){
     let x=4,y=16,arrived=false;
     assert.ok(canOccupy(zone,x,y,.19),`${seed}/${zone} spawn blocked`);
     for(let step=0;step<1600;step++){
      const cue=guidanceToTarget({zone,x,y,inDungeon:false},target);
      if(cue.kind==='interaction'){arrived=true;break;}
      assert.equal(cue.kind,'target',`${seed}/${zone}/${target.label}: ${cue.text}`);
      assert.ok(cue.waypoint,`${seed}/${zone}/${target.label} has no waypoint`);
      const next=cue.waypoint;
      assert.equal(Math.abs(next.x-x)+Math.abs(next.y-y),1,`${seed}/${zone}/${target.label} jumps a tile`);
      const moved=sweepMove(zone,x,y,next.x-x,next.y-y,.19);
      assert.ok(Math.hypot(moved.x-next.x,moved.y-next.y)<1e-6,`${seed}/${zone}/${target.label} movement blocked`);
      x=next.x;y=next.y;moves++;
     }
     assert.ok(arrived,`${seed}/${zone}/${target.label} did not arrive`);
     routes++;
    }
   }
  }
 }finally{configureWorld(0);}
 assert.ok(routes>=8000,`expected broad route coverage, got ${routes}`);
 assert.ok(moves>routes,`expected actual traversal, got ${moves}`);
});
