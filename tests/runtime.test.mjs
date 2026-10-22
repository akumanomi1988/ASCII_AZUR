import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {dungeonTilePath} from './helpers/dungeon-path.mjs';
import {damage, MOVES, maxHp} from '../dist/domain.js';
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
 assert.match(dom.get('missionChip').textContent,/COMPLETADO/);
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
 assert.match(dom.get('missionChip').textContent,/COMPLETADO/);
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
 game.interactLandmark({kind:'altar',x:10,y:10});
 if(game.evolution){game.seconds=game.evolution.startedAt+game.evolution.duration;game.loop(1000)}
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
 game.startBattle('briarling',3,'wild');game.winBattle();
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
 game.startBattle('briarling',5,'wild');game.winBattle();
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
  dom.get('worldSeedInput').value=String(world);
  game.startNew();game.pickStarter(starter);while(game.dialogOpen)game.nextDialog();
  game.interactNpc('archivist');while(game.dialogOpen)game.nextDialog();
  game.interactLandmark({kind:'portal',x:43,y:16,label:'Bosque'});
  let won=0,losses=0,tonics=0,turns=0;
  const fight=(enemy,level,encounterId)=>{
   game.startBattle(enemy,level,'wild',encounterId);
   if(!game.battle)return false;
   const was=game.save.inventory.tonics;
   let ticks=0;
   while(game.battle&&ticks++<35){
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
   assert.ok(ticks<35,'unresolved combat '+starter+' seed '+world+' '+encounterId);
   turns+=ticks;tonics+=was-game.save.inventory.tonics;
   const victory=game.save.flags.includes('roamer-'+encounterId);
   if(victory)won++;else losses++;
   if(game.evolution){game.seconds=game.evolution.startedAt+game.evolution.duration;game.loop(1000);}
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
  report.push({starter,world,won,losses,tonics,turns,level:game.save.team[0].level,
    hp:game.save.team[0].hp,alive:game.save.team.some(c=>c.hp>0)});
 }
 for(const starter of ['cindrel','velaria','thorne']){
  const group=report.filter(r=>r.starter===starter);
  console.log('BALANCE_PROBE '+JSON.stringify({starter,runs:group.length,rounds:group.reduce((a,b)=>a+b.won+b.losses,0),
    victories:group.reduce((a,b)=>a+b.won,0),defeats:group.reduce((a,b)=>a+b.losses,0),
    tonics:group.reduce((a,b)=>a+b.tonics,0),levels:group.map(r=>r.level)}));
 }
 assert.equal(report.length,36);
});
