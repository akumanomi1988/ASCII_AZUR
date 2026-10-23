import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {dungeonTilePath} from './helpers/dungeon-path.mjs';
import {ZONES,canOccupy,sweepMove,WORLD_W,WORLD_H} from '../dist/world.js';
import {damage, MOVES, maxHp} from '../dist/domain.js';
import {createCreature as createCharacter} from '../dist/domain.js';
import {generateDungeon as makeCrypt} from '../dist/dungeons/labyrinth.js';
const fakeContext={
 clearRect(){},fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},translate(){},scale(){},save(){},restore(){},ellipse(){},quadraticCurveTo(){},setTransform(){},rotate(){},arc(){},rect(){},strokeRect(){},putImageData(){},drawImage(){},
 createLinearGradient(){return{addColorStop(){}}},createRadialGradient(){return{addColorStop(){}}},
 getImageData(){return{data:new Uint8ClampedArray(960*540*4)}}
};
function mount({virtualTime=false,seed=1,priorSave=null}={}){
 const dom=new Map(),store=new Map(),timers=[];
 if(priorSave!==null)store.set('ascii-azur-save-v1',priorSave);
 let nextTimerId=0, clock=0, randomSeed=seed>>>0;
 const randomMath=Object.create(Math);
 randomMath.random=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;};
 const virtualSetTimeout=(callback,delay=0)=>{
  const entry={id:++nextTimerId,callback,at:clock+(Number(delay)||0),cancelled:false};
  timers.push(entry);return entry.id;
 };
 const virtualClearTimeout=(id)=>{for(const t of timers)if(t.id===id)t.cancelled=true;};
 const flushTimers=(limit=50)=>{
  for(let steps=0;steps<limit;steps++){
   const next=timers.filter(t=>!t.cancelled).sort((a,b)=>a.at-b.at||a.id-b.id)[0];
   if(!next){timers.length=0;return;}
   timers.splice(timers.indexOf(next),1);clock=next.at;next.callback();
  }
  if(timers.some(t=>!t.cancelled))throw new Error('Unbounded queued callbacks');
 };
 const make=(id='')=>{
  const classes=new Set(['hidden']);
  return {id,style:{},dataset:{},hidden:false,innerHTML:'',textContent:'',classList:{add:(x)=>classes.add(x),remove:(x)=>classes.delete(x),contains:(x)=>classes.has(x),toggle:(x,on)=>{if(on===undefined? !classes.has(x):on){classes.add(x);return true;}classes.delete(x);return false;}},
    addEventListener(){},attributes:{},children:[],setAttribute(k,v){this.attributes[k]=v},getAttribute(k){return this.attributes[k]||''},replaceWith(){},replaceChildren(...xs){this.children=xs},appendChild(x){this.children.push(x)},append(...xs){this.children.push(...xs)},after(){},closest(){return make('sidebar')},
    querySelector(){return null},querySelectorAll(){return[]},getBoundingClientRect(){return{left:0,top:0,width:960,height:540}},
    getContext:(mode)=>mode==='2d'?fakeContext:null,
    set width(x){this._w=x},get width(){return this._w||960},set height(x){this._h=x},get height(){return this._h||540}
  };
 };
 const doc={getElementById:(id)=>{if(!dom.has(id))dom.set(id,make(id));return dom.get(id)},createElement:(name)=>make(name),addEventListener(){},querySelectorAll(){return[]}};
 const win={devicePixelRatio:1,addEventListener(){},setTimeout:virtualTime?virtualSetTimeout:setTimeout};
 const storage={setItem:(k,v)=>store.set(k,v),getItem:(k)=>store.get(k)||null};
 const html=fs.readFileSync(new URL('../play.html',import.meta.url),'utf8');
 const source=html.split('<script>\n').at(-1).split('\n</script>')[0].replace(/new AzurGame\(\);\s*$/, 'globalThis.GAME = new AzurGame();');
 const sandbox={document:doc,window:win,localStorage:storage,navigator:{},performance,console,AudioContext:class{constructor(){throw new Error('audio unavailable')}},ImageData:class{constructor(width,height){this.width=width;this.height=height;this.data=new Uint8ClampedArray(width*height*4)}},requestAnimationFrame(){},setTimeout:virtualTime?virtualSetTimeout:setTimeout,clearTimeout:virtualTime?virtualClearTimeout:clearTimeout,Math:virtualTime?randomMath:Math};
 vm.runInNewContext(source,sandbox,{timeout:5000});
 return{game:sandbox.GAME,dom,storage,flushTimers};
}
test('runtime: start a game, select creature, dismiss story, save',()=>{
 const {game,dom,storage}=mount();
 game.startNew();assert.equal(dom.get('starterScreen').classList.contains('hidden'),false);
 game.pickStarter('cindrel');assert.equal(game.save.team.length,1);assert.equal(game.save.team[0].speciesId,'cindrel');
 assert.equal(dom.get('dialogue').classList.contains('hidden'),false);
 for(let i=0;i<26;i++)game.nextDialog();
 assert.equal(game.dialogOpen,false);
 assert.ok(storage.getItem('ascii-azur-save-v1'));
 assert.equal(dom.get('zoneName').textContent,'Velo de Arken');
});
test('runtime: visit new zone, find treasure, launch boss and complete quest',()=>{
 const {game}=mount();game.startNew();game.pickStarter('velaria');for(let i=0;i<26;i++)game.nextDialog();
 game.interactLandmark({x:43,y:16,kind:'portal',label:'Bosque'});
 assert.equal(game.save.zone,'forest');
 game.interactLandmark({x:35,y:10,kind:'chest',label:'Cofre'});
 assert.equal(game.save.inventory.seals,8);
 game.nextDialog();
 game.interactLandmark({x:43,y:16,kind:'portal',label:'Santuario'});
 assert.equal(game.save.zone,'sanctuary');
 game.startBattle('hollowhart',12,'boss');assert.equal(game.battle.type,'boss');
 game.winBattle();assert.equal(game.save.defeatedBoss,true);assert.equal(game.battle,null);
 assert.equal(game.dialogOpen,true);
});

test('runtime: right drawer opens and closes without moving UI out of viewport',()=>{
 const {game,dom}=mount();game.toggleDrawer(true);
 assert.equal(dom.get('gameDrawer').classList.contains('open'),true);
 game.toggleDrawer(false);assert.equal(dom.get('gameDrawer').classList.contains('open'),false);
});
test('runtime: analogue joystick movement and stop at release',()=>{
 const {game}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<26;i++)game.nextDialog();
 const beforeX=game.save.x;game.stick.x=1;game.stick.y=0;game.move(.1);
 assert.ok(game.save.x>beforeX,'horizontal movement should respond to analog input');
 game.resetJoystick();assert.equal(game.stick.x,0);assert.equal(game.stick.y,0);
});
test('runtime: guard is consumed by next enemy turn and reduces damage',()=>{
 const {game}=mount();game.startNew();game.pickStarter('thorne');for(let i=0;i<26;i++)game.nextDialog();
 game.startBattle('cindrel',4,'wild');
 const hp=game.getAlly().hp;game.defend();assert.equal(game.battle.guarding,true);assert.equal(game.battle.busy,true);
 game.enemyTurn();assert.equal(game.battle.guarding,false);assert.equal(game.battle.busy,false);
 assert.ok(game.getAlly().hp<hp);assert.ok(hp-game.getAlly().hp<=15);
});
test('runtime: switching allows deliberate selection of the second available creature',()=>{
 const {game}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<26;i++)game.nextDialog();
 const c={...game.save.team[0],uid:'alt',speciesId:'velaria',hp:27};game.save.team.push(c);
 game.startBattle('wispawn',4,'wild');
 game.switchCreature();assert.equal(game.battle.selecting,true);
 game.switchTo(1);assert.equal(game.battle.ally,1);assert.equal(game.battle.selecting,false);
 assert.equal(game.getAlly().speciesId,'velaria');
});
test('runtime: boss enters phase II and warns before charged attack',()=>{
 const {game,dom}=mount();game.startNew();game.pickStarter('thorne');for(let i=0;i<26;i++)game.nextDialog();
 game.startBattle('hollowhart',12,'boss');
 game.battle.enemy.hp=25;
 game.useMove('thorn');
 assert.equal(game.battle.bossPhase,2);assert.equal(game.battle.chargeStage,1);
 assert.match(dom.get('enemyLv').textContent,/II/);
 game.enemyTurn();assert.equal(game.battle.chargeStage,2);assert.equal(game.battle.busy,false);
 assert.match(game.battle.log,/GUARDIA/);
 game.battle.guarding=true;game.enemyTurn();assert.equal(game.battle.chargeStage,0);assert.equal(game.battle.guarding,false);
});

test('runtime: physically enter dungeon, claim chest once, return without reshuffling map',()=>{
 const {game,storage}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<26;i++)game.nextDialog();
 game.enterDungeon(false);
 assert.equal(game.save.dungeon.active,true);
 const snapshot=game.save.dungeon.tiles,origin={...game.save.dungeon.events[0]};
 const chest=game.save.dungeon.events.find(e=>e.kind==='cache');
 game.save.dungeon.x=chest.x;game.save.dungeon.y=chest.y;
 const before=game.economy.echoes;
 game.dungeonInteract();assert.ok(game.save.dungeon.cleared.includes(chest.id));
 assert.equal(game.economy.echoes,before+40);
 game.nextDialog();game.dungeonInteract();assert.equal(game.economy.echoes,before+40);
 game.save.dungeon.x=origin.x;game.save.dungeon.y=origin.y;game.dungeonInteract();
 assert.equal(game.save.dungeon.active,false);
 game.enterDungeon(false);assert.equal(game.save.dungeon.tiles,snapshot);
 assert.ok(game.save.dungeon.cleared.includes(chest.id));
 assert.ok(storage.getItem('ascii-azur-save-v1'));
});

