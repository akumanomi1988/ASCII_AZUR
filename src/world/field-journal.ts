/** Read-only regional objectives and bounded, explicit world transactions. */
import type {SaveGame} from '../domain.js';
import {ZONES,ZONE_IDS,canOccupy,getWorldRevision,type ZoneId,type Landmark} from '../world.js';
import {isDiscovered,reveal} from './discovery.js';
import {visibleEncounters} from './encounters.js';
import {afterlightProgress,afterlightFlag} from '../story-afterlight.js';
import {landmarkFieldHint,witnessFieldHint} from './exploration-flow.js';
export interface FieldTarget {zone:ZoneId;id:string;}
export interface FieldObjective {id:string;zone:ZoneId;kind:string;label:string;hint:string;known:boolean;done:boolean;trackable:boolean;x?:number;y?:number;}
export function validFieldTarget(value:unknown):value is FieldTarget{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as FieldTarget;
 return ZONE_IDS.includes(v.zone)&&typeof v.id==='string'&&/^(site:([0-9]|1[0-5])|witness:[0-2]|crypt|epilogue)$/.test(v.id)&&Object.keys(v).length===2;
}
export function regionUnlocked(save:Pick<SaveGame,'flags'>,zone:ZoneId):boolean{
 switch(zone){case 'marsh':return save.flags.includes('arken-vow-restored');case 'spire':return save.flags.includes('marsh-chapter-complete');
 case 'ossuary':return save.flags.includes('crown-trilogy-complete');case 'garden':return afterlightProgress('ossuary',save.flags).complete;default:return true;}
}
export function regionKnown(save:SaveGame,zone:ZoneId):boolean{
 return save.zone===zone||save.flags.includes('zone-'+zone)||save.flags.includes('altar-'+zone)||!!save.discovered?.[zone]?.includes('1');
}
const has=(save:SaveGame,key:string)=>save.flags.includes(key);
function siteDone(save:SaveGame,zone:ZoneId,l:Landmark):boolean{
 if(l.kind==='altar')return has(save,'altar-'+zone);
 if(l.kind==='chest')return has(save,`chest-${zone}-${l.x}`);
 if(l.kind==='rune')return has(save,'rune-'+zone);
 if(l.kind==='guardian')return zone==='spire'?has(save,'crown-nullscribe-fallen'):save.defeatedBoss;
 if(l.kind==='memory')return has(save,zone==='marsh'?'marsh-memory-'+l.npcId:zone==='spire'?'crown-relic-'+l.npcId:afterlightFlag(zone as 'ossuary'|'garden','memory-'+l.npcId));
 if(l.kind==='verdict')return zone==='marsh'?save.flags.some(f=>f==='marsh-choice-keep'||f==='marsh-choice-release'):zone==='spire'?save.flags.some(f=>f==='crown-choice-remember'||f==='crown-choice-renew'):afterlightProgress(zone as 'ossuary'|'garden',save.flags).complete;
 if(l.kind==='npc'){
  if(zone==='ossuary'||zone==='garden')return has(save,afterlightFlag(zone,'met'));
  if(l.npcId==='nael')return has(save,'marsh-met-nael');if(l.npcId==='oriel')return has(save,'crown-met-oriel');
  return !!save.rpg?.visitedNpcs.includes(l.npcId??'')||has(save,l.npcId==='archivist'?'archivist':l.npcId==='pilgrim'?'pilgrim-met':l.npcId==='merchant'?'merchant-met':'npc-'+l.npcId);
 }
 return false;
}
const kindHint:Record<string,string>={altar:'Descansa e incorpora esta Lumbre a la red.',chest:'Abre el cofre; los suministros y reliquias son finitos.',rune:'Resuelve su secuencia con la pista de la inscripción.',guardian:'Supera el desafío; prepara equipo y técnicas.',memory:'Escucha el recuerdo tras conocer al custodio.',verdict:'Resuelve los requisitos y elige un desenlace permanente.',npc:'Habla con este personaje.'};
const journalEncounters=new Map<ZoneId,{seed:number;entries:ReturnType<typeof visibleEncounters>}>();
let journalRevision=-1;
function fieldWitnesses(save:SaveGame,zone:ZoneId){
 const revision=getWorldRevision();if(revision!==journalRevision){journalRevision=revision;journalEncounters.clear();}
 const seed=save.worldSeed??0,cached=journalEncounters.get(zone);
 if(cached?.seed===seed)return cached.entries;
 const entries=visibleEncounters(zone,seed);journalEncounters.set(zone,{seed,entries});return entries;
}
export function regionalObjectives(save:SaveGame,zone:ZoneId):FieldObjective[]{
 const unlocked=regionUnlocked(save,zone),seen=(x:number,y:number)=>isDiscovered(save.discovered,zone,x,y,!save.worldSeed);
 const entries:FieldObjective[]=ZONES[zone].landmarks.flatMap((site,index)=>{
  if(site.kind==='portal')return[];
  const done=siteDone(save,zone,site),known=done||seen(site.x,site.y),trackable=known&&unlocked&&(!done||site.kind==='altar'||site.kind==='npc');
  return [{id:'site:'+index,zone,kind:site.kind,known,done,trackable,label:known?site.label:'Lugar por descubrir',hint:known?landmarkFieldHint(zone,site,done):'Recorre los caminos para encontrarlo.',...(known?{x:site.x,y:site.y}:{})}];
 });
 for(const encounter of fieldWitnesses(save,zone)){
  const done=has(save,'roamer-'+encounter.id),known=done||seen(encounter.x,encounter.y);
  entries.push({id:'witness:'+encounter.id.slice(-1),zone,kind:'witness',known,done,trackable:known&&unlocked&&!done,label:known?'Testigo errante '+(Number(encounter.id.slice(-1))+1):'Testigo por descubrir',hint:known?witnessFieldHint(zone,Number(encounter.id.slice(-1)),encounter.speciesId,done):'Explora el sendero para encontrar su rastro.',...(known?{x:encounter.x,y:encounter.y}:{})});
 }
 if(zone==='village')entries.push({id:'crypt',zone,kind:'crypt',label:'Cripta de los Ecos',hint:'En Arken: Menú → Cripta explorable. Las bajas de compañeros son permanentes.',known:regionKnown(save,zone),done:!!save.dungeon?.finished,trackable:regionKnown(save,zone)&&!save.dungeon?.finished});
 if(zone==='ossuary'||zone==='garden'){
  const npc=ZONES[zone].landmarks.find(l=>l.kind==='npc')!,known=has(save,afterlightFlag(zone,'met')),done=has(save,afterlightFlag(zone,'epilogue'));
  entries.push({id:'epilogue',zone,kind:'epilogue',known,done,trackable:known&&afterlightProgress(zone,save.flags).complete&&!done,label:known?'Regresa al custodio':'Epílogo por descubrir',hint:'Tras tu decisión, vuelve a escuchar al custodio.',...(known?{x:npc.x,y:npc.y}:{})});
 }
 return entries;
}
export const SURVEY_REWARDS:Readonly<Record<ZoneId,{echoes:number;seals:number;tonics:number}>>={village:{echoes:35,seals:1,tonics:1},forest:{echoes:45,seals:1,tonics:1},sanctuary:{echoes:60,seals:1,tonics:1},marsh:{echoes:75,seals:1,tonics:1},spire:{echoes:90,seals:1,tonics:1},ossuary:{echoes:100,seals:1,tonics:1},garden:{echoes:110,seals:1,tonics:1}};
export function regionalSurvey(save:SaveGame,zone:ZoneId){
 const entries=regionalObjectives(save,zone),done=entries.filter(e=>e.done).length;
 const claimed=has(save,'survey-'+zone),complete=entries.length>0&&done===entries.length;
 return{zone,entries,done,total:entries.length,complete,claimed,ready:regionKnown(save,zone)&&regionUnlocked(save,zone)&&complete&&!claimed,reward:SURVEY_REWARDS[zone]};
}
export function resolveFieldTarget(save:SaveGame):FieldObjective|null{
 const target=save.fieldTarget;if(!target||!validFieldTarget(target)||!regionKnown(save,target.zone))return null;
 const objective=regionalObjectives(save,target.zone).find(o=>o.id===target.id);return objective?.trackable?objective:null;
}
export function planFieldTarget(save:SaveGame,target:FieldTarget|null):SaveGame|null{
 if(save.activeBattle)return null;
 if(target===null){const next={...save};delete next.fieldTarget;return next;}
 if(!validFieldTarget(target))return null;
 const next={...save,fieldTarget:{...target}};return resolveFieldTarget(next)?next:null;
}
/** No flag, inventory or balance changes until the caller durably commits this snapshot. */
export function planSurveyClaim(save:SaveGame,zone:ZoneId):SaveGame|null{
 if(!ZONE_IDS.includes(zone)||save.activeBattle||save.dungeon?.active||save.expedition)return null;
 const survey=regionalSurvey(save,zone),r=survey.reward,e=save.rpg;
 if(!survey.ready||!e||save.flags.length>=200||e.echoes+r.echoes>999999||save.inventory.seals+r.seals>9999||save.inventory.tonics+r.tonics>9999)return null;
 return{...save,flags:[...save.flags,'survey-'+zone],rpg:{...e,echoes:e.echoes+r.echoes},inventory:{seals:save.inventory.seals+r.seals,tonics:save.inventory.tonics+r.tonics}};
}
export function travelRefusal(save:SaveGame,destination:ZoneId):string|null{
 if(!ZONE_IDS.includes(destination))return'DESTINO INVÁLIDO';
 if(save.activeBattle||save.dungeon?.active||save.expedition)return'TERMINA EL COMBATE, LA CRIPTA O LA EXPEDICIÓN';
 if(!save.team.some(c=>c.hp>0))return'EL EQUIPO NECESITA RECUPERARSE';
 const zone=save.zone as ZoneId,origin=ZONES[zone].landmarks.find(l=>l.kind==='altar');
 if(!origin||Math.hypot(origin.x-save.x,origin.y-save.y)>2.15||!has(save,'altar-'+zone))return'VIAJA DESDE UNA LUMBRE EN LA QUE YA HAYAS DESCANSADO';
 if(zone===destination)return'YA ESTÁS EN ESTA REGIÓN';
 if(!regionUnlocked(save,destination)||!has(save,'altar-'+destination))return'PRIMERO ALCANZA Y VISITA LA LUMBRE DE DESTINO';
 return null;
}
export function planLumbreTravel(save:SaveGame,destination:ZoneId):SaveGame|null{
 if(travelRefusal(save,destination))return null;
 const point=ZONES[destination].landmarks.find(l=>l.kind==='altar');
 if(!point||!canOccupy(destination,point.x,point.y,.19))return null;
 return{...save,zone:destination,x:point.x,y:point.y,discovered:reveal(save.discovered,destination,point.x,point.y)};
}
/** Closed portals are not a valid shortcut to a tracked objective in another region. */
export function nextFieldPortal(save:SaveGame,destination:ZoneId):Landmark|null{
 if(save.zone===destination||!regionUnlocked(save,destination))return null;
 const direction=ZONE_IDS.indexOf(destination)>ZONE_IDS.indexOf(save.zone as ZoneId)?1:-1;
 const next=ZONE_IDS[ZONE_IDS.indexOf(save.zone as ZoneId)+direction];
 if(!next||!regionUnlocked(save,next))return null;
 return ZONES[save.zone as ZoneId].landmarks.find(l=>l.kind==='portal'&&(direction>0?l.x>20:l.x<10))??null;
}
export function afterlightOverview(save:SaveGame){
 const chapters=(['ossuary','garden'] as const).map(zone=>{
  const p=afterlightProgress(zone,save.flags),epilogue=has(save,afterlightFlag(zone,'epilogue'));
  return{zone,...p,epilogue,done:Number(p.met)+p.memories+p.witnesses+Number(!!p.choice)+Number(epilogue),total:8 as const};
 });
 return{chapters,done:chapters.reduce((n,c)=>n+c.done,0),total:16,complete:chapters.every(c=>c.done===c.total)};
}
