import {MOVES,SPECIES,TYPE_ADV,maxHp,type Creature} from './domain.js';
/** A self-contained, saved-with-flags narrative arc built on existing exploration and dungeon systems. */
export const ARKEN_FINALE_FLAG='arken-vow-restored';
export const ARKEN_FINALE_REWARD={echoes:200,seals:4} as const;
export interface ArkenStoryState {
  flags:readonly string[];
  defeatedBoss:boolean;
  dungeonFinished:boolean;
}
export interface StoryBeat {
  id:string;title:string;objective:string;hint:string;
}
export const ARKEN_STORY:readonly StoryBeat[]=[
  {id:'archivist',title:'La voz de Arken',objective:'Habla con el Archivista',hint:'Búscalo junto a la plaza de Velo de Arken. Pulsa E o ACCIÓN para hablar.'},
  {id:'forest',title:'Los nombres del bosque',objective:'Cruza al Bosque de Ceniza',hint:'Sigue el camino hacia el portal oriental de la aldea.'},
  {id:'sanctuary',title:'El Santuario sin Voz',objective:'Alcanza el santuario',hint:'Atraviesa el bosque hasta su salida oriental. Recupera fuerzas en las lumbres.'},
  {id:'guardian',title:'La Primera Palabra',objective:'Derrota a Hollowhart',hint:'El Guardián es un desafío táctico. Prepara al menos dos vínculos y una criatura de nivel 8 o superior. Hollowhart es de Raíz: busca una criatura de Ceniza en el Bosque para contrarrestarlo. Conserva tónicos y usa GUARDIA contra su ataque cargado.'},
  {id:'crypt',title:'El Último Signo',objective:'Completa la Cripta de los Ecos',hint:'Regresa a Arken; abre el MENÚ → CRIPTA EXPLORABLE, vence a los centinelas, lee la inscripción y abre la última puerta.'},
  {id:'return',title:'El juramento de las cenizas',objective:'Vuelve con el Archivista',hint:'Sal de la cripta y habla con el Archivista en la plaza de Arken para unir la Palabra y el Signo.'},
  {id:'ending',title:'El recuerdo permanece',objective:'Arco de Arken completado',hint:'El juramento permanece. Puedes explorar, capturar criaturas y superar nuevas expediciones.'}
];
export function arkenStoryIndex(state:ArkenStoryState):number {
  const flags=new Set(state.flags);
  if(!flags.has('archivist'))return 0;
  if(!flags.has('zone-forest'))return 1;
  if(!flags.has('zone-sanctuary'))return 2;
  if(!state.defeatedBoss)return 3;
  if(!state.dungeonFinished)return 4;
  if(!flags.has(ARKEN_FINALE_FLAG))return 5;
  return 6;
}
export function arkenStoryBeat(state:ArkenStoryState):StoryBeat{return ARKEN_STORY[arkenStoryIndex(state)]!;}
/** Story rewards are granted only by the archivist once both major challenges are complete. */
export function canConcludeArken(state:ArkenStoryState):boolean{return arkenStoryIndex(state)===5;}
/** Pure idempotent transition; caller persists the updated flag and reward. */
export function concludeArken(state:ArkenStoryState):{flags:string[];newlyCompleted:boolean}{
  if(!canConcludeArken(state))return{flags:[...state.flags],newlyCompleted:false};
  return{flags:[...state.flags,ARKEN_FINALE_FLAG],newlyCompleted:true};
}

/** Optional, non-blocking Guardian preparation advice derived from a real saved party.
 * Not a win-probability estimate: matches observed boss difficulty without promising victory. */
export function guardianPreparation(team:readonly Creature[]):{ready:boolean;advice:string[]}{
 const conscious=team.filter(c=>c.hp>0);
 const highest=Math.max(0,...conscious.map(c=>c.level));
 const advice:string[]=[];
 if(conscious.length<2)advice.push('Equipo corto: lleva al menos dos criaturas con vida.');
 if(highest<8)advice.push('Nivel recomendado: al menos una criatura de nivel 8.');
 const bossElement=SPECIES.hollowhart!.element;
 const hasCounter=conscious.some(c=>c.moves.some(id=>{
  const move=MOVES[id];return move&&move.power>0&&TYPE_ADV[move.element]===bossElement;
 }));
 if(!hasCounter)advice.push('Hollowhart es de Raíz: lleva una criatura de Ceniza con un ataque ofensivo. Puedes encontrar Cindrel o Ashboar en la hierba del Bosque de Ceniza; no necesitas reiniciar tu partida.');
 if(conscious.some(c=>c.hp<maxHp(c)*.6))advice.push('Recupera salud en una Lumbre; reserva tónicos.');
 return{ready:advice.length===0,advice};
}

/** Read-only tactical scouting for the three persistent Sanctuary trail encounters.
 * Recommendations use equipped damaging moves, not a creature's nominal element.
 * A wounded/fainted team can still inspect the route; it never blocks entry. */
export interface SanctuaryRouteEntry {
 id:string;speciesId:string;name:string;element:string;level:number;
 cleared:boolean;counter:string|null;
}
export function sanctuaryRoutePlan(team:readonly Creature[],route:readonly {id:string;speciesId:string;level:number}[],flags:readonly string[]):SanctuaryRouteEntry[]{
 return route.map(encounter=>{
  const enemy=SPECIES[encounter.speciesId];
  if(!enemy)throw Error('Unknown Sanctuary encounter species');
  const candidates=team.filter(c=>c.hp>0&&c.moves.some(id=>{
   const move=MOVES[id];return !!move&&move.power>0&&TYPE_ADV[move.element]===enemy.element;
  })).sort((a,b)=>b.level-a.level||b.hp-a.hp||a.uid.localeCompare(b.uid));
  return {id:encounter.id,speciesId:encounter.speciesId,name:enemy.name,element:enemy.element,level:encounter.level,
   cleared:flags.includes('roamer-'+encounter.id),
   counter:candidates.length?SPECIES[candidates[0]!.speciesId]!.name:null};
 });
}