test('runtime: sentinel battle escape keeps pending and victory clears event exactly once',()=>{
 const {game}=mount();game.startNew();game.pickStarter('velaria');for(let i=0;i<26;i++)game.nextDialog();
 game.enterDungeon(false);
 const enemy=game.save.dungeon.events.find(e=>e.kind==='enemy');
 game.save.dungeon.x=enemy.x;game.save.dungeon.y=enemy.y;
 game.dungeonInteract();assert.equal(game.battle.type,'wild');
 assert.equal(game.save.dungeon.pending,enemy.id);
 game.finishBattle();game.dungeonInteract();assert.equal(game.battle.type,'wild');
 game.battle.enemy.hp=0;game.winBattle();
 assert.equal(game.save.dungeon.pending,null);
 assert.ok(game.save.dungeon.cleared.includes(enemy.id));
 game.dungeonInteract();assert.equal(game.battle,null);
});
test('runtime: entering the crypt shows the active chamber and three story seals',()=>{
 const {game,dom}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<26;i++)game.nextDialog();
 game.enterDungeon(false);
 assert.equal(game.save.dungeon?.active,true);
 assert.ok(dom.get('zoneSubtitle').textContent.includes('SELLOS 0/3'));
 const before=game.save.dungeon.tiles;
 game.stick.x=1;game.move(.1);
 assert.equal(game.save.dungeon.tiles,before,'visual changes must not regenerate dungeon');
 assert.ok(dom.get('zoneSubtitle').textContent.includes('SELLOS'));
});

test('runtime: main quest provides guided stages and concludes once when Archivist hears both relics',()=>{
 const {game,dom,storage}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<26;i++)game.nextDialog();
 assert.match(dom.get('missionChip').textContent,/ARCHIVISTA/);
 game.interactNpc('archivist');for(let i=0;i<26;i++)game.nextDialog();
 assert.match(dom.get('missionChip').textContent,/BOSQUE/);
 game.interactLandmark({x:43,y:16,kind:'portal',label:'Bosque'});
 game.interactLandmark({x:43,y:16,kind:'portal',label:'Santuario'});
 assert.match(dom.get('missionChip').textContent,/HOLLOWHART/);
 game.startBattle('hollowhart',12,'boss');game.winBattle();for(let i=0;i<26;i++)game.nextDialog();
 assert.match(dom.get('missionChip').textContent,/CRIPTA/);
 game.save.zone='village';game.enterDungeon(false);
 // Sentinel and inscription clearance is validated in existing dungeon tests.
 game.save.dungeon.cleared=[2,3,5];const exit=game.save.dungeon.events.find(e=>e.kind==='exit');
 game.save.dungeon.x=exit.x;game.save.dungeon.y=exit.y;game.dungeonInteract();game.nextDialog();
 assert.equal(game.save.dungeon.finished,true);assert.match(dom.get('missionChip').textContent,/ARCHIVISTA/);
 game.save.dungeon.active=false;const before=game.economy.echoes,seals=game.save.inventory.seals;
 game.interactNpc('archivist');assert.equal(game.save.flags.filter(f=>f==='arken-vow-restored').length,1);
 assert.equal(game.economy.echoes,before+200);assert.equal(game.save.inventory.seals,seals+4);
 assert.match(dom.get('missionChip').textContent,/MARISMAS/,'completed Arken now unlocks the next chapter');
 for(let i=0;i<26;i++)game.nextDialog();
 game.interactNpc('archivist');assert.equal(game.economy.echoes,before+200);
 assert.equal(game.save.flags.filter(f=>f==='arken-vow-restored').length,1);
 assert.ok(storage.getItem('ascii-azur-save-v1'));
});
test('runtime: talking to the Archivist before clearing the crypt cannot award ending',()=>{
 const {game,dom}=mount();game.startNew();game.pickStarter('thorne');for(let i=0;i<26;i++)game.nextDialog();
 game.interactNpc('archivist');for(let i=0;i<26;i++)game.nextDialog();
 game.interactLandmark({x:43,y:16,kind:'portal',label:'Bosque'});
 game.interactLandmark({x:43,y:16,kind:'portal',label:'Santuario'});
 game.startBattle('hollowhart',12,'boss');game.winBattle();for(let i=0;i<26;i++)game.nextDialog();
 game.save.zone='village';const before=game.economy.echoes;game.interactNpc('archivist');
 assert.equal(game.economy.echoes,before);assert.equal(game.save.flags.includes('arken-vow-restored'),false);
 assert.match(dom.get('diaText').textContent,/Cripta de los Ecos/);
});

test('runtime: story compass follows first objective, responds to portal and preserves legacy saves',()=>{
 const {game,dom,storage}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<26;i++)game.nextDialog();
 assert.match(dom.get('storyCompass').textContent,/ARCHIVISTA/);
 const previous=dom.get('storyCompass').textContent;
 game.save.x=7;game.save.y=16;game.updateStoryCompass();assert.notEqual(dom.get('storyCompass').textContent,previous);
 assert.match(dom.get('storyCompass').textContent,/ARCHIVISTA/);
 game.addFlag('archivist');assert.match(dom.get('storyCompass').textContent,/PORTAL ESTE/);
 game.interactLandmark({x:43,y:16,kind:'portal',label:'Bosque'});
 assert.match(dom.get('storyCompass').textContent,/PORTAL ESTE/);
 game.saveNow(false);const raw=JSON.parse(storage.getItem('ascii-azur-save-v1'));
 assert.equal(raw.version,1);assert.equal(Object.hasOwn(raw,'navigation'),false);
});

test('runtime: battle controls show real tactical information for touch and keyboard',()=>{
 const {game,dom}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<26;i++)game.nextDialog();
 game.startBattle('thorne',8,'wild');
 const actions=dom.get('battleActions').children;
 assert.ok(actions.length>=6);
 const first=actions.find(b=>b.classList.contains('battle-move'));
 assert.ok(first,'battle move card should exist');
 assert.equal(first.children.length,3);
 assert.match(first.children[1].textContent,/DAÑO/);
 assert.match(first.children[2].textContent,/EFICAZ/);
 assert.match(first.getAttribute('aria-label'),/daño estimado/);
 assert.equal(first.disabled,false);
});

test('runtime: capture action displays precise probability and updates with target status',()=>{
 const {game,dom}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<26;i++)game.nextDialog();
 game.startBattle('thorne',6,'wild');
 const control=()=>dom.get('battleActions').children.find(b=>b.textContent.includes('VINCULAR'));
 assert.match(control().textContent,/VINCULAR 26%/);
 assert.match(control().title,/26 %/);assert.match(control().getAttribute('aria-label'),/Consume un sello/);
 game.battle.enemy.hp=Math.floor(game.battle.enemy.hp/2);game.refreshBattle();
 const before=control().textContent;game.battle.effects[game.battle.enemy.uid]=[{kind:'weaken',remaining:2}];game.refreshBattle();
 assert.notEqual(control().textContent,before);assert.match(control().title,/8 puntos porcentuales/);
 game.battle.type='boss';game.refreshBattle();assert.equal(control().disabled,true);
});

/** Spatial campaign test: combat *victories* are resolved by the battle state machine;
 * no quest flags, dungeon cleared arrays or character positions are injected. */
test('runtime: Arken progression resolves all crypt events through actual movement, then claims the finale once',()=>{
 const {game,dom,storage}=mount();
 game.startNew();game.pickStarter('cindrel');for(let i=0;i<26;i++)game.nextDialog();
 game.interactNpc('archivist');while(game.dialogOpen)game.nextDialog();
 game.interactLandmark({kind:'portal',x:43,y:16,label:'Bosque'});
 game.interactLandmark({kind:'portal',x:43,y:16,label:'Santuario'});
 assert.equal(game.save.zone,'sanctuary');
 game.startBattle('hollowhart',12,'boss');assert.equal(game.battle.type,'boss');
 game.winBattle();while(game.dialogOpen)game.nextDialog();
 assert.equal(game.save.defeatedBoss,true);
 game.interactLandmark({kind:'portal',x:2,y:16,label:'Bosque'});
 game.interactLandmark({kind:'portal',x:2,y:16,label:'Arken'});
 assert.equal(game.save.zone,'village');
 game.enterDungeon(false);assert.equal(game.save.dungeon.active,true);
 const originalSeed=game.save.dungeon.seed;
 const walkTo=(event)=>{
   const d=game.save.dungeon;
   const path=dungeonTilePath(d,{x:d.x,y:d.y},event);
   for(const next of path.slice(1)){
     const from=game.save.dungeon;
     const dx=next.x-from.x,dy=next.y-from.y;
     game.stick.x=Math.abs(dx)<.05?0:Math.sign(dx);game.stick.y=Math.abs(dy)<.05?0:Math.sign(dy);
     for(let n=0;n<5;n++)game.move(1/(4.35*5));
     assert.ok(Math.hypot(game.save.dungeon.x-next.x,game.save.dungeon.y-next.y)<.04,
       `seed ${originalSeed}: cannot physically reach event waypoint ${next.x},${next.y}; from ${from.x.toFixed(3)},${from.y.toFixed(3)} landed ${game.save.dungeon.x.toFixed(3)},${game.save.dungeon.y.toFixed(3)}; stick ${game.stick.x},${game.stick.y}`);
   }
   game.resetJoystick();
 };
 for(const id of [2,3,5,7]) {
   const target=game.save.dungeon.events[id];walkTo(target);
   game.dungeonInteract();
   if(id===2||id===5) {
     assert.equal(game.battle?.type,'wild');
     assert.equal(game.save.dungeon.pending,id);
     // Controlled encounter outcome, not a simulated manual fight.
     game.winBattle();assert.equal(game.battle,null);
   }
   while(game.dialogOpen)game.nextDialog();
 }
 assert.equal(game.save.dungeon.finished,true);
 assert.deepEqual([2,3,5].every(id=>game.save.dungeon.cleared.includes(id)),true);
 walkTo(game.save.dungeon.events[0]);game.dungeonInteract();
 assert.equal(game.save.dungeon.active,false);
 const beforeEchoes=game.economy.echoes,beforeSeals=game.save.inventory.seals;
 game.interactNpc('archivist');while(game.dialogOpen)game.nextDialog();
 assert.equal(game.save.flags.filter(x=>x==='arken-vow-restored').length,1);
 assert.equal(game.economy.echoes,beforeEchoes+200);
 assert.equal(game.save.inventory.seals,beforeSeals+4);
 assert.match(dom.get('missionChip').textContent,/MARISMAS/,'completed Arken now unlocks the next chapter');
 game.interactNpc('archivist');while(game.dialogOpen)game.nextDialog();
 assert.equal(game.economy.echoes,beforeEchoes+200);
 assert.ok(storage.getItem('ascii-azur-save-v1'));
});

