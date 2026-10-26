/** Seven authored three-act field trails. Every act is earned through an existing
 * real landmark or roaming witness; progress is projected from save-v1 state.
 * The only new persistent state is one bounded, once-only reward flag per zone. */
import type {SaveGame} from '../domain.js';
import {RELICS,RELIC_IDS,RELIC_COPY_LIMIT,type RelicId} from '../creatures/equipment.js';
import {ZONES,ZONE_IDS,type ZoneId} from '../world.js';
import {regionalObjectives,regionKnown,regionUnlocked,type FieldObjective} from './field-journal.js';

interface TrailAct {kind:'npc'|'rune'|'memory'|'altar'|'guardian'|'witness';title:string;meaning:string;npc?:string;index?:number;}
interface TrailDefinition {title:string;opening:string;resolution:string;reward:RelicId;echoes:number;acts:readonly [TrailAct,TrailAct,TrailAct];}
const TRAILS:Record<ZoneId,TrailDefinition>={
 village:{
  title:'EL NOMBRE QUE FALTA',opening:'Iria necesita algo más que una promesa: una prueba de que Arken puede recordar.',resolution:'El Archivista reconoce las tres huellas de Arken. La Lumbre responde a la voz de Iria.',reward:'hearth-bead',echoes:20,
  acts:[{kind:'npc',npc:'archivist',title:'Escucha al Archivista',meaning:'Una ausencia recibe un nombre.'},{kind:'rune',title:'Lee la piedra del origen',meaning:'La aldea recuerda su primer juramento.'},{kind:'altar',title:'Enciende la Lumbre de Arken',meaning:'La memoria encuentra refugio.'}]
 },
 forest:{
  title:'LO QUE RESISTEN LAS RAÍCES',opening:'Un peregrino extraviado y un testigo errante guardan dos partes del mismo juramento.',resolution:'El Peregrino encuentra una señal que podrá llevar de vuelta a Arken: las raíces todavía escuchan.',reward:'ember-tooth',echoes:30,
  acts:[{kind:'npc',npc:'pilgrim',title:'Escucha al Peregrino',meaning:'Alguien conserva una historia olvidada.'},{kind:'rune',title:'Recupera el juramento',meaning:'La raíz se niega a borrar la palabra.'},{kind:'witness',index:0,title:'Resuelve el primer testigo',meaning:'Una criatura confirma la huella del bosque.'}]
 },
 sanctuary:{
  title:'LA VOZ ANTES DEL SILENCIO',opening:'La Custodia ofrece un juramento; un testigo y el Guardián pondrán a prueba su significado.',resolution:'La palabra vuelve a escucharse donde Hollowhart imponía silencio.',reward:'mist-pearl',echoes:40,
  acts:[{kind:'npc',npc:'keeper',title:'Habla con la Custodia',meaning:'El deber deja de ser una orden ciega.'},{kind:'witness',index:0,title:'Resuelve el primer juramento',meaning:'Un vínculo sostiene la palabra.'},{kind:'guardian',title:'Supera al Guardián',meaning:'El silencio no puede imponer el final.'}]
 },
 marsh:{
  title:'LAS VIDAS QUE AÚN IMPORTAN',opening:'Nael necesita una voz, un recuerdo y un testigo antes de confiarte su juicio.',resolution:'Nael lee las señales reunidas y comprende que ninguna vida debería borrarse sin ser escuchada.',reward:'root-knot',echoes:45,
  acts:[{kind:'npc',npc:'nael',title:'Encuentra a Nael',meaning:'Una cartógrafa revela el precio de olvidar.'},{kind:'memory',index:0,title:'Escucha la primera memoria',meaning:'La Marisma conserva una vida posible.'},{kind:'witness',index:0,title:'Resuelve un testigo de las aguas',meaning:'Un vínculo responde por los ausentes.'}]
 },
 spire:{
  title:'LA PALABRA DE LOS VIVOS',opening:'Oriel espera que descubras qué cambia cuando una historia deja de dictar destinos.',resolution:'Oriel reconoce tu recorrido: has encontrado razones para elegir sin obedecer al Telar.',reward:'echo-prism',echoes:50,
  acts:[{kind:'npc',npc:'oriel',title:'Escucha a Oriel',meaning:'La Corona muestra su conflicto.'},{kind:'memory',index:0,title:'Recoge una memoria de la Corona',meaning:'El pasado no tiene derecho a escribir el futuro.'},{kind:'witness',index:0,title:'Resuelve un testigo de la Corona',meaning:'Un compañero demuestra otra posibilidad.'}]
 },
 ossuary:{
  title:'LAS VOCES BAJO LA MAREA',opening:'Edda escucha los nombres que no cabían en el mundo anterior.',resolution:'Las voces de la marea dejan de ser un eco sin interlocutor.',reward:'pilgrim-ward',echoes:55,
  acts:[{kind:'npc',title:'Escucha a Edda',meaning:'Las decisiones no tomadas también importan.'},{kind:'memory',index:0,title:'Encuentra la primera memoria',meaning:'La orilla devuelve un testimonio.'},{kind:'witness',index:0,title:'Resuelve un testigo de la marea',meaning:'Una criatura presta su voz.'}]
 },
 garden:{
  title:'EL INVIERNO QUE PUEDE CAMBIAR',opening:'Silas protege una semilla: descubrir no significa exigir que florezca.',resolution:'Silas acepta que la primavera puede tener su propio ritmo.',reward:'hearth-bead',echoes:60,
  acts:[{kind:'npc',title:'Escucha a Silas',meaning:'Un guardián comparte su esperanza.'},{kind:'memory',index:0,title:'Encuentra la memoria de la semilla',meaning:'El invierno puede ser cuidado.'},{kind:'witness',index:0,title:'Resuelve un testigo del jardín',meaning:'Una criatura elige seguir viva.'}]
 }
};
export const TRAIL_REWARD_PREFIX='field-trail-';
export interface TrailActState {title:string;meaning:string;objective:FieldObjective|null;done:boolean;known:boolean;}
export interface FieldTrail {
 zone:ZoneId;title:string;opening:string;resolution:string;acts:readonly TrailActState[];
 done:number;total:3;ready:boolean;claimed:boolean;reward:RelicId;echoes:number;
}
function locateAct(entries:readonly FieldObjective[],zone:ZoneId,act:TrailAct):FieldObjective|null{
 if(act.kind==='witness')return entries.find(e=>e.id==='witness:'+act.index)??null;
 const matching=entries.filter(e=>e.kind===act.kind);
 if(act.npc){
  return matching.find(e=>{const index=Number(e.id.slice(5));return ZONES[zone].landmarks[index]?.npcId===act.npc;})??null;
 }
 return matching[act.index??0]??null;
}
/** Read-only, fog-safe projection. Never expose undiscovered objective coordinates. */
export function fieldTrail(save:SaveGame,zone:ZoneId):FieldTrail|null{
 if(!ZONE_IDS.includes(zone)||!regionKnown(save,zone)||!regionUnlocked(save,zone))return null;
 const data=TRAILS[zone],entries=regionalObjectives(save,zone);
 const acts=data.acts.map(act=>{
  const objective=locateAct(entries,zone,act);
  return {title:act.title,meaning:act.meaning,objective:objective?.known?objective:null,
   known:!!objective?.known,done:!!objective?.done};
 });
 const done=acts.filter(a=>a.done).length,claimed=save.flags.includes(TRAIL_REWARD_PREFIX+zone);
 return{zone,title:data.title,opening:data.opening,resolution:data.resolution,acts,
  done,total:3,ready:done===3&&!claimed,claimed,reward:data.reward,echoes:data.echoes};
}
export function trailClaimRefusal(save:SaveGame,zone:ZoneId):string|null{
 const trail=fieldTrail(save,zone);
 if(!trail)return'RUTA BLOQUEADA';
 if(trail.claimed)return'RUTA YA RECONOCIDA';
 if(!trail.ready)return'FALTAN HUELLAS';
 if(save.activeBattle||save.dungeon?.active||save.expedition)return'TERMINA EL COMBATE O EXPEDICIÓN';
 if(save.zone!==zone)return'REGRESA A LA REGIÓN';
 const altar=ZONES[zone].landmarks.find(l=>l.kind==='altar');
 if(!altar||Math.hypot(save.x-altar.x,save.y-altar.y)>2.15||!save.flags.includes('altar-'+zone))return'REGRESA A LA LUMBRE VISITADA';
 if(save.flags.length>=200||!save.rpg||!Number.isSafeInteger(save.rpg.echoes)||save.rpg.echoes+trail.echoes>999999)return'REGISTRO O ECOS COMPLETOS';
 if(RELIC_IDS.some(id=>{const n=save.relics?.[id];return n!==undefined&&(!Number.isSafeInteger(n)||n<1||n>RELIC_COPY_LIMIT);}))return'RELIQUIAS INVÁLIDAS';
 return null;
}
/** Prepare only; an optimistic save-store commit must succeed before live reward. */
export function planFieldTrailClaim(save:SaveGame,zone:ZoneId):SaveGame|null{
 if(trailClaimRefusal(save,zone))return null;
 const data=TRAILS[zone],relic=[data.reward,...RELIC_IDS].find((id,i,all)=>all.indexOf(id)===i&&(save.relics?.[id]??0)<RELIC_COPY_LIMIT);
 return{...save,flags:[...save.flags,TRAIL_REWARD_PREFIX+zone],
  rpg:{...save.rpg!,echoes:save.rpg!.echoes+data.echoes},
  ...(relic?{relics:{...save.relics,[relic]:(save.relics?.[relic]??0)+1}}:{})};
}
export function fieldTrailRewardName(save:SaveGame,zone:ZoneId):string{
 const data=TRAILS[zone],relic=[data.reward,...RELIC_IDS].find((id,i,all)=>all.indexOf(id)===i&&(save.relics?.[id]??0)<RELIC_COPY_LIMIT);
 return relic?RELICS[relic].name+' · '+RELICS[relic].description:'Sin reliquia disponible (inventario completo)';
}
