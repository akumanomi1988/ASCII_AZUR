import {unlockedMoves} from '../../dist/creatures/loadout.js';
import assert from 'node:assert/strict';
import {mount} from './game-runtime.mjs';
import {dungeonTilePath} from './dungeon-path.mjs';
import {MOVES,damage,maxHp} from '../../dist/domain.js';
import {suggestBattleAction} from '../../dist/combat/planning.js';
import {recoveryCastsLeft,attackWithStatuses} from '../../dist/combat/tactics.js';
/** Physical, new-game-to-finale command driver; never grants wins, XP or resources. */
export function runCampaign({starter,seed,marsh='keep',ending='remember',policy='offense'}){
  let {game,dom,storage,flushTimers,world}=mount({virtualTime:true,seed:seed^0x5A5AA5A5});
  dom.set('worldSeedInput',{value:String(seed)});
  game.startNew();game.pickStarter(starter);
  let battles=0,caught=0,actions=0,heals=0;
  const prepareBuild=()=>{
   for(const creature of [...game.save.team]){
    const known=unlockedMoves(creature),attacks=known.filter(id=>MOVES[id]?.power>0).sort((a,b)=>MOVES[b].power-MOVES[a].power);
    const choices=[attacks[0],attacks.find(id=>MOVES[id].role==='drain'),policy==='tactical'?known.find(id=>MOVES[id].role==='heal'):undefined,'pulse',...attacks].filter(Boolean);
    const desired=[...new Set(choices)].slice(0,4);
    // Use exactly the production loadout command, with its learned-level and battle gates.
    for(const [index,id] of desired.entries()){
     const current=game.save.team.find(c=>c.uid===creature.uid);
     if(current.moves.includes(id))continue;
     assert.equal(game.activateTechnique(creature.uid,Math.min(index,current.moves.length),id),true,'legitimate build activation failed');
    }
   }
  };
  const settle=()=>{while(game.dialogOpen)game.nextDialog();if(game.evolution){game.seconds=game.evolution.startedAt+game.evolution.duration+.4;game.loop(1000);}};
  const saveReload=(label)=>{
   settle();
   const raw=storage.getItem('ascii-azur-save-v1');assert.ok(raw,label+' missing save');
   const before=JSON.parse(raw);
   const reread=mount({virtualTime:true,seed:seed^0xA5A55A5A,priorSave:raw});
   reread.game.continueGame();reread.flushTimers();
   assert.equal(reread.game.save.version,1,label+' format changed');
   assert.deepEqual(JSON.parse(JSON.stringify(reread.game.save.flags)),before.flags,label+' progression flags lost');
   assert.deepEqual(JSON.parse(JSON.stringify(reread.game.save.team)),before.team,label+' creatures tampered');
   assert.equal(reread.game.save.worldSeed,seed,label+' seed changed');
   assert.deepEqual(JSON.parse(JSON.stringify(reread.game.save.journey)),before.journey,label+' metrics changed');
   assert.deepEqual(JSON.parse(JSON.stringify(reread.game.save.relics??{})),before.relics??{},label+' relic inventory changed');
   ({game,dom,storage,flushTimers,world}=reread);
   settle();
  };
  const doBattle=(bind=false)=>{
   let steps=0,initialSize=game.save.team.length;
   while(game.battle&&steps++<110){
    const battle=game.battle,ally=game.getAlly();
    if(battle.busy){flushTimers();continue;}
    if(policy==='tactical'&&!bind){
     const choice=suggestBattleAction(ally,battle.enemy,game.statuses(ally),game.statuses(battle.enemy),game.save.inventory.tonics,battle.chargeStage,battle.bossPhase,recoveryCastsLeft(battle.recoveryUses,ally.uid));
     if(choice.kind==='guard')game.defend();else if(choice.kind==='tonic')game.tonic();else game.useMove(choice.moveId);
     actions++;flushTimers();continue;
    }
    if(battle.chargeStage===2){game.defend();actions++;flushTimers();continue;}
    if(game.save.inventory.tonics>0&&ally.hp<maxHp(ally)*(bind?.26:.37)){
     game.tonic();actions++;flushTimers();continue;
    }
    if(bind&&game.save.inventory.seals>0&&battle.enemy.hp/maxHp(battle.enemy)<.45){
     game.capture();actions++;flushTimers();continue;
    }
    const attacks=ally.moves.filter(m=>MOVES[m]?.power>0);
    const safe=attacks.filter(id=>attackWithStatuses(ally,battle.enemy,MOVES[id],game.statuses(ally),game.statuses(battle.enemy),1.09).value+4<battle.enemy.hp);
    if(bind&&!safe.length&&game.save.inventory.seals>0){game.capture();actions++;flushTimers();continue;}
    const ids=(bind&&safe.length?safe:attacks).sort((a,b)=>damage(ally,battle.enemy,MOVES[b]).value-damage(ally,battle.enemy,MOVES[a]).value);
    assert.ok(ids.length,'no moves '+starter);
    game.useMove(ids[0]);actions++;flushTimers();
   }
   assert.ok(steps<110,'battle softlock '+starter+'/'+seed);
   settle();battles++;
   const newCapture=game.save.team.length>initialSize;if(newCapture)caught++;
   return newCapture;
  };
  // Traverse each real overworld route by the player's analogue movement, not
  // by teleporting between NPCs, roaming battles, rest sites or world portals.
  // Walkable waypoints avoid physical NPC collider footprints.
  const approach=(target)=>{
   settle();
   const zone=game.save.zone,from={x:Math.round(game.save.x),y:Math.round(game.save.y)};
   const {ZONES,canOccupy,sweepMove,WORLD_W,WORLD_H}=world;
   const key=(x,y)=>y*WORLD_W+x;
   const goal=(x,y)=>Math.hypot(x-target.x,y-target.y)<=1.5;
   const queue=[from],previous=new Map([[key(from.x,from.y),null]]);
   let finish=null;
   for(let i=0;i<queue.length;i++){
    const cur=queue[i];if(goal(cur.x,cur.y)&&canOccupy(zone,cur.x,cur.y,.19)){finish=cur;break;}
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const x=cur.x+dx,y=cur.y+dy,k=key(x,y);
     if(x<1||y<2||x>=WORLD_W-1||y>=WORLD_H-2||previous.has(k)||!canOccupy(zone,x,y,.19))continue;
     let probe={x:cur.x,y:cur.y};for(let frame=0;frame<5;frame++)probe=sweepMove(zone,probe.x,probe.y,dx*.2,dy*.2,.19);
     if(Math.hypot(probe.x-x,probe.y-y)>.045)continue;
     previous.set(k,cur);queue.push({x,y});
    }
   }
   assert.ok(finish,'no player-accessible path to '+target.label+' '+zone+'/'+seed);
   const path=[];for(let cur=finish;cur;cur=previous.get(key(cur.x,cur.y)))path.push(cur);
   path.reverse();
   let moved=0;
   for(const point of path.slice(1)){
    const before={x:game.save.x,y:game.save.y},dx=point.x-Math.round(game.save.x),dy=point.y-Math.round(game.save.y);
    assert.equal(Math.abs(dx)+Math.abs(dy),1,'surface route must move 1 tile at a time');
    let prediction={...before};
    for(let frame=0;frame<5;frame++)prediction=sweepMove(zone,prediction.x,prediction.y,dx*.2,dy*.2,.19);
    game.stick.x=dx;game.stick.y=dy;
    const frames=[];
    for(let frame=0;frame<5;frame++){
     game.move(1/(4.35*5));moved++;
     frames.push([game.save.x,game.save.y,game.stick.x,game.stick.y]);
     if(game.battle){doBattle();assert.equal(game.save.zone,zone,'random battle lost exploration position');game.stick.x=dx;game.stick.y=dy;}
    }
    assert.ok(Math.hypot(game.save.x-point.x,game.save.y-point.y)<.085,
     'physical surface route blocked: '+JSON.stringify({zone,seed,from:before,expected:point,actual:{x:game.save.x,y:game.save.y},prediction,frames,keys:[...game.keys],pad:game.padStick,landmarks:ZONES[zone].landmarks.map(l=>[l.kind,l.x,l.y])}));
   }
   game.resetJoystick();settle();
   assert.ok(Math.hypot(game.save.x-target.x,game.save.y-target.y)<=1.65,
    'physical interaction out of reach: '+target.label);
   return moved;
  };
  const site=(kind,npcId)=>{
   const item=world.ZONES[game.save.zone].landmarks.find(l=>l.kind===kind&&(npcId===undefined||l.npcId===npcId));
   assert.ok(item,'missing authored site '+kind+'/'+npcId);
   approach(item);return item;
  };
  const visitNpc=id=>{game.interactLandmark(site('npc',id));settle();};
  const heal=()=>{settle();prepareBuild();game.interactLandmark(site('altar'));heals++;if(game.modalOpen&&typeof dom.get('bondWard').onclick==='function'){dom.get('bondWard').onclick();settle();}};
  const portal=x=>{settle();const p=world.ZONES[game.save.zone].landmarks.find(l=>l.kind==='portal'&&(x<10?l.x<10:l.x>20));assert.ok(p);approach(p);game.interactLandmark(p);settle();};
  const witness=e=>{approach({...e,label:e.id});game.interact();assert.equal(game.battle?.enemy.speciesId,e.speciesId,'visible roaming encounter skipped');doBattle(game.save.team.length<3);assert.ok(game.save.flags.includes('roamer-'+e.id),'witness not resolved');};
  settle();visitNpc('archivist');
  if(policy==='tactical'){
   game.interactNpc('merchant');settle();game.openShop();
   assert.equal(game.claimRelicGift(),true,'first free relic must be claimable');
   assert.equal(game.equipRelic(game.save.team[0].uid,'pilgrim-ward'),true,'earned relic equip failed');game.hideModal();
  }
  // Legitimately recruit at least one companion from ordinary wild duels.
  for(const id of starter==='cindrel'?['mireling','briarling']:['cindrel','briarling']){
   let found=false;
   for(let attempt=0;attempt<4&&!found;attempt++){
    if(game.save.inventory.seals<2&&game.economy.echoes>=18){visitNpc('merchant');game.purchaseItem('seals');game.hideModal();}
    heal();game.startBattle(id,id==='mireling'?5:3,'wild');found=doBattle(true);
   }
  }
  assert.ok(caught>=1,starter+' '+seed+' no earned capture');
  for(const [species,level] of [['cindrel',3],['briarling',4],['mireling',5]]){
   heal();game.startBattle(species,level,'wild');doBattle();
  }
  visitNpc('scout');
  heal();portal(43);assert.equal(game.save.zone,'forest');
  for(const event of game.roamers()){heal();witness(event);}
  portal(43);assert.equal(game.save.zone,'sanctuary');
  for(const event of game.roamers()){heal();witness(event);}
  visitNpc('keeper');heal();
  game.interactLandmark(site('guardian'));
  assert.equal(game.modalOpen,true,'earned Guardian preflight');
  dom.get('guardianProceed').onclick();assert.equal(game.battle.enemy.speciesId,'hollowhart');
  doBattle();assert.ok(game.save.defeatedBoss,'Hollowhart won by the party');
  portal(2);portal(2);assert.equal(game.save.zone,'village');
  heal();game.enterDungeon(false);assert.ok(game.save.dungeon?.active);
  // Spatial dungeon movement, not injected cleared events.
  const walkCrypt=event=>{
   const d=game.save.dungeon;
   const path=dungeonTilePath(d,{x:d.x,y:d.y},event);
   for(const next of path.slice(1)){
    const prev=game.save.dungeon,dx=next.x-prev.x,dy=next.y-prev.y;
    game.stick.x=Math.abs(dx)<.05?0:Math.sign(dx);game.stick.y=Math.abs(dy)<.05?0:Math.sign(dy);
    for(let k=0;k<5;k++)game.move(1/(4.35*5));
    assert.ok(Math.hypot(game.save.dungeon.x-next.x,game.save.dungeon.y-next.y)<.05,'physical crypt route blocked');
   }game.resetJoystick();
  };
  for(const eventId of [1,2,3,4,5,7]){
   const event=game.save.dungeon.events[eventId];walkCrypt(event);game.dungeonInteract();
   if(game.battle)doBattle();
   settle();
  }
  assert.ok(game.save.dungeon.finished,'crypt was not completed by ordinary movement');
  walkCrypt(game.save.dungeon.events[0]);game.dungeonInteract();
  visitNpc('archivist');
  assert.ok(game.save.flags.includes('arken-vow-restored'),'Chapter I conclusion missing');
  saveReload('Arken');
  portal(43);portal(43);portal(43);
  assert.equal(game.save.zone,'marsh','unlocked Marsh portal');
  visitNpc('nael');
  for(const npcId of ['bell','lantern']){game.interactLandmark(site('memory',npcId));settle();}
  for(const event of game.roamers()){heal();witness(event);}
  game.interactLandmark(site('verdict'));
  assert.ok(game.modalOpen,'Marsh moral fork missing');game.chooseMarsh(marsh);settle();
  visitNpc('nael');
  assert.ok(game.save.flags.includes('marsh-chapter-complete'),'Chapter II conclusion missing');
  saveReload('Marsh');
  portal(43);assert.equal(game.save.zone,'spire','unlocked Crown');
  visitNpc('oriel');
  for(const npcId of ['flame','archive']){game.interactLandmark(site('memory',npcId));settle();}
  for(const event of game.roamers()){heal();witness(event);}
  heal();game.interactLandmark(site('guardian'));
  assert.ok(game.modalOpen,'legitimate Nullscribe preflight missing');
  dom.get('crownProceed').onclick();assert.equal(game.battle.enemy.speciesId,'nullscribe');
  doBattle();assert.ok(game.save.flags.includes('crown-nullscribe-fallen'),'final boss missing '+JSON.stringify({starter,seed,policy,team:game.save.team,fallen:game.save.fallen,metrics:game.save.journey}));
  game.interactLandmark(site('verdict'));
  assert.ok(game.modalOpen,'final verdict missing');
  game.chooseCrown(ending);settle();visitNpc('oriel');
  assert.ok(game.save.flags.includes('crown-trilogy-complete'),'final outcome missing');
  assert.ok(game.save.flags.includes('marsh-choice-'+marsh));
  assert.ok(game.save.flags.includes('crown-choice-'+ending));
  const finalE=game.economy.echoes;saveReload('Final');
  visitNpc('oriel');assert.equal(game.economy.echoes,finalE,'duplicated completion reward');
  return {starter,marsh,ending,policy,world:seed,captured:caught,battles,actions,heals,level:game.save.team[0].level,
    metrics:JSON.parse(JSON.stringify(game.save.journey)),equipment:game.save.team.map(c=>c.equipment??null),echoes:game.economy.echoes,inventory:{...game.save.inventory}};
}
