/** A persistent, branching second chapter using only optional save-v1 flags. */
export const MARSH_CHAPTER_FLAG='marsh-chapter-complete';
export const MARSH_MEMORY_FLAGS=['marsh-memory-bell','marsh-memory-lantern'] as const;
export const MARSH_ENCOUNTER_FLAGS=['roamer-marsh-0','roamer-marsh-1','roamer-marsh-2'] as const;
export type MarshChoice='keep'|'release';
export const MARSH_REWARDS={keep:{echoes:180,seals:4,tonics:0},release:{echoes:180,seals:0,tonics:4}} as const;
export function marshChapterProgress(flags:readonly string[]){
 const f=new Set(flags);
 const memories=MARSH_MEMORY_FLAGS.filter(x=>f.has(x)).length;
 const encounters=MARSH_ENCOUNTER_FLAGS.filter(x=>f.has(x)).length;
 const choice:MarshChoice|null=f.has('marsh-choice-keep')?'keep':f.has('marsh-choice-release')?'release':null;
 const complete=f.has(MARSH_CHAPTER_FLAG);
 const stage=complete?6:choice?5:!f.has('zone-marsh')?0:!f.has('marsh-met-nael')?1:memories<2?2:encounters<3?3:4;
 const scenes=[
  ['El camino del segundo eco','Cruza desde el Santuario a las Marismas','La puerta oriental del Santuario responde tras el juramento de Arken.'],
  ['La cartógrafa que no recuerda','Habla con Nael en las Marismas','La cartógrafa espera junto al sendero del oeste.'],
  ['Dos vidas bajo el agua','Recupera la campana y el farol','Busca dos monumentos luminosos entre la niebla y el agua.'],
  ['Tres testigos del pantano','Resuelve los tres encuentros errantes','Vence o captura los tres encuentros marcados en las rutas.'],
  ['El tribunal del reflejo','Dicta la sentencia del Tribunal','Elige preservar o liberar los nombres perdidos; es irreversible.'],
  ['La memoria que permanece','Vuelve a Nael para cerrar el capítulo','El epílogo registra tu decisión en el Atlas.'],
  ['Un mapa para el futuro','Capítulo II completado','Los nombres perdidos tienen destino; el viaje continúa.']
 ] as const;
 const [title,objective,hint]=scenes[stage]!;
 return{stage,title,objective,hint,memories,encounters,choice,complete,
  verdictReady:memories===2&&encounters===3&&!choice&&f.has('marsh-met-nael')&&f.has('arken-vow-restored'),
  endingReady:!!choice&&!complete};
}
export function marshDecision(flags:readonly string[],choice:MarshChoice){
 if(!marshChapterProgress(flags).verdictReady)return{flags:[...flags],newlyDecided:false};
 return{flags:[...flags,choice==='keep'?'marsh-choice-keep':'marsh-choice-release'],newlyDecided:true};
}
export function marshFinish(flags:readonly string[]){
 if(!marshChapterProgress(flags).endingReady)return{flags:[...flags],newlyFinished:false};
 return{flags:[...flags,MARSH_CHAPTER_FLAG],newlyFinished:true};
}
