/** One optional relic slot. Ownership counts include equipped copies, across team and reserve. */
import type {Creature,Element,SaveGame} from '../domain.js';
export const RELICS={
 'ember-tooth':{name:'Colmillo de Ascua',description:'+12 % de daño de Ceniza.',cost:60,element:'Ceniza'},
 'mist-pearl':{name:'Perla de Bruma',description:'+12 % de daño de Bruma.',cost:60,element:'Bruma'},
 'root-knot':{name:'Nudo de Raíz',description:'+12 % de daño de Raíz.',cost:60,element:'Raíz'},
 'echo-prism':{name:'Prisma del Eco',description:'+12 % de daño de Éter.',cost:60,element:'Éter'},
 'pilgrim-ward':{name:'Amparo del Peregrino',description:'Reduce un 10 % el daño de los ataques recibidos. No reduce ARDOR.',cost:45,element:null},
 'hearth-bead':{name:'Cuenta de Lumbre',description:'+20 % de curación con técnicas, drenaje y tónicos. No revive.',cost:55,element:null}
} as const;
export type RelicId=keyof typeof RELICS;
export type RelicInventory=Partial<Record<RelicId,number>>;
export const RELIC_IDS=Object.keys(RELICS) as RelicId[];
export const RELIC_COPY_LIMIT=6;
export function isRelicId(value:unknown):value is RelicId{return typeof value==='string'&&Object.hasOwn(RELICS,value);}
export function relicAttackFactor(c:Creature,element:Element):number{return c.equipment&&RELICS[c.equipment]?.element===element?1.12:1;}
export function relicGuardFactor(c:Creature):number{return c.equipment==='pilgrim-ward'?.90:1;}
export function relicHealingFactor(c:Creature):number{return c.equipment==='hearth-bead'?1.20:1;}
export function equippedCopies(save:Pick<SaveGame,'team'|'storage'>,id:RelicId):number{return [...save.team,...save.storage].filter(c=>c.equipment===id).length;}
export function freeRelicCopies(save:Pick<SaveGame,'team'|'storage'|'relics'>,id:RelicId):number{return Math.max(0,(save.relics?.[id]??0)-equippedCopies(save,id));}
export function validRelicOwnership(relics:unknown,roster:readonly Creature[]):boolean{
 if(relics!==undefined&&(!relics||typeof relics!=='object'||Array.isArray(relics)))return false;
 const counts=relics as RelicInventory|undefined;
 if(counts&&Object.entries(counts).some(([id,n])=>!isRelicId(id)||!Number.isInteger(n)||n<1||n>RELIC_COPY_LIMIT))return false;
 for(const c of roster)if(c.equipment!==undefined&&!isRelicId(c.equipment))return false;
 return RELIC_IDS.every(id=>roster.filter(c=>c.equipment===id).length<=(counts?.[id]??0));
}
/** Refuse before spending or changing equipment. Equipment can never create copies. */
export function setCreatureRelic(save:SaveGame,uid:string,id:RelicId|null):boolean{
 if(save.activeBattle)return false;
 const roster=[...save.team,...save.storage],matches=roster.filter(c=>c.uid===uid);
 if(matches.length!==1||!validRelicOwnership(save.relics,roster))return false;
 const creature=matches[0]!;
 if(id!==null&&(!isRelicId(id)||(creature.equipment!==id&&freeRelicCopies(save,id)<1)))return false;
 if(id===null)delete creature.equipment;else creature.equipment=id;
 return true;
}
export function buyRelic(save:SaveGame,id:RelicId):boolean{
 if(save.activeBattle||!isRelicId(id)||!save.rpg||save.rpg.echoes<RELICS[id].cost||(save.relics?.[id]??0)>=RELIC_COPY_LIMIT)return false;
 save.rpg.echoes-=RELICS[id].cost;save.relics={...save.relics,[id]:(save.relics?.[id]??0)+1};return true;
}
/** A finite exploration reward is independent of repeatable combat loot. Old saves can claim it once. */
export function grantRelic(save:SaveGame,id:RelicId,flag:string):boolean{
 if(save.activeBattle||!isRelicId(id)||save.flags.includes(flag)||(save.relics?.[id]??0)>=RELIC_COPY_LIMIT||save.flags.length>=200)return false;
 save.relics={...save.relics,[id]:(save.relics?.[id]??0)+1};save.flags.push(flag);return true;
}
export const CACHE_RELICS:Readonly<Record<string,RelicId>>={village:'pilgrim-ward',forest:'ember-tooth',sanctuary:'mist-pearl',marsh:'hearth-bead',spire:'echo-prism',ossuary:'pilgrim-ward',garden:'root-knot'};