/** Execute player commands and scheduled enemy turns instead of calling winBattle().
 * This is a deterministic input-driven combat test, not a human playthrough. */
test('runtime: full Arken battles resolve using player moves, guard and tonics (no forced victories)',()=>{
 const {game,dom,storage,flushTimers}=mount({virtualTime:true,seed:17});
 game.startNew();game.pickStarter('cindrel');while(game.dialogOpen)game.nextDialog();
 game.interactNpc('archivist');while(game.dialogOpen)game.nextDialog();
 const fight=(id,level,type='wild')=>{
  game.startBattle(id,level,type);
  let turns=0;
  while(game.battle&&turns++<60){
   assert.ok(game.save.team.some(x=>x.hp>0),'party fainted in '+id+' after '+turns+' turns');
   const b=game.battle,ally=game.getAlly();
   if(b.busy){flushTimers();continue;}
   if(b.chargeStage===2){game.defend();flushTimers();continue;}
   if(game.save.inventory.tonics>0&&ally.hp<maxHp(ally)*.33){game.tonic();flushTimers();continue;}
   const move=ally.moves.filter(mid=>MOVES[mid]&&MOVES[mid].role!=='heal').sort((first,second)=>damage(ally,b.enemy,MOVES[second]).value-damage(ally,b.enemy,MOVES[first]).value)[0];
   assert.ok(move,'missing damage move');
   game.useMove(move);flushTimers();
  }
  assert.ok(turns<60,'battle has no resolution: '+id);
  assert.equal(game.battle,null,'battle outcome: '+id);
  assert.ok(game.save.team.some(x=>x.hp>0),'lost battle: '+id);
 };
 for(let i=0;i<18;i++){
  fight('briarling',3);
  game.interactLandmark({kind:'altar',x:10,y:10});
 }
 game.interactLandmark({kind:'portal',x:43,y:16,label:'Bosque'});
 game.interactLandmark({kind:'chest',x:35,y:10,label:'Cofre'});while(game.dialogOpen)game.nextDialog();
 game.interactLandmark({kind:'portal',x:43,y:16,label:'Santuario'});
 // Legitimately bind additional allies using the player's seals; never inject team members.
 for(const species of ['runeowl','gravemoth','runeowl','wispawn']){
  if(game.save.team.length>=3)break;
  game.interactLandmark({kind:'altar',x:10,y:10});
  game.startBattle(species,8,'wild');
  let attempts=0;
  while(game.battle&&attempts++<12){
   if(game.battle.busy){flushTimers();continue;}
   if(game.save.inventory.tonics>0&&game.getAlly().hp<maxHp(game.getAlly())*.3){game.tonic();flushTimers();continue;}
   if(game.save.inventory.seals){game.capture();flushTimers();}
   else {game.useMove(game.getAlly().moves[0]);flushTimers();}
  }
  assert.equal(game.battle,null);
 }
 assert.ok(game.save.team.length>=3,'party building via capture must succeed');
 // Captures may trigger a legitimate defeat/recovery dialogue on this seed.
 while(game.dialogOpen)game.nextDialog();
 game.interactLandmark({kind:'altar',x:10,y:10});
 if(game.evolution){game.seconds=game.evolution.startedAt+game.evolution.duration+.25;game.loop(1000)}
 assert.equal(game.evolution,null,'evolution animation must finish before guardian interaction');
 game.interactLandmark({kind:'guardian',x:25,y:10,label:'Hollowhart'});
 assert.equal(game.battle,null,'guardian encounter should offer preparation before combat');
 assert.match(dom.get('modalContent').innerHTML,/COMBATIR/);
 dom.get('guardianProceed').onclick();
 assert.equal(game.battle?.type,'boss');
 const bossBattle=game.battle;
 let bossTurns=0;
 while(game.battle&&bossTurns++<60){
  const b=game.battle,ally=game.getAlly();
  if(b.busy){flushTimers();continue;}
  if(b.chargeStage===2){game.defend();flushTimers();continue;}
  if(game.save.inventory.tonics>0&&ally.hp<maxHp(ally)*.33){game.tonic();flushTimers();continue;}
  const move=ally.moves.filter(mid=>MOVES[mid]&&MOVES[mid].role!=='heal').sort((a,c)=>damage(ally,b.enemy,MOVES[c]).value-damage(ally,b.enemy,MOVES[a]).value)[0];
  game.useMove(move);flushTimers();
 }
 assert.ok(bossTurns<60,'boss did not resolve through actions');
 assert.equal(game.battle,null);
 assert.equal(game.save.defeatedBoss,true, 'boss must be defeated, not a defeat/reset (team '+JSON.stringify(game.save.team.map(c=>({lvl:c.level,hp:c.hp})))+')');
 while(game.dialogOpen)game.nextDialog();
 game.interactLandmark({kind:'portal',x:2,y:16,label:'Bosque'});
 game.interactLandmark({kind:'portal',x:2,y:16,label:'Arken'});
 game.enterDungeon(false);
 const visit=event=>{
  const d=game.save.dungeon;
  for(const next of dungeonTilePath(d,{x:d.x,y:d.y},event).slice(1)){
   const current=game.save.dungeon,dx=next.x-current.x,dy=next.y-current.y;
   game.stick.x=Math.abs(dx)<.05?0:Math.sign(dx);
   game.stick.y=Math.abs(dy)<.05?0:Math.sign(dy);
   for(let step=0;step<5;step++)game.move(1/(4.35*5));
   assert.ok(Math.hypot(game.save.dungeon.x-next.x,game.save.dungeon.y-next.y)<.05,'blocked crypt cell');
  }
  game.resetJoystick();
 };
 for(const id of [2,3,5,7]){
  visit(game.save.dungeon.events[id]);game.dungeonInteract();
  if(id===2||id===5){
   assert.ok(game.battle,'sentinel combat must start');
   const b=game.battle;
   // Continue the battle through actual commands; no direct winBattle().
   let turns=0;
   while(game.battle&&turns++<60){
    if(game.battle.busy){flushTimers();continue;}
    const ally=game.getAlly();
    if(game.save.inventory.tonics>0&&ally.hp<maxHp(ally)*.33){game.tonic();flushTimers();continue;}
    const mid=ally.moves.filter(mid=>MOVES[mid]&&MOVES[mid].role!=='heal').sort((first,second)=>damage(ally,b.enemy,MOVES[second]).value-damage(ally,b.enemy,MOVES[first]).value)[0];
    game.useMove(mid);flushTimers();
   }
   assert.equal(game.battle,null,'unresolved sentinel');
   assert.ok(game.save.dungeon.cleared.includes(id),'sentinel not cleared');
  }
  while(game.dialogOpen)game.nextDialog();
 }
 assert.equal(game.save.dungeon.finished,true);
 visit(game.save.dungeon.events[0]);game.dungeonInteract();
 assert.equal(game.save.dungeon.active,false);
 game.interactNpc('archivist');while(game.dialogOpen)game.nextDialog();
 assert.ok(game.save.flags.includes('arken-vow-restored'));
 assert.ok(storage.getItem('ascii-azur-save-v1'));
});

