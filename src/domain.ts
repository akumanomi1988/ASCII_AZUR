import {validFieldTarget,type FieldTarget} from './world/field-journal.js';
import {individualStat,validPotential,potentialFromUid,type Potential} from './creatures/attributes.js';
import type {FallenCompanion} from './creatures/crypt-mortality.js';
import {relicAttackFactor,relicGuardFactor,validRelicOwnership,isRelicId,type RelicId,type RelicInventory} from './creatures/equipment.js';
import {validJourneyMetrics,type JourneyMetrics} from './core/journey-metrics.js';
import type {EconomyState} from './rpg.js';
import {validateDungeon,type DungeonRun} from './dungeons/labyrinth.js';
import {validateExpedition,type Expedition} from './expeditions/expedition.js';
import {validateWorldSnapshot,type WorldSnapshot} from './world.js';
import {validDiscovery,type DiscoveryState} from './world/discovery.js';
export type Element = 'Ceniza'|'Bruma'|'Raíz'|'Éter';
export interface Move { id:string; name:string; element:Element; power:number; description:string; role?:'heal'|'drain'|'cleanse'; }
export interface Species { id:string; name:string; title:string; element:Element; color:string; stats:{hp:number; attack:number; defense:number; speed:number}; evo?:{id:string;level:number}; desc:string; shape:number; role?:string; }
export interface Creature {uid:string;speciesId:string;level:number;exp:number;hp:number;moves:string[];knownMoves?:string[];potential?:Potential;equipment?:RelicId;}
/** Serializable combat checkpoint; saved before every interactive command finishes. */
export interface BattleCheckpoint {
 enemy:Creature;type:'wild'|'boss'|'expedition';encounterId?:string;ally:number;guarding:boolean;
 /** Optional for legacy v1 saves. Committed action still awaiting resolution. */
 pending?:'enemy'|'capture'|'victory'|'defeat';
 /** Three restorative casts per creature per battle; absent on legacy checkpoints. */
 recoveryUses?:Record<string,number>;
 bossPhase:1|2;chargeStage:0|1|2;
 effects:Record<string,{kind:'scorch'|'weaken'|'fracture';remaining:number}[]>;
}
export interface SaveGame {fieldTarget?:FieldTarget;primaryUid?:string;fallen?:FallenCompanion[];relics?:RelicInventory;journey?:JourneyMetrics;version:1; zone:string;x:number;y:number;team:Creature[];storage:Creature[];inventory:{seals:number;tonics:number};defeatedBoss:boolean;flags:string[];playSeconds:number;rpg?:EconomyState;worldSeed?:number;worldSnapshot?:WorldSnapshot;discovered?:DiscoveryState;expedition?:Expedition;activeBattle?:BattleCheckpoint;dungeon?:DungeonRun;}
export const MOVES: Record<string,Move> = {
 ember:{id:'ember', name:'Chispa fúnebre',element:'Ceniza',power:12,description:'Brasas que nunca se extinguen'},
 smolder:{id:'smolder',name:'Hoguera rota',element:'Ceniza',power:19,description:'Un fuego que consume recuerdos'},
 fog:{id:'fog',name:'Hálito gris',element:'Bruma',power:12,description:'La niebla de los ausentes'},
 tide:{id:'tide',name:'Marea velada',element:'Bruma',power:19,description:'Disuelve la voluntad del adversario'},
 thorn:{id:'thorn',name:'Zarpa espinada',element:'Raíz',power:12,description:'Raíces que recuerdan la tierra'},
 roots:{id:'roots',name:'Raíz ancestral',element:'Raíz',power:19,description:'La tierra reclama lo perdido'},
 astral:{id:'astral',name:'Eco umbrío',element:'Éter',power:12,description:'Una voz que no pertenece a nadie'},
 void:{id:'void',name:'Ruptura',element:'Éter',power:19,description:'Reescribe un fragmento de realidad'},
 saltwake:{id:'saltwake',name:'Resaca de sal',element:'Bruma',power:23,role:'drain',description:'La marea recoge fuerza de los huesos sumergidos.'},
 winterpsalm:{id:'winterpsalm',name:'Salmo de escarcha',element:'Éter',power:18,role:'cleanse',description:'Una nota clara rompe los sellos del invierno.'},
 pulse:{id:'pulse',name:'Pulso',element:'Éter',power:9,description:'Un golpe de esencia pura'},
 kindle:{id:'kindle',name:'Cántico de lumbre',element:'Ceniza',power:0,role:'heal',description:'Restaura vida mediante una chispa protectora.'},
 flare:{id:'flare',name:'Filo incandescente',element:'Ceniza',power:23,description:'Ataque veloz con calor que deja cicatrices.'},
 emberstorm:{id:'emberstorm',name:'Tormenta de brasas',element:'Ceniza',power:29,description:'Una llamarada que oscurece el horizonte.'},
 ashfang:{id:'ashfang',name:'Mordisco de ceniza',element:'Ceniza',power:21,role:'drain',description:'El fuego bebe la energía del oponente.'},
 funeral:{id:'funeral',name:'Último rescoldo',element:'Ceniza',power:17,role:'cleanse',description:'Purifica los efectos que consumen al portador.'},
 embersong:{id:'embersong',name:'Eco de hogar',element:'Ceniza',power:0,role:'heal',description:'Reaviva la llama del vínculo.'},
 drizzle:{id:'drizzle',name:'Lluvia consoladora',element:'Bruma',power:0,role:'heal',description:'Recupera vida con agua recogida del pasado.'},
 undertow:{id:'undertow',name:'Resaca oscura',element:'Bruma',power:20,role:'drain',description:'Arrebata al enemigo su fuerza líquida.'},
 moonfog:{id:'moonfog',name:'Velo lunar',element:'Bruma',power:14,role:'cleanse',description:'Disipa las cicatrices del combate.'},
 deluge:{id:'deluge',name:'Diluvio del olvido',element:'Bruma',power:28,description:'Una marea implacable de recuerdos.'},
 frostwake:{id:'frostwake',name:'Despertar frío',element:'Bruma',power:23,description:'Un estremecimiento surgido de la niebla.'},
 rilldance:{id:'rilldance',name:'Danza del cauce',element:'Bruma',power:24,description:'Un remolino de movimientos impredecibles.'},
 verdancy:{id:'verdancy',name:'Brote eterno',element:'Raíz',power:0,role:'heal',description:'La tierra devuelve la vida a los vínculos.'},
 vinegrip:{id:'vinegrip',name:'Abrazo espinoso',element:'Raíz',power:21,role:'drain',description:'Enredaderas roban vigor y lo transfieren.'},
 seedburst:{id:'seedburst',name:'Estallido de semillas',element:'Raíz',power:25,description:'Las semillas de piedra explotan al contacto.'},
 barkskin:{id:'barkskin',name:'Corteza antigua',element:'Raíz',power:12,role:'cleanse',description:'La corteza sana heridas espirituales.'},
 bramble:{id:'bramble',name:'Corona de zarzas',element:'Raíz',power:27,description:'Las raíces se alzan en defensa del bosque.'},
 harvest:{id:'harvest',name:'Siega de bruma',element:'Raíz',power:23,description:'Segadura de hojas afiladas.'},
 echoheal:{id:'echoheal',name:'Recomponer el nombre',element:'Éter',power:0,role:'heal',description:'Reconstruye una parte de la identidad perdida.'},
 siphon:{id:'siphon',name:'Robo de recuerdos',element:'Éter',power:21,role:'drain',description:'Recupera fuerza a partir de un recuerdo ajeno.'},
 absolve:{id:'absolve',name:'Absolución',element:'Éter',power:14,role:'cleanse',description:'Disuelve una alteración de la esencia.'},
 runeburst:{id:'runeburst',name:'Alfabeto roto',element:'Éter',power:26,description:'Glifos violentos atraviesan la realidad.'},
 eclipse:{id:'eclipse',name:'Eclipse sin voz',element:'Éter',power:30,description:'Un silencio capaz de partir el cielo.'},
 mothdust:{id:'mothdust',name:'Polvo de umbral',element:'Éter',power:24,description:'Sombras de alas borran la memoria.'},
 starlash:{id:'starlash',name:'Látigo de estrellas',element:'Éter',power:25,description:'Un haz que escribe heridas en el aire.'},
 lament:{id:'lament',name:'Lamento de la viuda',element:'Bruma',power:15,role:'cleanse',description:'Una canción de lluvia que purifica el vínculo.'},
 sigilbite:{id:'sigilbite',name:'Mordedura del signo',element:'Éter',power:20,role:'drain',description:'Roba vigor y abre una grieta en el nombre rival.'},
 bellguard:{id:'bellguard',name:'Campanada del umbral',element:'Raíz',power:14,description:'Un tañido de raíces abre fracturas en la defensa rival.'},
 glassflare:{id:'glassflare',name:'Ascua de cristal',element:'Ceniza',power:23,description:'Cuchillas ígneas que dejan ardor persistente.'},

};
export const SPECIES:Record<string,Species>={
 cindrel:{id:'cindrel',name:'Cindrel',title:'Zorro de brasas',element:'Ceniza',color:'#e78b60',stats:{hp:40,attack:15,defense:11,speed:14},evo:{id:'cinderwulf',level:9},desc:'De su pelaje cae una lluvia de ceniza caliente.',shape:0},
 cinderwulf:{id:'cinderwulf',name:'Cinderwulf',title:'Lobo del último fuego',element:'Ceniza',color:'#f3a678',stats:{hp:54,attack:24,defense:16,speed:18},desc:'Custodia las hogueras de los viajeros desaparecidos.',shape:5},
 velaria:{id:'velaria',name:'Velaria',title:'Espíritu de niebla',element:'Bruma',color:'#8abed1',stats:{hp:43,attack:13,defense:14,speed:13},evo:{id:'mourveil',level:12},desc:'Su rostro solo aparece cuando llueve.',shape:1},
 thorne:{id:'thorne',name:'Thorne',title:'Guardián del musgo',element:'Raíz',color:'#9abf81',stats:{hp:47,attack:12,defense:16,speed:8},desc:'Las flores nacen donde descansan sus huellas.',shape:2},
 wispawn:{id:'wispawn',name:'Wispawn',title:'Llama de los nombres',element:'Éter',color:'#c0a7ee',stats:{hp:32,attack:15,defense:9,speed:18},evo:{id:'mnemoshade',level:13},desc:'Imita los nombres de los que han sido olvidados.',shape:3},
 gravemoth:{id:'gravemoth',name:'Gravemoth',title:'Polilla del luto',element:'Éter',color:'#b0a6d6',stats:{hp:36,attack:16,defense:10,speed:16},desc:'Sus alas parecen páginas de un libro quemado.',shape:4},
 mireling:{id:'mireling',name:'Mireling',title:'Errante del pantano',element:'Bruma',color:'#7eb7ac',stats:{hp:44,attack:12,defense:15,speed:10},desc:'Guarda pequeños recuerdos en su cuerpo de barro.',shape:2},
 runeowl:{id:'runeowl',name:'Runeowl',title:'Búho de las inscripciones',element:'Éter',color:'#c5c5fa',stats:{hp:38,attack:19,defense:9,speed:18},desc:'Sus plumas contienen frases que solo la luna puede leer.',shape:7},
 ashboar:{id:'ashboar',name:'Ashboar',title:'Jabalí de escoria',element:'Ceniza',color:'#eaa079',stats:{hp:51,attack:20,defense:14,speed:8},desc:'Se alimenta de carbones y deja una estela de chispas.',shape:8},
 rillfin:{id:'rillfin',name:'Rillfin',title:'Pez de los caminos',element:'Bruma',color:'#81d9df',stats:{hp:34,attack:14,defense:11,speed:20},desc:'Nada entre charcos y recuerdos de lluvia.',shape:9},
 briarling:{id:'briarling',name:'Briarling',title:'Semilla errante',element:'Raíz',color:'#c0d78d',stats:{hp:36,attack:12,defense:14,speed:12},evo:{id:'thorne',level:8},desc:'Cada amanecer le crece una hoja que no recuerda.',shape:10},
 mourveil:{id:'mourveil',name:'Mourveil',title:'Viuda del rocío',element:'Bruma',color:'#a6dfe0',stats:{hp:59,attack:17,defense:18,speed:18},desc:'Su velo recoge las lágrimas de quienes aún recuerdan.',shape:12,role:'SOPORTE · BRUMA Y PURIFICACIÓN'},
 mnemoshade:{id:'mnemoshade',name:'Mnemoshade',title:'Sombra del nombre partido',element:'Éter',color:'#baa2ee',stats:{hp:47,attack:25,defense:13,speed:23},desc:'Habita entre los glifos que dejaron de pronunciarse.',shape:13,role:'HOSTIGADOR · DRENAJE Y FRACTURA'},
 bellroot:{id:'bellroot',name:'Bellroot',title:'Campana de raíces',element:'Raíz',color:'#a8cb88',stats:{hp:62,attack:13,defense:23,speed:6},desc:'Bajo la marisma, cada tañido suyo protege una memoria.',shape:14,role:'GUARDIÁN · RESISTENCIA Y FRACTURA'},
 ashglass:{id:'ashglass',name:'Ashglass',title:'Ave del vidrio ardiente',element:'Ceniza',color:'#f4b67d',stats:{hp:39,attack:25,defense:9,speed:25},desc:'Sus alas cortan el aire como fragmentos de sol roto.',shape:15,role:'ASALTANTE · VELOCIDAD Y ARDOR'},
 tideworn:{id:'tideworn',name:'Tideworn',title:'Caracol de los sepultados',element:'Bruma',color:'#98e3d7',stats:{hp:58,attack:18,defense:21,speed:11},desc:'Lleva una catedral marina dentro de su concha; cada vuelta guarda un juramento.',shape:16,role:'BASTIÓN · DRENAJE DE MAREA'},
 frostlark:{id:'frostlark',name:'Frostlark',title:'Alondra del invierno imposible',element:'Éter',color:'#d6ecff',stats:{hp:43,attack:24,defense:13,speed:26},desc:'Canta cuando una criatura decide florecer pese a la nieve.',shape:17,role:'CANTORA · LIMPIEZA Y VELOCIDAD'},
 nullscribe:{id:'nullscribe',name:'Nullscribe',title:'Escriba de los nombres imposibles',element:'Éter',color:'#ddb4ff',stats:{hp:82,attack:20,defense:17,speed:14},desc:'Su cuerpo contiene las páginas vacías que sostuvieron el cielo.',shape:11},
 hollowhart:{id:'hollowhart',name:'Hollowhart',title:'Ciervo del silencio',element:'Raíz',color:'#d9bd9c',stats:{hp:66,attack:22,defense:20,speed:12},desc:'Último guardián de las palabras originales.',shape:6}
};
export const TYPE_ADV:Record<Element,Element>={Ceniza:'Raíz',Raíz:'Bruma',Bruma:'Éter',Éter:'Ceniza'};
export const BASE_MOVES:Record<Element,string[]>={Ceniza:['ember','pulse','smolder'],Bruma:['fog','pulse','tide'],Raíz:['thorn','pulse','roots'],Éter:['astral','pulse','void']};
/** Each species has a signature move. Learned at level 7 and preserved across legacy saves. */
export const SIGNATURE_MOVES:Readonly<Record<string,string>>={
 cindrel:'ashfang',cinderwulf:'emberstorm',velaria:'drizzle',thorne:'vinegrip',
 wispawn:'siphon',gravemoth:'mothdust',mireling:'undertow',runeowl:'runeburst',
 ashboar:'flare',rillfin:'rilldance',briarling:'verdancy',mourveil:'lament',mnemoshade:'sigilbite',bellroot:'bellguard',ashglass:'glassflare',tideworn:'saltwake',frostlark:'winterpsalm',hollowhart:'eclipse',nullscribe:'eclipse'
};
export function learnableMoves(speciesId:string,level:number):string[]{
 const s=SPECIES[speciesId];if(!s)throw Error('Especie desconocida');
 const base=BASE_MOVES[s.element].slice(0,level>=7?3:2);
 return level>=7?[...base,SIGNATURE_MOVES[speciesId]!]:base;
}
export function maxHp(c:Creature):number {const s=SPECIES[c.speciesId];return s?individualStat(s.stats.hp+(c.level-1)*4,c.potential?.hp):30;}
export function attackValue(c:Creature):number {const s=SPECIES[c.speciesId];return individualStat((s?.stats.attack ?? 10)+Math.floor(c.level*1.6),c.potential?.attack);}
export function defenseValue(c:Creature):number {const s=SPECIES[c.speciesId];return individualStat((s?.stats.defense ?? 10)+Math.floor(c.level*1.2),c.potential?.defense);}
export function speedValue(c:Creature):number{return individualStat((SPECIES[c.speciesId]?.stats.speed??10)+c.level,c.potential?.speed);}
export function escapeChance(ally:Creature,enemy:Creature):number{return Math.max(.65,Math.min(.96,.86+(speedValue(ally)-speedValue(enemy))*.008));}
export function damage(attacker:Creature,defender:Creature,move:Move,roll=1):{value:number;effective:boolean}{const a=SPECIES[attacker.speciesId],d=SPECIES[defender.speciesId]; if(!a||!d)return{value:0,effective:false}; const effective=TYPE_ADV[move.element]===d.element; const same=a.element===move.element?1.2:1;let mult=effective?1.45:TYPE_ADV[d.element]===move.element?0.8:1;if(move.role==='heal'||move.power<=0)return{value:0,effective:false};const raw=(move.power * (attackValue(attacker)/Math.max(5,defenseValue(defender))) * .66 + attacker.level*.55)*same*mult*roll*relicAttackFactor(attacker,move.element)*relicGuardFactor(defender);return {value:Math.max(1,Math.floor(raw)),effective};}
export function createCreature(speciesId:string, level:number, rng=Math.random):Creature{const sp=SPECIES[speciesId];if(!sp)throw Error('Especie desconocida');const c:Creature={uid:`${speciesId}-${Math.floor(rng()*1000000000)}`,speciesId,level,exp:0,hp:1,moves:learnableMoves(speciesId,level)};c.potential=potentialFromUid(c.uid);c.knownMoves=[...c.moves];c.hp=maxHp(c);return c;}
export function gainExp(c:Creature,amount:number):{levelUp:boolean;evolved:boolean}{
 const before=c.level,previous=c.speciesId,s=SPECIES[previous];c.exp+=amount;
 while(c.level<30&&c.exp>=c.level*12){c.exp-=c.level*12;c.level++;}
 let evolved=false;if(s?.evo&&c.level>=s.evo.level){c.speciesId=s.evo.id;evolved=true;}
 const learned=[...new Set([...(c.knownMoves??[]),...c.moves,...learnableMoves(previous,c.level),...learnableMoves(c.speciesId,c.level)])];
 c.knownMoves=learned;
 // Never replace an active technique on level-up or evolution; only fill empty slots.
 const active=[...c.moves];for(const id of learned)if(active.length<4&&!active.includes(id))active.push(id);
 c.moves=active;c.hp=Math.min(maxHp(c),c.hp+(c.level-before)*5+(evolved?12:0));
 return{levelUp:c.level>before,evolved};
}
export const SAVE_KEY='ascii-azur-save-v1';
export function validateBattleCheckpoint(value:unknown,team:Creature[]):value is BattleCheckpoint{
 if(!value||typeof value!=='object'||!Array.isArray(team))return false;
 const b=value as Partial<BattleCheckpoint>,e=b.enemy as Partial<Creature>|undefined;
 if(e?.equipment!==undefined)return false;
 if(e?.potential!==undefined&&!validPotential(e.potential))return false;
 if(e?.knownMoves!==undefined&&(!Array.isArray(e.knownMoves)||e.knownMoves.length>Object.keys(MOVES).length||new Set(e.knownMoves).size!==e.knownMoves.length||e.knownMoves.some(id=>typeof id!=='string'||!Object.prototype.hasOwnProperty.call(MOVES,id))))return false;
 if(!e||typeof e.uid!=='string'||e.uid.length>80||typeof e.speciesId!=='string'||!Object.prototype.hasOwnProperty.call(SPECIES,e.speciesId)||!Number.isInteger(e.level)||e.level!<1||e.level!>30||!Number.isInteger(e.hp)||e.hp!<0||e.hp!>maxHp(e as Creature)||!Number.isInteger(e.exp)||e.exp!<0||!Array.isArray(e.moves)||e.moves.length<1||e.moves.length>4||e.moves.some(m=>typeof m!=='string'||!Object.prototype.hasOwnProperty.call(MOVES,m)))return false;
 if(!['wild','boss','expedition'].includes(b.type||'')||!Number.isInteger(b.ally)||b.ally!<0||b.ally!>=team.length||typeof b.guarding!=='boolean'||![1,2].includes(b.bossPhase||0)||![0,1,2].includes(b.chargeStage??-1))return false;
 if(b.pending!==undefined&&!['enemy','capture','victory','defeat'].includes(b.pending))return false;
 if(b.encounterId!==undefined&&(!/^(forest|sanctuary|marsh|spire|ossuary|garden)-[0-2]$/.test(b.encounterId)))return false;
 if(b.recoveryUses!==undefined&&(!b.recoveryUses||typeof b.recoveryUses!=='object'||Array.isArray(b.recoveryUses)||Object.keys(b.recoveryUses).length>7||Object.entries(b.recoveryUses).some(([uid,n])=>!team.some(c=>c.uid===uid)&&uid!==e.uid||!Number.isInteger(n)||n<0||n>3)))return false;
 if(!b.effects||typeof b.effects!=='object'||Array.isArray(b.effects)||Object.keys(b.effects).length>8)return false;
 return Object.entries(b.effects).every(([key,list])=>key.length<85&&Array.isArray(list)&&list.length<=3&&list.every(s=>!!s&&['scorch','weaken','fracture'].includes(s.kind)&&Number.isInteger(s.remaining)&&s.remaining>=1&&s.remaining<=5));
}
export function validateSave(data:unknown):data is SaveGame {
 if(!data||typeof data!=='object')return false;
 const v=data as Partial<SaveGame>;
 const validCreature=(c:unknown):c is Creature=>{
  if(!c||typeof c!=='object')return false;const a=c as Partial<Creature>;
  return (a.potential===undefined||validPotential(a.potential))&&(a.knownMoves===undefined||(Array.isArray(a.knownMoves)&&a.knownMoves.length<=Object.keys(MOVES).length&&new Set(a.knownMoves).size===a.knownMoves.length&&a.knownMoves.every(id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(MOVES,id))))&&(a.equipment===undefined||isRelicId(a.equipment))&&typeof a.speciesId==='string'&&Object.prototype.hasOwnProperty.call(SPECIES,a.speciesId)&&typeof a.uid==='string'&&a.uid.length<=80&&Number.isInteger(a.level)&&a.level!>0&&a.level!<=30&&Number.isInteger(a.exp)&&a.exp!>=0&&Number.isInteger(a.hp)&&a.hp!>=0&&a.hp!<=maxHp(a as Creature)&&Array.isArray(a.moves)&&a.moves.length>=1&&a.moves.length<=4&&a.moves.every(m=>typeof m==='string'&&Object.prototype.hasOwnProperty.call(MOVES,m));
 };
 return v.version===1&&['village','forest','sanctuary','marsh','spire','ossuary','garden'].includes(v.zone||'')
 &&typeof v.x==='number'&&Number.isFinite(v.x)&&v.x>=0&&v.x<46
 &&typeof v.y==='number'&&Number.isFinite(v.y)&&v.y>=0&&v.y<32
 &&Array.isArray(v.team)&&v.team.length>0&&v.team.length<=6&&v.team.every(validCreature)
 &&Array.isArray(v.storage)&&v.storage.length<=500&&v.storage.every(validCreature)
 &&new Set([...v.team,...v.storage].map(c=>c.uid)).size===v.team.length+v.storage.length
 &&(v.primaryUid===undefined||(typeof v.primaryUid==='string'&&v.team.some(c=>c.uid===v.primaryUid)))
 &&(v.fallen===undefined||(Array.isArray(v.fallen)&&v.fallen.length<=200&&new Set(v.fallen.map(c=>c?.uid)).size===v.fallen.length&&v.fallen.every(c=>c&&typeof c.uid==='string'&&c.uid.length<=80&&typeof c.speciesId==='string'&&Object.prototype.hasOwnProperty.call(SPECIES,c.speciesId)&&Number.isInteger(c.level)&&c.level>=1&&c.level<=30&&![...v.team!,...v.storage!].some(live=>live.uid===c.uid))))
 &&(v.fieldTarget===undefined||validFieldTarget(v.fieldTarget))
 &&validRelicOwnership(v.relics,[...v.team,...v.storage])&&validJourneyMetrics(v.journey)
 &&!!v.inventory&&Number.isInteger(v.inventory.seals)&&v.inventory.seals>=0&&v.inventory.seals<=9999
 &&Number.isInteger(v.inventory.tonics)&&v.inventory.tonics>=0&&v.inventory.tonics<=9999
 &&Array.isArray(v.flags)&&v.flags.length<=200&&v.flags.every(f=>typeof f==='string'&&f.length<100)
 &&(!v.rpg||(Number.isSafeInteger(v.rpg.echoes)&&v.rpg.echoes>=0&&v.rpg.echoes<=999999&&Array.isArray(v.rpg.completed)&&v.rpg.completed.length<=100&&v.rpg.completed.every(f=>typeof f==='string'&&f.length<100)&&Array.isArray(v.rpg.visitedNpcs)&&v.rpg.visitedNpcs.length<=50&&v.rpg.visitedNpcs.every(f=>typeof f==='string'&&f.length<100)))
 && (v.worldSeed===undefined||(Number.isInteger(v.worldSeed)&&v.worldSeed>=0&&v.worldSeed<=4294967295))
 &&(v.worldSnapshot===undefined||(v.worldSeed!==undefined&&v.worldSeed>0&&validateWorldSnapshot(v.worldSnapshot)))
 &&(v.activeBattle===undefined||(validateBattleCheckpoint(v.activeBattle,v.team as Creature[])&&(v.activeBattle.type!=='expedition'||!!v.expedition?.pending)))
 &&(v.discovered===undefined||validDiscovery(v.discovered))
 &&(v.expedition===undefined||validateExpedition(v.expedition))
 &&(v.dungeon===undefined||validateDungeon(v.dungeon))
 &&typeof v.defeatedBoss==='boolean'&&typeof v.playSeconds==='number'&&Number.isFinite(v.playSeconds)&&v.playSeconds>=0;
}
