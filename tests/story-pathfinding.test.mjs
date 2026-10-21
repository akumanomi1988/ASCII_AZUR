import test from 'node:test';
import assert from 'node:assert/strict';
import {storyGuidance} from '../dist/story-navigation.js';
import {configureWorld,canOccupy,terrain,captureWorldSnapshot,WORLD_W,getWorldRevision} from '../dist/world.js';
const story=(flags=[],boss=false,crypt=false)=>({flags,defeatedBoss:boss,dungeonFinished:crypt});
const pose=(zone,x,y)=>({zone,x,y,inDungeon:false});
function walk(zone,s,x=4,y=16){
 for(let steps=0;steps<160;steps++){
  const cue=storyGuidance(s,pose(zone,x,y));
  if(cue.kind==='interaction')return steps;
  assert.equal(cue.kind,'target',cue.text);
  assert.ok(cue.waypoint);
  assert.equal(Math.abs(cue.waypoint.x-x)+Math.abs(cue.waypoint.y-y),1);
  assert.equal(canOccupy(zone,cue.waypoint.x,cue.waypoint.y,.19),true);
  ({x,y}=cue.waypoint);
 }
 throw Error('Route never reaches an interaction point');
}
test('navigation follows safe paths to five objectives in 40 generated worlds',()=>{
 try{for(let i=1;i<=40;i++){
  configureWorld((i*274763641)>>>0);
  for(const [zone,s] of [
   ['village',story()],['village',story(['archivist'])],
   ['forest',story(['archivist','zone-forest'])],
   ['sanctuary',story(['archivist','zone-forest','zone-sanctuary'])],
   ['sanctuary',story(['archivist','zone-forest','zone-sanctuary'],true,true)]
  ])assert.ok(walk(zone,s)>=0);
 }}finally{configureWorld(0);}
});
test('quest arrow goes around a blocking tree instead of pointing through it',()=>{
 try{
  configureWorld(161803);const snap=captureWorldSnapshot();assert.ok(snap);
  const tiles=snap.tiles.village.split('');tiles[16*WORLD_W+5]='t';snap.tiles.village=tiles.join('');
  configureWorld(161803,snap);
  assert.equal(terrain('village',5,16),'tree');
  const cue=storyGuidance(story(),pose('village',4,16));
  assert.notDeepEqual(cue.waypoint,{x:5,y:16});
  assert.ok(cue.distance>4);
  walk('village',story());
 }finally{configureWorld(0);}
});
test('route cache invalidates when the same seed loads an altered snapshot',()=>{
 try{
  configureWorld(81623);
  const old=storyGuidance(story(),pose('village',4,16));
  const revision=getWorldRevision();
  const snap=captureWorldSnapshot();assert.ok(snap);assert.ok(old.waypoint);
  const tiles=snap.tiles.village.split('');
  tiles[old.waypoint.y*WORLD_W+old.waypoint.x]='t';
  snap.tiles.village=tiles.join('');
  configureWorld(81623,snap);
  assert.ok(getWorldRevision()>revision);
  const fresh=storyGuidance(story(),pose('village',4,16));
  assert.notDeepEqual(fresh.waypoint,old.waypoint);
 }finally{configureWorld(0);}
});
test('non-navigable story states do not invent waypoints',()=>{
 const s=story(['archivist','zone-forest','zone-sanctuary','arken-vow-restored'],true,true);
 assert.ok(!storyGuidance(s,pose('village',4,16)).waypoint);
 assert.ok(!storyGuidance(story(),{...pose('village',4,16),inDungeon:true}).waypoint);
});