test('runtime: Guardian warning offers retreat and accessible consent without barring entry',()=>{
 const {game,dom}=mount({virtualTime:true,seed:88});
 game.startNew();game.pickStarter('velaria');while(game.dialogOpen)game.nextDialog();
 game.interactLandmark({kind:'guardian',x:29,y:18,label:'Hollowhart'});
 assert.equal(game.battle,null);
 assert.match(dom.get('modalContent').innerHTML,/lleva al menos dos criaturas/);
 assert.match(dom.get('modalContent').innerHTML,/nivel 8/);
 assert.match(dom.get('modalContent').innerHTML,/aria-label="Iniciar combate/);
 dom.get('guardianRetreat').onclick();
 assert.equal(game.modalOpen,false);
 assert.equal(game.battle,null);
 game.interactLandmark({kind:'guardian',x:29,y:18,label:'Hollowhart'});
 dom.get('guardianProceed').onclick();
 assert.equal(game.modalOpen,false);
 assert.equal(game.battle?.type,'boss');
 assert.equal(game.battle.enemy.level,12);
});

test('runtime: a normal victory gives half XP to a captured teammate without altering a reserve',()=>{
 const {game}=mount();game.startNew();game.pickStarter('cindrel');
 while(game.dialogOpen)game.nextDialog();
 const bench={...game.save.team[0],uid:'bench-xp',speciesId:'velaria',level:5,exp:0,hp:40,moves:['fog','pulse']};
 const reserve={...bench,uid:'stored-xp'};
 game.save.team.push(bench);game.save.storage.push(reserve);
 game.startBattle('wispawn',3,'wild');game.winBattle();
 assert.equal(game.save.team[0].exp,20);
 assert.equal(game.save.team[1].exp,10);
 assert.equal(game.save.storage[0].exp,0);
 assert.equal(game.save.activeBattle,undefined);
});

test('runtime: actual attack commands award first-roamer XP once and persist the victory flag',()=>{
 const {game,flushTimers}=mount({virtualTime:true,seed:41});
 game.startNew();game.pickStarter('cindrel');while(game.dialogOpen)game.nextDialog();
 const lifetimeXP=c=>c.exp+6*c.level*(c.level-1);
 const fight=()=>{
  game.startBattle('briarling',5,'wild','forest-0');
  let turns=0;
  while(game.battle&&turns++<30){
   if(game.battle.busy){flushTimers();continue;}
   if(game.getAlly().hp<maxHp(game.getAlly())*.33&&game.save.inventory.tonics){
    game.tonic();flushTimers();continue;
   }
   game.useMove('ember');flushTimers();
  }
  assert.ok(turns<30,'encounter did not resolve');
  assert.equal(game.battle,null);
  assert.ok(game.save.team[0].hp>0,'starter must win through actual moves');
 };
 const before=lifetimeXP(game.save.team[0]);
 fight();
 assert.equal(lifetimeXP(game.save.team[0])-before,74,'26 base + 48 first-trail XP');
 assert.ok(game.save.flags.includes('roamer-forest-0'),'first victory must be persistent');
 game.interactLandmark({kind:'altar',x:10,y:10});
 const after=lifetimeXP(game.save.team[0]);
 // Re-enter via internal test harness to verify duplicate rewards are impossible.
 fight();
 assert.equal(lifetimeXP(game.save.team[0])-after,26,'no second trail bonus');
 assert.equal(game.save.flags.filter(x=>x==='roamer-forest-0').length,1);
});

test('runtime: first trail victory restores party and persists recovery exactly once; random fights never do',()=>{
 const {game,storage}=mount();game.startNew();game.pickStarter('cindrel');while(game.dialogOpen)game.nextDialog();
 const partner={...game.save.team[0],uid:'trail-partner',speciesId:'velaria',hp:1};
 const unconscious={...game.save.team[0],uid:'fainted-trail',speciesId:'thorne',hp:0};
 game.save.team[0].hp=2;game.save.team.push(partner,unconscious);
 game.startBattle('briarling',5,'wild','forest-0');game.winBattle();
 assert.ok(game.save.team[0].hp>2,'first trail win must restore active ally');
 assert.ok(game.save.team[1].hp>1,'first trail win must restore living companion');
 assert.equal(game.save.team[2].hp,0,'respite must not revive');
 assert.ok(game.save.flags.includes('roamer-forest-0'));
 assert.ok(JSON.parse(storage.getItem('ascii-azur-save-v1')).team[0].hp>2,'recovery must survive reload');
 game.save.team[0].hp=2;
 game.startBattle('briarling',5,'wild','forest-0');game.winBattle();
 assert.equal(game.save.team[0].hp,2,'repeated encounters cannot restore HP');
 game.startBattle('wispawn',5,'wild');game.winBattle();
 assert.equal(game.save.team[0].hp,2,'random encounters cannot restore HP');
});
test('runtime: three starters can defeat a first forest trail encounter using real move commands',()=>{
 for(const [i,starter] of ['cindrel','velaria','thorne'].entries()){
  const {game,dom,flushTimers}=mount({virtualTime:true,seed:17+i*13});
  game.startNew();dom.get('worldSeedInput').value=String(1000+i);game.startNew();game.pickStarter(starter);while(game.dialogOpen)game.nextDialog();
  game.interactLandmark({x:43,y:16,kind:'portal',label:'Bosque'});
  assert.equal(game.save.zone,'forest');
  const trail=game.roamers().find(e=>e.id==='forest-0');assert.ok(trail,starter+' must have an accessible first trail');
  game.startBattle(trail.speciesId,trail.level,'wild',trail.id);
  let turns=0;
  while(game.battle&&turns++<40){
   if(game.battle.busy){flushTimers();continue;}
   const ally=game.getAlly();
   if(ally.hp<maxHp(ally)*.38&&game.save.inventory.tonics>0){game.tonic();flushTimers();continue;}
   const move=ally.moves.filter(id=>MOVES[id]&&MOVES[id].power>0)
      .sort((a,b)=>damage(ally,game.battle.enemy,MOVES[b]).value-damage(ally,game.battle.enemy,MOVES[a]).value)[0];
   assert.ok(move,starter+' has no attack');
   game.useMove(move);flushTimers();
  }
  assert.ok(turns<40,starter+' battle exceeded budget');
  assert.ok(game.save.flags.includes('roamer-'+trail.id),starter+' must win with normal inputs');
  assert.ok(game.save.team[0].hp>0,starter+' must remain conscious');
 }
});


test('runtime: each regional altar grants one seal, heals repeatedly and persists its gift',()=>{
 const {game,storage}=mount();
 game.startNew();game.pickStarter('cindrel');while(game.dialogOpen)game.nextDialog();
 const altar={kind:'altar',x:15,y:12,label:'Lumbre'};
 const initial=game.save.inventory.seals;
 game.save.team[0].hp=1;
 game.interactLandmark(altar);
 assert.equal(game.save.inventory.seals,initial+1);
 assert.equal(game.save.team[0].hp,maxHp(game.save.team[0]));
 assert.equal(game.save.flags.filter(f=>f==='altar-village').length,1);
 game.save.team[0].hp=2;
 game.interactLandmark(altar);
 assert.equal(game.save.inventory.seals,initial+1,'repeat rest must not mint unlimited capture currency');
 assert.equal(game.save.team[0].hp,maxHp(game.save.team[0]),'repeat rest still heals fully');
 const checkpoint=JSON.parse(storage.getItem('ascii-azur-save-v1'));
 assert.equal(checkpoint.inventory.seals,initial+1);
 assert.equal(checkpoint.flags.filter(f=>f==='altar-village').length,1);
 game.interactLandmark({kind:'portal',x:43,y:16,label:'Bosque'});
 game.interactLandmark(altar);
 assert.equal(game.save.inventory.seals,initial+2,'first forest fire is a separate discovery');
 game.interactLandmark(altar);
 assert.equal(game.save.inventory.seals,initial+2,'forest fire cannot be farmed');
 const echoes=game.economy.echoes;
 assert.equal(game.purchaseItem('seals'),true,'Mara still sells renewable seals');
 assert.equal(game.save.inventory.seals,initial+3);
 assert.equal(game.economy.echoes,echoes-18,'renewable supply has an economy cost');
});

test('runtime: legacy altar flags block repeat rewards and a full bag does not generate false gifts',()=>{
 const {game,storage}=mount();
 game.startNew();game.pickStarter('velaria');while(game.dialogOpen)game.nextDialog();
 game.save.flags.push('altar-village');
 game.save.inventory.seals=3;game.save.team[0].hp=1;
 game.interactLandmark({kind:'altar',x:15,y:12,label:'Lumbre'});
 assert.equal(game.save.inventory.seals,3);
 assert.equal(game.save.team[0].hp,maxHp(game.save.team[0]));
 game.interactLandmark({kind:'portal',x:43,y:16,label:'Bosque'});
 game.save.inventory.seals=9;
 game.interactLandmark({kind:'altar',x:17,y:16,label:'Lumbre'});
 assert.equal(game.save.inventory.seals,9,'seal capacity applies to first rewards');
 assert.ok(game.save.flags.includes('altar-forest'),'first discovery must be recorded even when full');
 game.save.inventory.seals=2;
 game.interactLandmark({kind:'altar',x:17,y:16,label:'Lumbre'});
 assert.equal(game.save.inventory.seals,2,'full-bag discovery cannot be exploited after spending');
 assert.equal(JSON.parse(storage.getItem('ascii-azur-save-v1')).flags.filter(f=>f==='altar-forest').length,1);
});

test('runtime: reloading a committed attack cannot skip the enemy response',()=>{
 const a=mount({virtualTime:true,seed:17});a.game.startNew();a.game.pickStarter('cindrel');while(a.game.dialogOpen)a.game.nextDialog();
 a.game.startBattle('thorne',4,'wild');a.game.useMove('ember');assert.equal(a.game.battle.pending,'enemy');
 const raw=a.storage.getItem('ascii-azur-save-v1');assert.equal(JSON.parse(raw).activeBattle.pending,'enemy');
 const b=mount({virtualTime:true,seed:17,priorSave:raw});b.game.continueGame();
 assert.equal(b.game.battle.busy,true);assert.equal(b.game.battle.pending,'enemy');
 const enemyHp=b.game.battle.enemy.hp;b.game.useMove('ember');
 assert.equal(b.game.battle.enemy.hp,enemyHp,'cannot attack twice before retaliation');
 b.flushTimers();assert.equal(b.game.battle?.pending,undefined);assert.equal(b.game.battle?.busy,false);
 assert.match(b.game.battle.log,/usa /);
 assert.equal(JSON.parse(b.storage.getItem('ascii-azur-save-v1')).activeBattle.pending,undefined);
});
test('runtime: reloading a paid capture resumes one attempt without charging twice',()=>{
 const a=mount({virtualTime:true,seed:17});a.game.startNew();a.game.pickStarter('velaria');while(a.game.dialogOpen)a.game.nextDialog();
 a.game.startBattle('thorne',4,'wild');const seals=a.game.save.inventory.seals;a.game.capture();
 assert.equal(a.game.battle.pending,'capture');assert.equal(a.game.save.inventory.seals,seals-1);
 const b=mount({virtualTime:true,seed:17,priorSave:a.storage.getItem('ascii-azur-save-v1')});b.game.continueGame();
 assert.equal(b.game.battle.pending,'capture');assert.equal(b.game.battle.busy,true);
 b.flushTimers();assert.equal(b.game.save.inventory.seals,seals-1);
 assert.ok(!b.game.battle||b.game.battle.pending===undefined);
});
test('runtime: reloading a pending victory grants XP exactly once',()=>{
 const a=mount({virtualTime:true,seed:31});a.game.startNew();a.game.pickStarter('cindrel');while(a.game.dialogOpen)a.game.nextDialog();
 a.game.startBattle('thorne',4,'wild');a.game.battle.enemy.hp=1;a.game.useMove('ember');
 assert.equal(a.game.battle.pending,'victory');
 const b=mount({virtualTime:true,seed:31,priorSave:a.storage.getItem('ascii-azur-save-v1')});
 b.game.continueGame();assert.equal(b.game.battle.busy,true);b.flushTimers();
 assert.equal(b.game.battle,null);const exp=b.game.save.team[0].exp;
 const c=mount({virtualTime:true,seed:31,priorSave:b.storage.getItem('ascii-azur-save-v1')});
 c.game.continueGame();c.flushTimers();assert.equal(c.game.battle,null);assert.equal(c.game.save.team[0].exp,exp);
});

/** Multi-seed first-route acceptance probe: real combat commands and enemy turns,
 * no direct winBattle, no injected XP, no artificial party stats or forced captures.
 * Portal transition is used to isolate combat pacing from navigation for this probe. */
test('progression probe: six visible trail combats for three starters across twelve world seeds',()=>{
 const report=[];
 for(const starter of ['cindrel','velaria','thorne'])for(let n=1;n<=12;n++){
  const world=(Math.imul(n,2654435761))>>>0;
  const {game,dom,flushTimers}=mount({virtualTime:true,seed:n*701+starter.length*31});
  dom.set('worldSeedInput',{value:String(world)});
  game.startNew();game.pickStarter(starter);while(game.dialogOpen)game.nextDialog();
  game.interactNpc('archivist');while(game.dialogOpen)game.nextDialog();
  game.interactLandmark({kind:'portal',x:43,y:16,label:'Bosque'});
  let won=0,losses=0,forestWins=0,sanctuaryWins=0,tonics=0,turns=0;
  const fight=(enemy,level,encounterId)=>{
   game.startBattle(enemy,level,'wild',encounterId);
   if(!game.battle)return false;
   const was=game.save.inventory.tonics;
   let ticks=0;
   while(game.battle&&ticks++<100){
    const b=game.battle,ally=game.getAlly();
    if(b.busy){flushTimers();continue;}
    if(game.save.inventory.tonics>0&&ally.hp<maxHp(ally)*.38){
      game.tonic();flushTimers();continue;
    }
    const options=ally.moves.filter(mid=>MOVES[mid]&&MOVES[mid].power>0);
    options.sort((a,c)=>damage(ally,b.enemy,MOVES[c]).value-damage(ally,b.enemy,MOVES[a]).value);
    if(!options.length)throw Error('no attack available');
    game.useMove(options[0]);flushTimers();
   }
   assert.ok(ticks<100,'unresolved combat '+JSON.stringify({starter,world,encounterId,enemy:game.battle?.enemy.speciesId,enemyHp:game.battle?.enemy.hp,allyHp:game.getAlly()?.hp,log:game.battle?.log}));
   turns+=ticks;tonics+=was-game.save.inventory.tonics;
   const victory=game.save.flags.includes('roamer-'+encounterId);
   if(victory){won++;if(encounterId.startsWith('forest-'))forestWins++;else sanctuaryWins++;}else losses++;
   if(game.evolution){game.seconds=game.evolution.startedAt+game.evolution.duration+.25;game.loop(1000);}
   return victory;
  };
  for(const zone of ['forest','sanctuary']){
   if(zone==='sanctuary'){
    if(game.save.zone==='village')game.interactLandmark({kind:'portal',x:43,y:16,label:'Bosque'});
    game.interactLandmark({kind:'portal',x:43,y:16,label:'Santuario'});
   }
   const roamers=game.roamers();
   assert.equal(roamers.length,3,zone+' seed '+world);
   for(const r of roamers){
    if(game.save.zone==='village'){
     game.interactLandmark({kind:'portal',x:43,y:16,label:'Bosque'});
     if(zone==='sanctuary')game.interactLandmark({kind:'portal',x:43,y:16,label:'Santuario'});
    }
    fight(r.speciesId,r.level,r.id);
   }
  }
  report.push({starter,world,won,losses,forestWins,sanctuaryWins,tonics,turns,level:game.save.team[0].level,
    hp:game.save.team[0].hp,alive:game.save.team.some(c=>c.hp>0)});
 }
 for(const starter of ['cindrel','velaria','thorne']){
  const group=report.filter(r=>r.starter===starter);
  const forestVictories=group.reduce((a,b)=>a+b.forestWins,0);
  assert.ok(forestVictories>=22,starter+' early-route survival below calibrated 22/36 floor: '+forestVictories);
  console.log('BALANCE_PROBE '+JSON.stringify({starter,runs:group.length,rounds:group.reduce((a,b)=>a+b.won+b.losses,0),
    victories:group.reduce((a,b)=>a+b.won,0),defeats:group.reduce((a,b)=>a+b.losses,0),
    forestWins:group.reduce((a,b)=>a+b.forestWins,0),sanctuaryWins:group.reduce((a,b)=>a+b.sanctuaryWins,0),
    tonics:group.reduce((a,b)=>a+b.tonics,0),levels:group.map(r=>r.level)}));
 }
 assert.equal(report.length,36);
});

test('runtime: optional Sanctuary route plan renders on desktop/mobile menu without changing saves',()=>{
 const {game,dom,storage}=mount({virtualTime:true,seed:313});
 dom.set('worldSeedInput',{value:'3234567'});
 game.startNew();game.pickStarter('cindrel');while(game.dialogOpen)game.nextDialog();
 const saved=storage.getItem('ascii-azur-save-v1');
 game.openRoutePlan();
 assert.equal(game.modalOpen,true);
 const first=dom.get('modalContent').innerHTML;
 assert.match(first,/SANTUARIO · PLAN DE RUTA|RUTA ELEMENTAL/);
 assert.match(first,/1\. /);assert.match(first,/2\. /);assert.match(first,/3\. /);
 assert.match(first,/CONTRAATAQUE: Cindrel/,'starting Ash knows an actual Root counter');
 assert.match(first,/0\/3 RETOS/);
 assert.equal(storage.getItem('ascii-azur-save-v1'),saved,'opening route plan must not mutate saves');
 game.hideModal();
 game.save.flags.push('roamer-sanctuary-0');
 game.openRoutePlan();
 assert.match(dom.get('modalContent').innerHTML,/1\/3 RETOS/);
 assert.match(dom.get('modalContent').innerHTML,/SUPERADO/);
 game.hideModal();
 game.startBattle('briarling',8,'wild');
 game.openRoutePlan();
 assert.equal(game.modalOpen,false,'route plan cannot interrupt combat');
});

test('runtime: Keeper grants Sanctuary three-oath supplies once; v1 reload cannot duplicate rewards',()=>{
 const {game,storage}=mount({virtualTime:true,seed:440});
 game.startNew();game.pickStarter('velaria');while(game.dialogOpen)game.nextDialog();
 const inventory={...game.save.inventory},echoes=game.economy.echoes;
 game.interactNpc('keeper');
 assert.equal(game.save.inventory.seals,inventory.seals,'no early oath payout');
 assert.equal(game.save.inventory.tonics,inventory.tonics);
 while(game.dialogOpen)game.nextDialog();
 game.save.flags.push('roamer-sanctuary-0','roamer-sanctuary-1','roamer-sanctuary-2');
 game.interactNpc('keeper');
 assert.equal(game.save.inventory.seals,inventory.seals+2);
 assert.equal(game.save.inventory.tonics,inventory.tonics+2);
 assert.equal(game.economy.echoes,echoes+40);
 assert.equal(game.save.flags.filter(x=>x==='sanctuary-three-vows').length,1);
 while(game.dialogOpen)game.nextDialog();
 game.interactNpc('keeper');
 assert.equal(game.save.inventory.seals,inventory.seals+2);
 assert.equal(game.economy.echoes,echoes+40);
 while(game.dialogOpen)game.nextDialog();
 const raw=storage.getItem('ascii-azur-save-v1');
 const continuation=mount({virtualTime:true,seed:441,priorSave:raw});
 continuation.game.continueGame();
 while(continuation.game.dialogOpen)continuation.game.nextDialog();
 continuation.game.interactNpc('keeper');
 assert.equal(continuation.game.save.inventory.seals,inventory.seals+2);
 assert.equal(continuation.game.save.inventory.tonics,inventory.tonics+2);
 assert.equal(continuation.game.economy.echoes,echoes+40);
});


/** C3 reconnaissance: fixed bounded player-command policy, no forced XP, capture or victory.
 * Travel is driven through the same portal/landmark handlers as existing runtime tests;
 * dungeon coordinates use actual collision/movement and the saved deterministic topology.
 * Every report is machine readable for comparing cohorts without cherry-picking seeds. */
test('C3 measurement: three starters across twelve worlds with legitimate capture, Guardian and crypt', {timeout:180000},()=>{
 const cohorts=[], starters=['cindrel','velaria','thorne'];
 for(const starter of starters)for(let n=1;n<=12;n++){
  const world=(Math.imul(n,2654435761))>>>0;
  const session=mount({virtualTime:true,seed:n*7919+starter.length*59});
  const {game,dom,storage,flushTimers}=session;
  dom.set('worldSeedInput',{value:String(world)});
  game.startNew();game.pickStarter(starter);
  const dialogs=()=>{while(game.dialogOpen)game.nextDialog();if(game.evolution){game.seconds=game.evolution.startedAt+game.evolution.duration+.25;game.loop(1000);}};
  dialogs();game.interactNpc('archivist');dialogs();
  let wins=0,failures=0,captures=0,tonics=0,actions=0,guardian=false,crypt=false,training=0,bossStarted=false,bossTurns=0,lastBossHp=-1,preGuardianZone='',preGuardianEvolution=false,preGuardianDialog=false,guardianModal=false;
  const battle=(species,level,type='wild',encounterId=undefined,bind=false)=>{
   dialogs();if(game.battle)throw Error('Prior encounter still active');
   const originalSize=game.save.team.length, priorDefeated=game.save.defeatedBoss,oldEchoes=game.economy.echoes;
   game.startBattle(species,level,type,encounterId);
   let steps=0;
   while(game.battle&&steps++<90){
    const b=game.battle,ally=game.getAlly();
    if(b.busy){flushTimers();continue;}
    if(b.chargeStage===2){game.defend();flushTimers();actions++;continue;}
    if(bind&&game.save.inventory.tonics>0&&ally.hp<maxHp(ally)*.28){
     game.tonic();tonics++;actions++;flushTimers();continue;
    }
    if(bind&&game.save.inventory.seals>0&&b.enemy.hp/maxHp(b.enemy)<=.60){
     game.capture();actions++;flushTimers();continue;
    }
    const available=ally.moves.filter(id=>MOVES[id]&&MOVES[id].power>0);
    if(!available.length)throw Error('No offensive move for '+starter);
    const rank=(id)=>damage(ally,b.enemy,MOVES[id]).value;
    available.sort((a,c)=>(bind?rank(a)-rank(c):rank(c)-rank(a)));
    game.useMove(available[0]);actions++;flushTimers();
   }
   assert.ok(steps<90,'combat softlock '+JSON.stringify({starter,world,species,level,type,encounterId}));
   dialogs();
   const caught=game.save.team.length>originalSize;
   const won=type==='boss'?game.save.defeatedBoss&&!priorDefeated
     :encounterId?game.save.flags.includes('roamer-'+encounterId):!caught&&game.economy.echoes>oldEchoes;
   if(caught)captures++;
   if(won)wins++;
   if(!won&&!caught)failures++;
   return{won,caught};
  };
  const heal=()=>{dialogs();game.interactLandmark({kind:'altar',x:15,y:12});};
  const portal=()=>{dialogs();game.interactLandmark({kind:'portal',x:game.save.zone==='forest'&&game.save.x>30?43:43,y:16,label:'Paso'});};
  // Recruit Ash counterplay for non-Ash starters and a secondary companion for Ash.
  // Cindrel and briarling are selectable from real village direct challenges.
  for(const id of starter==='cindrel'?['mireling','briarling']:['cindrel','briarling']){
   let found=false;
   for(let attempt=0;attempt<3&&!found&&game.save.inventory.seals>0;attempt++){
    heal();found=battle(id,id==='mireling'?5:3,'wild',undefined,true).caught;
   }
  }
  // Three authored first-victory lessons replace repeated grind, with earned XP.
  for(const [species,level] of [['cindrel',3],['briarling',4],['mireling',5]]){
   heal();const result=battle(species,level);
   if(result.won)training++;
  }
  dialogs();game.interactNpc('scout');dialogs();
  heal();portal(); // village -> forest
  const forest=game.roamers();
  for(const r of forest){heal();battle(r.speciesId,r.level,'wild',r.id);}
  if(game.save.zone==='village')portal();
  if(game.save.zone==='forest')portal(); // forest -> Sanctuary
  if(game.save.zone==='sanctuary'){
   const route=game.roamers();
   for(const r of route){
    if(game.save.zone!=='sanctuary'){if(game.save.zone==='village')portal();if(game.save.zone==='forest')portal();}
    heal();battle(r.speciesId,r.level,'wild',r.id);
   }
   if(game.save.flags.filter(f=>f.startsWith('roamer-sanctuary-')).length===3){
    game.interactNpc('keeper');dialogs();
   }
   if(game.save.zone==='village')portal();
   if(game.save.zone==='forest')portal();
   heal();dialogs();
   preGuardianZone=game.save.zone;preGuardianEvolution=!!game.evolution;preGuardianDialog=game.dialogOpen;
   game.interactLandmark({kind:'guardian',x:35,y:16,label:'Hollowhart'});
   guardianModal=game.modalOpen;
   if(game.modalOpen){dom.get('guardianProceed').onclick();}
   if(game.battle){
    // Resolve the prepared boss battle through ordinary player commands.
    bossStarted=true;let turns=0;
    while(game.battle&&turns++<90){
      const state=game.battle,ally=game.getAlly();lastBossHp=state.enemy.hp;
      if(state.busy){flushTimers();continue;}
      if(state.chargeStage===2){game.defend();flushTimers();actions++;continue;}
      if(game.save.inventory.tonics>0&&ally.hp<maxHp(ally)*.4){game.tonic();tonics++;flushTimers();actions++;continue;}
      const ids=ally.moves.filter(id=>MOVES[id]&&MOVES[id].power>0).sort((x,y)=>damage(ally,state.enemy,MOVES[y]).value-damage(ally,state.enemy,MOVES[x]).value);
      if(!ids.length)throw Error('No boss moves');
      game.useMove(ids[0]);actions++;flushTimers();
    }
    assert.ok(turns<90,'boss softlock');bossTurns=turns;
    guardian=game.save.defeatedBoss;dialogs();
   }
  }
  if(guardian){
   if(game.save.zone==='sanctuary')game.interactLandmark({kind:'portal',x:2,y:16,label:'Bosque'});
   if(game.save.zone==='forest')game.interactLandmark({kind:'portal',x:2,y:16,label:'Arken'});
   if(game.save.zone==='village'){
    heal();game.enterDungeon(false);
    const visit=event=>{
     const d=game.save.dungeon;
     for(const next of dungeonTilePath(d,{x:d.x,y:d.y},event).slice(1)){
      const current=game.save.dungeon,dx=next.x-current.x,dy=next.y-current.y;
      game.stick.x=Math.abs(dx)<.05?0:Math.sign(dx);
      game.stick.y=Math.abs(dy)<.05?0:Math.sign(dy);
      for(let step=0;step<5;step++)game.move(1/(4.35*5));
      assert.ok(Math.hypot(game.save.dungeon.x-next.x,game.save.dungeon.y-next.y)<.05,'Crypt path blocked '+starter+'/'+world);
     }game.resetJoystick();
    };
    for(const id of [1,2,3,4,5,7]){
     const d=game.save.dungeon;if(!d?.active)break;
     visit(d.events[id]);game.dungeonInteract();
     if(game.battle){
      let steps=0;
      while(game.battle&&steps++<90){
       if(game.battle.busy){flushTimers();continue;}
       const ally=game.getAlly();
       if(game.save.inventory.tonics>0&&ally.hp<maxHp(ally)*.34){game.tonic();tonics++;flushTimers();actions++;continue;}
       const ids=ally.moves.filter(mid=>MOVES[mid]&&MOVES[mid].power>0).sort((a,c)=>damage(ally,game.battle.enemy,MOVES[c]).value-damage(ally,game.battle.enemy,MOVES[a]).value);
       game.useMove(ids[0]);actions++;flushTimers();
      }
      assert.ok(steps<90,'sentinel softlock');
     }
     dialogs();
    }
    crypt=!!game.save.dungeon?.finished;
   }
  }
  const raw=storage.getItem('ascii-azur-save-v1');
  assert.ok(raw,'player save not persisted');
  const saved=JSON.parse(raw);
  assert.equal(saved.version,1);
  const reopened=mount({virtualTime:true,seed:n*42+starter.length,priorSave:raw});
  reopened.game.continueGame();reopened.flushTimers();
  assert.deepEqual(JSON.parse(JSON.stringify(reopened.game.save.flags)),JSON.parse(JSON.stringify(game.save.flags)),'no loss/duplication on reload');
  cohorts.push({starter,world,training,captures,wins,failures,tonics,actions,bossStarted,bossTurns,lastBossHp,preGuardianZone,preGuardianEvolution,preGuardianDialog,guardianModal,guardian,crypt,level:game.save.team[0]?.level});
 }
 for(const starter of starters){
  const cases=cohorts.filter(c=>c.starter===starter);
  console.log('C3_COHORT '+JSON.stringify({starter,runs:cases.length,captures:cases.map(c=>c.captures),training:cases.map(c=>c.training),
   bossWins:cases.filter(c=>c.guardian).length,cryptWins:cases.filter(c=>c.crypt).length,
   bossStarted:cases.filter(c=>c.bossStarted).length,preGuardian:cases.map(c=>[c.preGuardianZone,c.preGuardianEvolution,c.preGuardianDialog,c.guardianModal]),bossTurns:cases.map(c=>c.bossTurns),bossFinalHP:cases.map(c=>c.lastBossHp),
   tonics:cases.reduce((s,c)=>s+c.tonics,0),failures:cases.reduce((s,c)=>s+c.failures,0),
   levels:cases.map(c=>c.level)}));
  assert.ok(cases.every(c=>c.captures>=1),starter+' missing player-earned captured ally');
  assert.ok(cases.every(c=>c.training===3),starter+' did not finish three unique lessons');
  assert.ok(cases.filter(c=>c.bossStarted).length>=11,starter+' failed to reach the Guardian');
  assert.ok(cases.filter(c=>c.guardian).length>=11,starter+' below 90% Guardian gate');
  assert.ok(cases.filter(c=>c.crypt).length>=11,starter+' below 90% crypt gate');
 }
 assert.equal(cohorts.length,36);
});

test('runtime: Hollowhart cannot use untelegraphed Eclipse; charged blow has actionable cue and GUARDIA counterplay',()=>{
 const {game,flushTimers,dom}=mount({virtualTime:true,seed:779});
 game.startNew();game.pickStarter('thorne');while(game.dialogOpen)game.nextDialog();
 game.startBattle('hollowhart',12,'boss');
 game.enemyTurn();
 assert.doesNotMatch(game.battle.log,/usa Eclipse/,'early Eclipse undermines preparation');
 game.battle.bossPhase=2;game.battle.chargeStage=1;
 game.enemyTurn();assert.equal(game.battle.chargeStage,2);
 assert.match(game.battle.log,/ECLIPSE/);
 game.defend();flushTimers();
 assert.match(dom.get('battleLog').textContent,/RUPTURA DEL SILENCIO/);
 assert.match(dom.get('battleLog').textContent,/guardia/);
});

test('runtime: Guardian selection starts with chosen conscious ally and persists active battle slot',()=>{
 const {game,dom,storage}=mount({virtualTime:true,seed:98});
 game.startNew();game.pickStarter('velaria');while(game.dialogOpen)game.nextDialog();
 // Isolated UI fixture: multi-seed progression test independently recruits with actual capture.
 game.save.team.push({uid:'formation-ash',speciesId:'cinderwulf',level:10,exp:0,hp:75,moves:['smolder','ember']});
 game.interactLandmark({kind:'guardian',x:35,y:16,label:'Hollowhart'});
 assert.equal(game.modalOpen,true);
 assert.match(dom.get('modalContent').innerHTML,/guardianLeadSelect/);
 dom.set('guardianLeadSelect',{value:'1'});
 dom.get('guardianProceed').onclick();
 assert.equal(game.battle.ally,1);
 assert.equal(JSON.parse(storage.getItem('ascii-azur-save-v1')).activeBattle.ally,1);
});

test('runtime: Arken lessons give one-time earned party XP and Iria tonics; replay and reload are idempotent',()=>{
 const {game,storage}=mount({virtualTime:true,seed:306});
 game.startNew();game.pickStarter('thorne');while(game.dialogOpen)game.nextDialog();
 const initialTonics=game.save.inventory.tonics;
 // Unit-level reward checkpoint: C3 cohort independently uses real turn commands.
 for(const [species,level] of [['cindrel',3],['briarling',4],['mireling',5]]){
  game.startBattle(species,level,'wild');game.winBattle();
  assert.ok(game.save.flags.includes('training-'+species));
 }
 assert.equal(game.save.flags.filter(f=>f.startsWith('training-')).length,3);
 game.interactNpc('scout');while(game.dialogOpen)game.nextDialog();
 assert.equal(game.save.inventory.tonics,initialTonics+2);
 assert.equal(game.save.flags.filter(f=>f==='arken-three-lessons-reward').length,1);
 game.interactNpc('scout');while(game.dialogOpen)game.nextDialog();
 assert.equal(game.save.inventory.tonics,initialTonics+2);
 const raw=storage.getItem('ascii-azur-save-v1');
 const restored=mount({virtualTime:true,seed:307,priorSave:raw});
 restored.game.continueGame();while(restored.game.dialogOpen)restored.game.nextDialog();
 restored.game.interactNpc('scout');
 assert.equal(restored.game.save.inventory.tonics,initialTonics+2);
 const exp=restored.game.save.team[0].exp,level=restored.game.save.team[0].level;
 restored.game.startBattle('cindrel',3,'wild');restored.game.winBattle();
 assert.ok(restored.game.save.team[0].level>=level);
 assert.equal(restored.game.save.flags.filter(f=>f==='training-cindrel').length,1);
 assert.ok(restored.game.save.team[0].exp!==exp||restored.game.save.team[0].level>level,'normal repeat experience still works');
});

/** Chapter II walkthrough with normal combat commands. The Arken-ending and
 * post-boss party are fixtures: chapter encounters themselves grant real wins.
 * This verifies the sequel chapter, not a claim of end-to-end new-game traversal. */
test('N2: both moral endings resolve from seeded Marsh exploration, real combat and v1 save reload',()=>{
 const createCreature=createCharacter;
 const outcomes=[];
 for(const choice of ['keep','release'])for(const starter of ['cindrel','velaria','thorne'])for(let n=1;n<=3;n++){
  const world=(Math.imul(n,2246822519))>>>0;
  const {game,dom,storage,flushTimers}=mount({virtualTime:true,seed:n*421+starter.length*37});
  dom.set('worldSeedInput',{value:String(world)});
  game.startNew();game.pickStarter(starter);while(game.dialogOpen)game.nextDialog();
  game.save.flags.push('archivist','zone-forest','zone-sanctuary','arken-vow-restored');
  game.save.defeatedBoss=true;
  game.save.dungeon=makeCrypt(1701);
  game.save.dungeon.cleared=[2,3,5];
  game.save.dungeon.finished=true;
  game.save.dungeon.active=false;
  // Recreate a completed Chapter-I checkpoint for isolation of N2. C3 separately proves how it is earned.
  game.save.team=[
   createCreature(starter,15,()=>.01),
   createCreature('cinderwulf',14,()=>.02),
   createCreature('runeowl',14,()=>.03)
  ];
  game.save.zone='sanctuary';
  game.interactLandmark({kind:'portal',x:43,y:16,label:'Marismas'});
  assert.equal(game.save.zone,'marsh');
  game.interactNpc('nael');while(game.dialogOpen)game.nextDialog();
  for(const id of ['bell','lantern']){
   game.interactLandmark({kind:'memory',npcId:id,x:id==='bell'?19:28,y:16,label:id});
   while(game.dialogOpen)game.nextDialog();
  }
  const roamers=game.roamers();
  assert.equal(roamers.length,3,'missing three testifiers');
  let fought=0;
  for(const witness of roamers){
   game.interactLandmark({kind:'altar',x:24,y:10,label:'Lumbre'});
   game.startBattle(witness.speciesId,witness.level,'wild',witness.id);
   let ticks=0;
   while(game.battle&&ticks++<80){
    if(game.battle.busy){flushTimers();continue;}
    const ally=game.getAlly();
    if(game.battle.chargeStage===2){game.defend();flushTimers();continue;}
    if(game.save.inventory.tonics>0&&ally.hp<maxHp(ally)*.35){game.tonic();flushTimers();continue;}
    const moves=ally.moves.filter(id=>MOVES[id]?.power>0).sort((a,b)=>damage(ally,game.battle.enemy,MOVES[b]).value-damage(ally,game.battle.enemy,MOVES[a]).value);
    assert.ok(moves.length);game.useMove(moves[0]);flushTimers();
   }
   assert.ok(ticks<80,'witness softlocked '+witness.id);
   assert.ok(game.save.flags.includes('roamer-'+witness.id),'unresolved witness '+witness.id);
   fought++;
   while(game.dialogOpen)game.nextDialog();
   if(game.evolution){game.seconds=game.evolution.startedAt+game.evolution.duration+.3;game.loop(1000);}
  }
  assert.equal(fought,3);
  game.interactLandmark({kind:'verdict',x:36,y:16,label:'Tribunal'});
  assert.equal(game.modalOpen,true,'verdict should be accessible after the 3 testifiers');
  assert.match(dom.get('modalContent').innerHTML,/PRESERVAR/);
  assert.match(dom.get('modalContent').innerHTML,/LIBERAR/);
  const before=game.economy.echoes,seal=game.save.inventory.seals,tonic=game.save.inventory.tonics;
  game.chooseMarsh(choice);while(game.dialogOpen)game.nextDialog();
  assert.equal(game.economy.echoes,before+180);
  assert.equal(game.save.inventory.seals,seal+(choice==='keep'?4:0));
  assert.equal(game.save.inventory.tonics,tonic+(choice==='release'?4:0));
  const first=JSON.stringify(game.save.flags);
  game.chooseMarsh(choice==='keep'?'release':'keep');
  assert.equal(JSON.stringify(game.save.flags),first,'other ending must not be available after choice');
  game.interactNpc('nael');while(game.dialogOpen)game.nextDialog();
  assert.ok(game.save.flags.includes('marsh-chapter-complete'));
  assert.match(dom.get('missionChip').textContent,/CRUZA LA ÚLTIMA/);
  assert.equal(game.economy.echoes,before+260,'epilogue gives an additional 80 once');
  const persisted=storage.getItem('ascii-azur-save-v1');assert.ok(persisted);
  const restored=mount({virtualTime:true,seed:99,priorSave:persisted});
  restored.game.continueGame();
  assert.equal(restored.game.save.zone,'marsh');
  assert.equal(restored.game.save.flags.filter(x=>x==='marsh-chapter-complete').length,1);
  const prior=restored.game.economy.echoes;
  restored.game.interactNpc('nael');
  assert.equal(restored.game.economy.echoes,prior,'epilogue may not pay twice');
  outcomes.push({choice,starter,world});
 }
 assert.equal(outcomes.length,18);
 console.log('N2_CHAPTER_ACCEPTANCE '+JSON.stringify({sessions:outcomes.length,choices:2,starters:3,seeds:3,completion:18}));
});

/** N3 isolated final-chapter runtime acceptance. The N2 completion and lvl-18
 * three-creature team are explicit fixtures. All Crown fights, including the
 * final boss, resolve with ordinary player actions, opponent turns and earned flags. */
test('N3: four authored endings x three starters x three seeded worlds complete with real final combat', {timeout:180000},()=>{
 const records=[];
 for(const marsh of ['keep','release'])for(const choice of ['remember','renew'])
 for(const starter of ['cindrel','velaria','thorne'])for(let n=1;n<=3;n++){
  const world=(Math.imul(n,2246822519))>>>0;
  const {game,dom,storage,flushTimers}=mount({virtualTime:true,seed:n*809+starter.length*41+(marsh==='keep'?1:2)+(choice==='renew'?9:0)});
  dom.set('worldSeedInput',{value:String(world)});
  game.startNew();game.pickStarter(starter);
  const settle=()=>{while(game.dialogOpen)game.nextDialog();if(game.evolution){game.seconds=game.evolution.startedAt+game.evolution.duration+.5;game.loop(1000);}};
  settle();
  // Explicit Chapter-II checkpoint fixture; chapter I and II gates are separately tested.
  game.save.flags.push('archivist','zone-forest','zone-sanctuary','arken-vow-restored','zone-marsh','marsh-met-nael','marsh-choice-'+marsh,'marsh-chapter-complete');
  game.save.defeatedBoss=true;
  game.save.dungeon=makeCrypt(1701);game.save.dungeon.cleared=[2,3,5];game.save.dungeon.finished=true;game.save.dungeon.active=false;
  game.save.team=[createCharacter(starter,18,()=>.12),createCharacter('cinderwulf',18,()=>.22),createCharacter('runeowl',18,()=>.32)];
  game.save.inventory.tonics=8;game.save.inventory.seals=8;
  game.save.zone='marsh';
  game.interactLandmark({kind:'portal',x:43,y:16,label:'Corona'});
  assert.equal(game.save.zone,'spire','final region must unlock only after chapter II');
  game.interactNpc('oriel');settle();
  for(const name of ['flame','archive']){
   game.interactLandmark({kind:'memory',npcId:name,x:20,y:16,label:name});settle();
  }
  const roamers=game.roamers();
  assert.equal(roamers.length,3,'final chapter must expose three seeded witnesses');
  const useBattle=()=>{
   let turns=0;
   while(game.battle&&turns++<110){
    const b=game.battle,ally=game.getAlly();
    if(b.busy){flushTimers();continue;}
    if(b.chargeStage===2){game.defend();flushTimers();continue;}
    if(game.save.inventory.tonics>0&&ally.hp<maxHp(ally)*.37){game.tonic();flushTimers();continue;}
    const ids=ally.moves.filter(mid=>MOVES[mid]?.power>0).sort((a,c)=>damage(ally,b.enemy,MOVES[c]).value-damage(ally,b.enemy,MOVES[a]).value);
    assert.ok(ids.length,'missing offensive option');
    game.useMove(ids[0]);flushTimers();
   }
   assert.ok(turns<110,'battle softlock at '+starter+'/'+world);
   assert.equal(game.battle,null,'combat unresolved');
   settle();
  };
  for(const encounter of roamers){
   game.interactLandmark({kind:'altar',x:24,y:9,label:'Lumbre'});
   game.startBattle(encounter.speciesId,encounter.level,'wild',encounter.id);
   useBattle();
   assert.ok(game.save.flags.includes('roamer-'+encounter.id),'ordinary action victory missing '+encounter.id);
  }
  game.interactLandmark({kind:'altar',x:24,y:9,label:'Lumbre'});
  game.interactLandmark({kind:'guardian',npcId:'nullscribe',x:35,y:15,label:'Nullscribe'});
  assert.equal(game.modalOpen,true,'boss preflight missing');
  assert.match(dom.get('modalContent').innerHTML,/CRIATURA QUE ABRE/);
  dom.set('crownLeadSelect',{value:'2'});
  dom.get('crownProceed').onclick();
  assert.equal(game.battle?.type,'boss');
  assert.equal(game.battle?.enemy.speciesId,'nullscribe');
  assert.equal(game.battle?.ally,2,'selected conscious leader must start finale');
  useBattle();
  assert.ok(game.save.flags.includes('crown-nullscribe-fallen'),'final boss must fall through player actions');
  assert.ok(game.save.defeatedBoss,'Arken boss progression must remain untouched');
  game.interactLandmark({kind:'verdict',x:40,y:24,label:'Telar'});
  assert.equal(game.modalOpen,true,'final choice missing');
  assert.match(dom.get('modalContent').innerHTML,/RECORDAR/);
  assert.match(dom.get('modalContent').innerHTML,/RENOVAR/);
  const before={echoes:game.economy.echoes,seals:game.save.inventory.seals,tonics:game.save.inventory.tonics};
  game.chooseCrown(choice);settle();
  assert.equal(game.economy.echoes,before.echoes+220);
  assert.equal(game.save.inventory.seals,before.seals+(choice==='remember'?4:0));
  assert.equal(game.save.inventory.tonics,before.tonics+(choice==='renew'?4:0));
  game.chooseCrown(choice==='remember'?'renew':'remember');
  assert.equal(game.save.flags.some(x=>x==='crown-choice-'+(choice==='remember'?'renew':'remember')),false);
  game.interactNpc('oriel');
  assert.equal(game.dialogOpen,true,'final epilogue must present the narrative before ending');
  settle();
  assert.ok(game.save.flags.includes('crown-trilogy-complete'));
  assert.match(dom.get('missionChip').textContent,/HISTORIA PRINCIPAL COMPLETADA/);
  assert.equal(game.economy.echoes,before.echoes+370,'final epilogue grants +150 only once');
  const snapshot=storage.getItem('ascii-azur-save-v1');assert.ok(snapshot);
  const reloaded=mount({virtualTime:true,seed:998,priorSave:snapshot});
  reloaded.game.continueGame();reloaded.flushTimers();
  assert.equal(reloaded.game.save.zone,'spire');
  assert.equal(reloaded.game.save.flags.filter(f=>f==='crown-trilogy-complete').length,1);
  const prior=reloaded.game.economy.echoes;
  reloaded.game.interactNpc('oriel');
  assert.equal(reloaded.game.economy.echoes,prior,'final reward cannot duplicate after reload');
  records.push({marsh,choice,starter,world});
 }
 assert.equal(records.length,36);
 console.log('N3_FINAL_ACCEPTANCE '+JSON.stringify({runs:36,marshChoices:2,finalChoices:2,starters:3,seeds:3,success:records.length}));
});

/** Q3 trilogy continuity: NEVER mutate progress flags, team levels, dungeon clear,
 * victories or rewards. Every chapter is earned in a single save lineage from
 * pickStarter. Exact surface portal handlers are exercised; physical movement
 * through the crypt uses dungeonSweep as in C3. */
test('Q3 journey: new-game to all four finale branches with earned captures, battles, crypt and reloaded chapter gates', {timeout:240000},()=>{
 const cases=[];
 for(const starter of ['cindrel','velaria','thorne'])for(const marsh of ['keep','release'])for(const ending of ['remember','renew']){
  const seed=Math.imul(starter.length*17+(marsh==='keep'?1:5)+(ending==='remember'?11:29),2654435761)>>>0;
  let {game,dom,storage,flushTimers}=mount({virtualTime:true,seed:seed^0x5A5AA5A5});
  dom.set('worldSeedInput',{value:String(seed)});
  game.startNew();game.pickStarter(starter);
  let battles=0,caught=0,actions=0,heals=0;
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
   ({game,dom,storage,flushTimers}=reread);
   settle();
  };
  const doBattle=(bind=false)=>{
   let steps=0,initialSize=game.save.team.length;
   while(game.battle&&steps++<110){
    const battle=game.battle,ally=game.getAlly();
    if(battle.busy){flushTimers();continue;}
    if(battle.chargeStage===2){game.defend();actions++;flushTimers();continue;}
    if(game.save.inventory.tonics>0&&ally.hp<maxHp(ally)*(bind?.26:.37)){
     game.tonic();actions++;flushTimers();continue;
    }
    if(bind&&game.save.inventory.seals>0&&battle.enemy.hp/maxHp(battle.enemy)<.65){
     game.capture();actions++;flushTimers();continue;
    }
    const ids=ally.moves.filter(m=>MOVES[m]?.power>0).sort((a,b)=>bind
     ?damage(ally,battle.enemy,MOVES[a]).value-damage(ally,battle.enemy,MOVES[b]).value
     :damage(ally,battle.enemy,MOVES[b]).value-damage(ally,battle.enemy,MOVES[a]).value);
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
   const item=ZONES[game.save.zone].landmarks.find(l=>l.kind===kind&&(npcId===undefined||l.npcId===npcId));
   assert.ok(item,'missing authored site '+kind+'/'+npcId);
   approach(item);return item;
  };
  const visitNpc=id=>{game.interactLandmark(site('npc',id));settle();};
  const heal=()=>{settle();game.interactLandmark(site('altar'));heals++;};
  const portal=x=>{settle();const p=ZONES[game.save.zone].landmarks.find(l=>l.kind==='portal'&&(x<10?l.x<10:l.x>20));assert.ok(p);approach(p);game.interactLandmark(p);settle();};
  const witness=e=>{approach({...e,label:e.id});game.interact();assert.equal(game.battle?.enemy.speciesId,e.speciesId,'visible roaming encounter skipped');doBattle();assert.ok(game.save.flags.includes('roamer-'+e.id),'witness not resolved');};
  settle();visitNpc('archivist');
  // Legitimately recruit at least one companion from ordinary wild duels.
  for(const id of starter==='cindrel'?['mireling','briarling']:['cindrel','briarling']){
   let found=false;
   for(let attempt=0;attempt<3&&!found&&game.save.inventory.seals>0;attempt++){
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
  doBattle();assert.ok(game.save.flags.includes('crown-nullscribe-fallen'),'final boss missing');
  game.interactLandmark(site('verdict'));
  assert.ok(game.modalOpen,'final verdict missing');
  game.chooseCrown(ending);settle();visitNpc('oriel');
  assert.ok(game.save.flags.includes('crown-trilogy-complete'),'final outcome missing');
  assert.ok(game.save.flags.includes('marsh-choice-'+marsh));
  assert.ok(game.save.flags.includes('crown-choice-'+ending));
  const finalE=game.economy.echoes;saveReload('Final');
  visitNpc('oriel');assert.equal(game.economy.echoes,finalE,'duplicated completion reward');
  cases.push({starter,marsh,ending,world:seed,captured:caught,battles,actions,heals,level:game.save.team[0].level});
 }
 assert.equal(cases.length,12);
 console.log('Q3_TRILOGY_ACCEPTANCE '+JSON.stringify({sessions:cases.length,starters:3,marshEndings:2,crownEndings:2,worlds:new Set(cases.map(c=>c.world)).size,
  battles:cases.reduce((a,c)=>a+c.battles,0),captures:cases.reduce((a,c)=>a+c.captured,0),actions:cases.reduce((a,c)=>a+c.actions,0),cases}));
});
