import test from 'node:test';
import assert from 'node:assert/strict';
import {storyGuidance} from '../dist/story-navigation.js';
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
 assert.equal(cue.target.kind,'guardian');assert.equal(cue.direction,'↘');
 assert.equal(cue.kind,'target');assert.ok(cue.distance>0);
});
test('crypt stage guides to accessible menu without inventing a world coordinate',()=>{
 const s=story(['archivist','zone-forest','zone-sanctuary'],true);
 const cue=storyGuidance(s,position('sanctuary',22,16));assert.equal(cue.kind,'menu');assert.equal(cue.target,null);
 assert.match(cue.text,/CRIPTA/);
 assert.equal(storyGuidance(s,position('village',10,16,true)).kind,'dungeon');
});
test('completed chapter has a stable terminal cue, regardless of location',()=>{
 const s=story(['archivist','zone-forest','zone-sanctuary',ARKEN_FINALE_FLAG],true,true);
 for(const zone of ['village','forest','sanctuary']){
 const cue=storyGuidance(s,position(zone,20,16));assert.equal(cue.kind,'completed');assert.equal(cue.distance,null);
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
