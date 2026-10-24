/** Read-only tactical guidance from actual equipped moves, relics, HP and status rules. */
import {MOVES,maxHp,type Creature} from '../domain.js';
import {attackWithStatuses,skillUtility,chooseEnemyMove,chooseGuardianMove,effectiveHealing,type StatusEffect} from './tactics.js';
export type BattleSuggestion={kind:'move';moveId:string;reason:string}|{kind:'guard'|'tonic';reason:string};
export function suggestBattleAction(ally:Creature,enemy:Creature,allyStatuses:StatusEffect[],enemyStatuses:StatusEffect[],tonics:number,chargeStage:0|1|2=0,bossPhase:1|2=1,recoveryLeft=3):BattleSuggestion{
 const options=ally.moves.filter(id=>MOVES[id]&&(MOVES[id]!.role!=='heal'||recoveryLeft>0)).map(id=>({id,move:MOVES[id]!,hit:attackWithStatuses(ally,enemy,MOVES[id]!,allyStatuses,enemyStatuses,.9)}));
 const attacks=options.filter(o=>o.move.power>0&&o.move.role!=='heal').sort((a,b)=>b.hit.value-a.hit.value||a.id.localeCompare(b.id));
 const best=attacks[0];
 if(best&&best.hit.value>=enemy.hp)return{kind:'move',moveId:best.id,reason:'Puede cerrar el combate antes del contraataque.'};
 if(chargeStage===2)return{kind:'guard',reason:'El Eclipse está cargado: GUARDIA reduce el próximo impacto un 55 %.'};
 const enemyMove=MOVES[(enemy.speciesId==='hollowhart'||enemy.speciesId==='nullscribe')?chooseGuardianMove(enemy,ally,enemyStatuses,allyStatuses,0):chooseEnemyMove(enemy,ally,enemyStatuses,allyStatuses)]??MOVES.pulse!;
 const incoming=enemyMove.role==='heal'?0:Math.ceil(attackWithStatuses(enemy,ally,enemyMove,enemyStatuses,allyStatuses,1.07).value*(bossPhase===2?1.15:1));
 const healing=options.filter(o=>o.move.role==='heal').map(o=>({...o,healing:skillUtility(ally,o.move,allyStatuses).healing})).sort((a,b)=>b.healing-a.healing)[0];
 if(ally.hp<maxHp(ally)*.55&&healing&&healing.healing>incoming&&healing.healing>=maxHp(ally)*.18)return{kind:'move',moveId:healing.id,reason:'La curación recupera más vida que el contraataque estimado.'};
 if(tonics>0&&ally.hp<=Math.max(incoming+2,maxHp(ally)*.30)&&effectiveHealing(ally,28)>incoming)return{kind:'tonic',reason:'Un tónico puede evitar la caída; consume el turno.'};
 return{kind:'move',moveId:best?.id??ally.moves[0]??'pulse',reason:incoming>=ally.hp?'Peligro de caída: considera cambiar de vínculo.':'Mejor impacto mínimo con tus técnicas actuales.'};
}
