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
  {id:'guardian',title:'La Primera Palabra',objective:'Derrota a Hollowhart',hint:'Encuentra al Guardián del Santuario sin Voz y vence en combate por turnos.'},
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
