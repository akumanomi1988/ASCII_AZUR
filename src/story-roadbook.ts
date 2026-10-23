/** Player-facing trilogy waybook; an honest, read-only projection of saved progress. */
import {SPECIES,MOVES,TYPE_ADV,maxHp,type Creature} from './domain.js';
import {arkenStoryIndex,type ArkenStoryState} from './story-campaign.js';
import {marshChapterProgress} from './story-marsh.js';
import {crownProgress} from './story-finale.js';

export interface RoadbookStatus {
 chapter:1|2|3; completed:number;total:19; percentage:number;
 chapters:readonly {name:string;done:number;total:number;status:'done'|'active'|'locked'}[];
 objective:string; stage:string; advice:string[];
 readyForBattle:boolean|null; counter:string|null;
}
export function campaignRoadbook(story:ArkenStoryState,team:readonly Creature[],inventory:{tonics:number;seals:number}):RoadbookStatus {
 const arken=arkenStoryIndex(story),marsh=marshChapterProgress(story.flags),crown=crownProgress(story.flags);
 const chapter:1|2|3=arken<6?1:!marsh.complete?2:3;
 const completed=Math.min(6,arken)+Math.min(6,marsh.stage)+(marsh.complete?Math.min(7,crown.stage):0);
 const chapters=[
  {name:'I · ARKEN',done:Math.min(6,arken),total:6,status:arken===6?'done':chapter===1?'active':'locked'},
  {name:'II · ESPEJO',done:marsh.complete?6:arken===6?marsh.stage:0,total:6,status:marsh.complete?'done':chapter===2?'active':'locked'},
  {name:'III · CORONA',done:crown.stage,total:7,status:crown.complete?'done':chapter===3?'active':'locked'}
 ] as const;
 const stage=chapter===1?['ARCHIVISTA','BOSQUE','SANTUARIO','HOLLOWHART','CRIPTA','JURAMENTO'][arken]||'COMPLETO':chapter===2?marsh.title:crown.title;
 const objective=chapter===1?['Habla con el Archivista','Cruza al Bosque','Alcanza el Santuario','Derrota a Hollowhart','Completa la Cripta','Vuelve al Archivista'][arken]||'Arken restaurado':chapter===2?marsh.objective:crown.objective;
 const boss=chapter===1&&arken===3?'hollowhart':chapter===3&&crown.stage===4?'nullscribe':null;
 const alive=team.filter(c=>c.hp>0),highest=Math.max(0,...alive.map(c=>c.level));
 let counter:string|null=null;
 if(boss) {
  const target=SPECIES[boss]!.element;
  const capable=alive.filter(c=>c.moves.some(id=>{const move=MOVES[id];return move&&move.power>0&&TYPE_ADV[move.element]===target;}))
   .sort((a,b)=>b.level-a.level||b.hp-a.hp);
  if(capable[0])counter=SPECIES[capable[0].speciesId]!.name;
 }
 const advice:string[]=[];
 if(alive.length<2)advice.push('Cuenta con al menos dos criaturas conscientes antes de un desafío mayor.');
 if(team.some(c=>c.hp>0&&c.hp<maxHp(c)*.6))advice.push('Hay aliados heridos: una Lumbre cura gratis antes del combate.');
 if(boss){
  const required=boss==='hollowhart'?8:14;
  if(highest<required)advice.push(`Mayor nivel del equipo: ${highest}; referencia recomendada: ${required}.`);
  if(!counter)advice.push(boss==='hollowhart'?'Falta ataque de Ceniza contra Hollowhart (Raíz).':'Falta ataque de Bruma contra Nullscribe (Éter).');
  if(inventory.tonics<2)advice.push('Reserva al menos dos Tónicos para la batalla de jefe.');
  advice.push('El ataque de Éter cargado se anuncia: GUARDIA reduce el daño recibido.');
 }
 if(chapter===2&&marsh.stage===3)advice.push(`Testigos de la Marisma: ${marsh.encounters}/3; se aceptan captura o victoria.`);
 if(chapter===3&&crown.stage===3)advice.push(`Centinelas de la Corona: ${crown.witnesses}/3; cada uno cuenta una sola vez.`);
 if(chapter===3&&crown.complete)advice.push('Historia principal completada: la exploración y el Códice siguen abiertos.');
 return {chapter,completed,total:19,percentage:Math.floor(completed/19*100),chapters,objective,stage,advice,
  readyForBattle:boss!==null?alive.length>=2&&highest>=(boss==='hollowhart'?8:14)&&!!counter&&inventory.tonics>=2&&alive.every(c=>c.hp>=maxHp(c)*.6):null,counter};
}
