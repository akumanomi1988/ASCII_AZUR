import test from 'node:test';
import assert from 'node:assert/strict';
import {configureWorld,captureWorldSnapshot,validateWorldSnapshot,ZONE_IDS,ZONES,WORLD_W,WORLD_H,canOccupy,sweepMove} from '../dist/world.js';
import {visibleEncounters} from '../dist/world/encounters.js';
import {walkableRouteToTarget,guidanceToTarget} from '../dist/story-navigation.js';

const toPoint=site=>({x:site.x,y:site.y,label:site.label||site.id||'Encounter'});
const position=(zone,x,y)=>({zone,x,y,inDungeon:false});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function checkRoute(seed,zone,start,target,physical){
 const path=walkableRouteToTarget(position(zone,start.x,start.y),target);
 assert.ok(path,'No route: '+JSON.stringify({seed,zone,start,target}));
 assert.ok(path.length<=WORLD_W*WORLD_H,'Route cycle '+seed+'/'+zone);
 assert.deepEqual(path[0],start,'Route must begin at the real player spawn '+seed+'/'+zone);
 const end=path.at(-1);
 assert.ok(distance(end,target)<=1.65,'Route stops outside interaction range '+seed+'/'+zone);
 const cue=guidanceToTarget(position(zone,start.x,start.y),target);
 assert.notEqual(cue.kind,'menu','Compass declared a blocked route '+seed+'/'+zone);
 assert.equal(guidanceToTarget(position(zone,end.x,end.y),target).kind,'interaction',
  'Last route cell cannot interact '+seed+'/'+zone);
 for(let i=0;i<path.length;i++){
  const cell=path[i];
  assert.ok(canOccupy(zone,cell.x,cell.y,.19),'Waypoint collides '+seed+'/'+zone+'/'+i);
  if(i)assert.equal(Math.abs(cell.x-path[i-1].x)+Math.abs(cell.y-path[i-1].y),1,
   'Route jumped between nonadjacent tiles '+seed+'/'+zone+'/'+i);
 }
 if(!physical)return;
 let player={...path[0]};
 for(let i=1;i<path.length;i++){
  const next=path[i],dx=next.x-path[i-1].x,dy=next.y-path[i-1].y;
  for(let frame=0;frame<5;frame++)player=sweepMove(zone,player.x,player.y,dx*.2,dy*.2,.19);
  assert.ok(distance(player,next)<.045,
   'Swept player collision blocked a planned route '+JSON.stringify({seed,zone,step:i,next,player,target}));
 }
 assert.ok(distance(player,target)<=1.65,'Physically reached cell cannot interact '+seed+'/'+zone);
}

test('W4: 200 persisted seeds expose traversable routes to all seven-region landmarks and roaming witnesses',{timeout:240000},()=>{
 let routes=0,physicalRoutes=0,landmarks=0,encounters=0,snapshots=0;
 for(let seed=1;seed<=200;seed++){
  configureWorld(seed);
  const snapshot=captureWorldSnapshot();
  assert.ok(validateWorldSnapshot(snapshot),'Invalid persisted topology seed '+seed);
  const expected=Object.fromEntries(ZONE_IDS.map(zone=>[zone,ZONES[zone].landmarks.map(l=>[l.x,l.y])]));
  for(const zone of ZONE_IDS){
   const targets=[...ZONES[zone].landmarks.map(toPoint),...visibleEncounters(zone,seed).map(toPoint)];
   landmarks+=ZONES[zone].landmarks.length;
   encounters+=targets.length-ZONES[zone].landmarks.length;
   const starts=[{x:4,y:16}];
   if(seed<=24||seed===200)starts.push({x:40,y:16});
   for(const start of starts){
    assert.ok(canOccupy(zone,start.x,start.y,.19),'Spawn blocked '+seed+'/'+zone+'/'+JSON.stringify(start));
    for(const target of targets){
     const physical=seed<=12||seed===200;
     checkRoute(seed,zone,start,target,physical);
     routes++;if(physical)physicalRoutes++;
    }
   }
  }
  // Restored snapshots must preserve both the terrain and navigable points of interest.
  configureWorld(seed,snapshot);
  assert.deepEqual(captureWorldSnapshot(),snapshot,'Saved topology changed on load '+seed);
  for(const zone of ZONE_IDS){
   assert.deepEqual(ZONES[zone].landmarks.map(l=>[l.x,l.y]),expected[zone],
    'Saved landmark moved '+seed+'/'+zone);
   checkRoute(seed,zone,{x:4,y:16},toPoint(ZONES[zone].landmarks[0]),false);
  }
  snapshots++;
 }
 assert.equal(snapshots,200);
 assert.ok(routes>9000,'W4 sample is too narrow: '+routes);
 assert.ok(physicalRoutes>500,'W4 physical traversal sample is too narrow: '+physicalRoutes);
 console.log('W4_TRAVERSAL_QA '+JSON.stringify({savedSeeds:snapshots,regions:ZONE_IDS.length,landmarks,encounters,reachableRoutes:routes,physicallySweptRoutes:physicalRoutes}));
});

test('Atlas walking route rejects dungeon use and never changes a saved world',()=>{
 configureWorld(0xA2A260);
 const before=captureWorldSnapshot();
 const target=ZONES.forest.landmarks.find(l=>l.kind==='portal'&&l.x>20);
 assert.ok(target);
 assert.equal(walkableRouteToTarget(position('forest',4,16),target)?.length>0,true);
 assert.equal(walkableRouteToTarget({zone:'forest',x:4,y:16,inDungeon:true},target),null);
 assert.deepEqual(captureWorldSnapshot(),before);
});
