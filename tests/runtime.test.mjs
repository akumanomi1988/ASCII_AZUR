import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const fakeContext={
 clearRect(){},fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},translate(){},scale(){},save(){},restore(){},ellipse(){},quadraticCurveTo(){},setTransform(){},drawImage(){},
 createLinearGradient(){return{addColorStop(){}}},createRadialGradient(){return{addColorStop(){}}},
 getImageData(){return{data:new Uint8ClampedArray(960*540*4)}}
};
function mount(){
 const dom=new Map(),store=new Map();
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
 const win={devicePixelRatio:1,addEventListener(){},setTimeout};
 const storage={setItem:(k,v)=>store.set(k,v),getItem:(k)=>store.get(k)||null};
 const html=fs.readFileSync(new URL('../play.html',import.meta.url),'utf8');
 const source=html.split('<script>\n').at(-1).split('\n</script>')[0].replace(/new AzurGame\(\);\s*$/, 'globalThis.GAME = new AzurGame();');
 const sandbox={document:doc,window:win,localStorage:storage,navigator:{},performance,console,AudioContext:class{constructor(){throw new Error('audio unavailable')}},requestAnimationFrame(){},setTimeout,clearTimeout,Math};
 vm.runInNewContext(source,sandbox,{timeout:5000});
 return{game:sandbox.GAME,dom,storage};
}
test('runtime: start a game, select creature, dismiss story, save',()=>{
 const {game,dom,storage}=mount();
 game.startNew();assert.equal(dom.get('starterScreen').classList.contains('hidden'),false);
 game.pickStarter('cindrel');assert.equal(game.save.team.length,1);assert.equal(game.save.team[0].speciesId,'cindrel');
 assert.equal(dom.get('dialogue').classList.contains('hidden'),false);
 for(let i=0;i<3;i++)game.nextDialog();
 assert.equal(game.dialogOpen,false);
 assert.ok(storage.getItem('ascii-azur-save-v1'));
 assert.equal(dom.get('zoneName').textContent,'Velo de Arken');
});
test('runtime: visit new zone, find treasure, launch boss and complete quest',()=>{
 const {game}=mount();game.startNew();game.pickStarter('velaria');for(let i=0;i<3;i++)game.nextDialog();
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
 const {game}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<3;i++)game.nextDialog();
 const beforeX=game.save.x;game.stick.x=1;game.stick.y=0;game.move(.1);
 assert.ok(game.save.x>beforeX,'horizontal movement should respond to analog input');
 game.resetJoystick();assert.equal(game.stick.x,0);assert.equal(game.stick.y,0);
});
test('runtime: guard is consumed by next enemy turn and reduces damage',()=>{
 const {game}=mount();game.startNew();game.pickStarter('thorne');for(let i=0;i<3;i++)game.nextDialog();
 game.startBattle('cindrel',4,'wild');
 const hp=game.getAlly().hp;game.defend();assert.equal(game.battle.guarding,true);assert.equal(game.battle.busy,true);
 game.enemyTurn();assert.equal(game.battle.guarding,false);assert.equal(game.battle.busy,false);
 assert.ok(game.getAlly().hp<hp);assert.ok(hp-game.getAlly().hp<=15);
});
test('runtime: switching allows deliberate selection of the second available creature',()=>{
 const {game}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<3;i++)game.nextDialog();
 const c={...game.save.team[0],uid:'alt',speciesId:'velaria',hp:27};game.save.team.push(c);
 game.startBattle('wispawn',4,'wild');
 game.switchCreature();assert.equal(game.battle.selecting,true);
 game.switchTo(1);assert.equal(game.battle.ally,1);assert.equal(game.battle.selecting,false);
 assert.equal(game.getAlly().speciesId,'velaria');
});
test('runtime: boss enters phase II and warns before charged attack',()=>{
 const {game,dom}=mount();game.startNew();game.pickStarter('thorne');for(let i=0;i<3;i++)game.nextDialog();
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
 const {game,storage}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<3;i++)game.nextDialog();
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
 const {game}=mount();game.startNew();game.pickStarter('velaria');for(let i=0;i<3;i++)game.nextDialog();
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
 const {game,dom}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<3;i++)game.nextDialog();
 game.enterDungeon(false);
 assert.equal(game.save.dungeon?.active,true);
 assert.ok(dom.get('zoneSubtitle').textContent.includes('SELLOS 0/3'));
 const before=game.save.dungeon.tiles;
 game.stick.x=1;game.move(.1);
 assert.equal(game.save.dungeon.tiles,before,'visual changes must not regenerate dungeon');
 assert.ok(dom.get('zoneSubtitle').textContent.includes('SELLOS'));
});

test('runtime: main quest provides guided stages and concludes once when Archivist hears both relics',()=>{
 const {game,dom,storage}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<3;i++)game.nextDialog();
 assert.match(dom.get('missionChip').textContent,/ARCHIVISTA/);
 game.interactNpc('archivist');for(let i=0;i<2;i++)game.nextDialog();
 assert.match(dom.get('missionChip').textContent,/BOSQUE/);
 game.interactLandmark({x:43,y:16,kind:'portal',label:'Bosque'});
 game.interactLandmark({x:43,y:16,kind:'portal',label:'Santuario'});
 assert.match(dom.get('missionChip').textContent,/HOLLOWHART/);
 game.startBattle('hollowhart',12,'boss');game.winBattle();for(let i=0;i<3;i++)game.nextDialog();
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
 for(let i=0;i<3;i++)game.nextDialog();
 game.interactNpc('archivist');assert.equal(game.economy.echoes,before+200);
 assert.equal(game.save.flags.filter(f=>f==='arken-vow-restored').length,1);
 assert.ok(storage.getItem('ascii-azur-save-v1'));
});
test('runtime: talking to the Archivist before clearing the crypt cannot award ending',()=>{
 const {game,dom}=mount();game.startNew();game.pickStarter('thorne');for(let i=0;i<3;i++)game.nextDialog();
 game.interactNpc('archivist');for(let i=0;i<2;i++)game.nextDialog();
 game.interactLandmark({x:43,y:16,kind:'portal',label:'Bosque'});
 game.interactLandmark({x:43,y:16,kind:'portal',label:'Santuario'});
 game.startBattle('hollowhart',12,'boss');game.winBattle();for(let i=0;i<3;i++)game.nextDialog();
 game.save.zone='village';const before=game.economy.echoes;game.interactNpc('archivist');
 assert.equal(game.economy.echoes,before);assert.equal(game.save.flags.includes('arken-vow-restored'),false);
 assert.match(dom.get('diaText').textContent,/Cripta de los Ecos/);
});

test('runtime: story compass follows first objective, responds to portal and preserves legacy saves',()=>{
 const {game,dom,storage}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<3;i++)game.nextDialog();
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
 const {game,dom}=mount();game.startNew();game.pickStarter('cindrel');for(let i=0;i<3;i++)game.nextDialog();
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
