/** Deterministic, read-only next-turn advice. This never executes or schedules combat commands.
 * Forecasts share live combat formulas; defensive estimates are deliberately conservative.
 */
import {MOVES,maxHp,type Creature} from '../domain.js';
import {bondAttackDamage,bondIncomingDamage} from '../creatures/bond-quests.js';
import {attackWithStatuses,skillUtility,chooseEnemyMove,chooseGuardianMove,effectiveHealing,MOVE_EFFECTS,type StatusEffect} from './tactics.js';
import {capturePreview} from './capture-odds.js';

export interface BattleDecisionContext {
 type:'wild'|'boss'|'expedition';party:readonly Creature[];allyIndex:number;
 seals:number;hasRoom:boolean;ownedSpecies:readonly string[];flags:readonly string[];
}
export type BattleSuggestion=
 |{kind:'move';moveId:string;reason:string}
 |{kind:'guard'|'tonic'|'capture';reason:string}
 |{kind:'switch';targetIndex:number;reason:string};

export function suggestBattleAction(
 ally:Creature,enemy:Creature,allyStatuses:StatusEffect[],enemyStatuses:StatusEffect[],
 tonics:number,chargeStage:0|1|2=0,bossPhase:1|2=1,recoveryLeft=3,
 context?:BattleDecisionContext
):BattleSuggestion{
 const flags=context?.flags??[];
 const options=ally.moves.filter(id=>MOVES[id]&&(MOVES[id]!.role!=='heal'||recoveryLeft>0))
  .map(id=>({id,move:MOVES[id]!,hit:attackWithStatuses(ally,enemy,MOVES[id]!,allyStatuses,enemyStatuses,.90)}));
 const attacks=options.filter(o=>o.move.power>0&&o.move.role!=='heal')
  .map(o=>({...o,dealt:bondAttackDamage(o.hit.value,flags,ally.speciesId)}))
  .sort((a,b)=>b.dealt-a.dealt||a.id.localeCompare(b.id));
 const best=attacks[0],bestDamage=best?.dealt??0;
 // A new companion is a worthwhile outcome. Do not recommend defeating an
 // uncaught, weakened species simply because a lethal attack is available.
 if(context?.type==='wild'&&context.seals>0&&context.hasRoom&&enemy.hp>0&&
     !context.ownedSpecies.includes(enemy.speciesId)){
   const chance=capturePreview(ally,enemy,enemyStatuses);
   if(chance.chance>=.68)return{kind:'capture',reason:`Nuevo vínculo · ${chance.percent} % de éxito. Si falla, el rival contraataca.`};
 }
 if(best&&bestDamage>=enemy.hp&&enemy.hp>0)
   return{kind:'move',moveId:best.id,reason:'El impacto mínimo estimado puede cerrar el combate antes del contraataque.'};
 if(chargeStage===2)return{kind:'guard',reason:'Eclipse inminente: GUARDIA reduce el impacto directo un 55 %. No bloquea ARDOR.'};
 const enemyOptions={...enemy,moves:enemy.moves.filter(id=>MOVES[id])};
 const enemyId=enemy.speciesId==='hollowhart'||enemy.speciesId==='nullscribe'
   ?chooseGuardianMove(enemyOptions,ally,enemyStatuses,allyStatuses,0)
   :chooseEnemyMove(enemyOptions,ally,enemyStatuses,allyStatuses);
 const enemyMove=MOVES[enemyId]??MOVES.pulse!;
 const counter=enemyMove.role==='heal'?0:attackWithStatuses(enemy,ally,enemyMove,enemyStatuses,allyStatuses,1.09).value;
 const incoming=bondIncomingDamage(Math.ceil(counter*(bossPhase===2?1.15:1)),flags,ally.speciesId);
 const recovery=options.filter(o=>o.move.role==='heal')
  .map(o=>({id:o.id,amount:skillUtility(ally,o.move,allyStatuses).healing}))
  .sort((a,b)=>b.amount-a.amount||a.id.localeCompare(b.id))[0];
 if(ally.hp<maxHp(ally)*.55&&recovery&&recovery.amount>incoming&&recovery.amount>=maxHp(ally)*.18)
   return{kind:'move',moveId:recovery.id,reason:'La curación disponible supera el contraataque estimado.'};
 if(tonics>0&&ally.hp<=Math.max(incoming+2,maxHp(ally)*.30)&&effectiveHealing(ally,28)>incoming)
   return{kind:'tonic',reason:'Un tónico permite resistir el siguiente turno y limpia ARDOR.'};
 const switches=context?.party.map((c,i)=>({creature:c,index:i}))
  .filter(x=>x.index!==context.allyIndex&&x.creature.hp>0)
  .map(x=>{
   const offense=x.creature.moves.filter(id=>MOVES[id]&&MOVES[id]!.power>0)
    .map(id=>bondAttackDamage(attackWithStatuses(x.creature,enemy,MOVES[id]!,[],enemyStatuses,.90).value,flags,x.creature.speciesId));
   const improved=Math.max(0,...offense);
   return{...x,improved,survives:x.creature.hp>Math.ceil(incoming*.45)+2};
  }).filter(x=>x.survives&&x.improved>0)
  .sort((a,b)=>b.improved-a.improved||b.creature.hp-a.creature.hp||a.index-b.index)[0];
 if(switches&&(incoming>=ally.hp||(incoming>=ally.hp*.75&&switches.improved>=bestDamage*1.3)))
   return{kind:'switch',targetIndex:switches.index,reason:'Cambio protegido (−55 % impacto). El relevo aporta mejor respuesta o supervivencia.'};
 if(incoming>=ally.hp&&incoming>0)return{kind:'guard',reason:'Riesgo de caída. GUARDIA mitiga el impacto; revisa tus recursos y relevos.'};
 // Attacks with a cleanse are tactically useful even when not the strongest hit.
 const needsCleanse=allyStatuses.some(s=>s.remaining>0&&(s.kind==='scorch'&&s.remaining>=2||s.kind==='weaken'||s.kind==='fracture'));
 const cleanser=attacks.find(o=>o.move.role==='cleanse'&&o.dealt>=bestDamage*.60);
 if(needsCleanse&&cleanser&&enemy.hp>bestDamage)
   return{kind:'move',moveId:cleanser.id,reason:'Purifica alteraciones mientras mantiene presión ofensiva.'};
 const missing=maxHp(ally)-ally.hp;
 const drain=attacks.find(o=>o.move.role==='drain'&&o.dealt>=bestDamage*.70&&
   Math.min(missing,Math.ceil(Math.min(enemy.hp,o.dealt)*.35))>=Math.max(3,maxHp(ally)*.07));
 if(missing>=maxHp(ally)*.23&&drain&&enemy.hp>bestDamage)
   return{kind:'move',moveId:drain.id,reason:'Drena vida real del rival sin abandonar el ataque.'};
 // Status value depends on being novel, the chance to proc and a battle that
 // will continue long enough for the effect to matter. Never promise a proc.
 const status=attacks.find(o=>{
  const effect=MOVE_EFFECTS[o.id];
  return effect&&effect.chance>=.45&&!enemyStatuses.some(s=>s.kind===effect.kind&&s.remaining>0)
    &&o.dealt>=bestDamage*.70&&enemy.hp>bestDamage*2;
 });
 if(status)return{kind:'move',moveId:status.id,reason:`Puede aplicar ${MOVE_EFFECTS[status.id]!.kind.toUpperCase()} (${Math.round(MOVE_EFFECTS[status.id]!.chance*100)} %), útil si quedan varios turnos.`};
 if(best)return{kind:'move',moveId:best.id,reason:'Mayor daño mínimo estimado con el repertorio actual.'};
 return{kind:'guard',reason:'No hay técnicas ofensivas disponibles; protege a tu vínculo.'};
}
