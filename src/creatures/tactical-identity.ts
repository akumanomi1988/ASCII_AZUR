/**
 * Creature identity, matchup and upgrade advice. All recommendations derive from
 * real equipped moves, damage/status rules and available relic inventory.
 * Pure/read-only: never spends, captures, grants rewards or modifies save-v1.
 */
import {MOVES,SPECIES,TYPE_ADV,createCreature,maxHp,type Creature,type Element} from '../domain.js';
import {MOVE_EFFECTS} from '../combat/tactics.js';
import {previewMove} from '../combat/move-preview.js';
import {bondAttackDamage,bondIncomingDamage} from './bond-quests.js';
import {freeRelicCopies,RELIC_IDS,RELICS,type RelicId} from './equipment.js';
import {unlockedMoves} from './loadout.js';

export interface TacticalProfile {
 speciesId:string;name:string;role:string;viable:boolean;
 bestMoveId:string|null;minDamage:number;maxDamage:number;
 effective:boolean;enemyElement:Element;estimatedIncoming:number;
 utility:string[];summary:string;score:number;
}
export interface TacticalUpgrade {moveId:string;currentMax:number;candidateMax:number;reason:string;}
export interface TacticalRelic {id:RelicId;damageGain:number;incomingReduction:number;reason:string;}
export interface TacticalTeamGuide {members:TacticalProfile[];recommended:string|null;missingCounter:boolean;notice:string;}
const EMPTY:readonly string[]=[];
function offensive(c:Creature,enemy:Creature,id:string,flags:readonly string[]){
 const move=MOVES[id];
 if(!move||move.power<=0)return null;
 const estimate=previewMove(c,enemy,move,[],[]);
 const effective=TYPE_ADV[move.element]===SPECIES[enemy.speciesId]?.element;
 return {id,min:bondAttackDamage(estimate.min,flags,c.speciesId),max:bondAttackDamage(estimate.max,flags,c.speciesId),
   effective,auxiliary:!!MOVE_EFFECTS[id]||move.role==='drain'||move.role==='cleanse'};
}
function incoming(c:Creature,enemy:Creature,flags:readonly string[]):number{
 const hits=enemy.moves.filter(id=>MOVES[id]?.power>0).map(id=>previewMove(enemy,c,MOVES[id]!,[],[]).max);
 return bondIncomingDamage(Math.max(0,...hits),flags,c.speciesId);
}
export function creatureRole(c:Creature):string{
 const sp=SPECIES[c.speciesId];
 if(!sp)return'DESCONOCIDA';
 if(sp.role)return sp.role;
 const known=unlockedMoves(c);
 if(known.some(id=>MOVES[id]?.role==='heal'))return'SOPORTE · CURACIÓN';
 if(known.some(id=>MOVES[id]?.role==='drain'))return'HOSTIGADOR · DRENAJE';
 if(known.some(id=>MOVES[id]?.role==='cleanse'))return'SOPORTE · PURIFICACIÓN';
 if(known.some(id=>MOVE_EFFECTS[id]?.kind==='fracture'))return'CONTROL · FRACTURA';
 if(known.some(id=>MOVE_EFFECTS[id]?.kind==='weaken'))return'CONTROL · DEBILIDAD';
 if(known.some(id=>MOVE_EFFECTS[id]?.kind==='scorch'))return'ASALTO · ARDOR';
 return'ATAQUE · '+sp.element.toUpperCase();
}
export function tacticalProfile(c:Creature,enemy:Creature,flags:readonly string[]=[]):TacticalProfile{
 const es=SPECIES[enemy.speciesId];
 if(!SPECIES[c.speciesId]||!es)throw Error('Unknown tactical species');
 const candidates=c.moves.map(id=>offensive(c,enemy,id,flags)).filter((a):a is NonNullable<typeof a>=>!!a)
  .sort((a,b)=>b.max-a.max||Number(b.effective)-Number(a.effective)||a.id.localeCompare(b.id));
 const best=candidates[0],damage=best?.max??0;
 const utility:string[]=[];
 const moves=c.moves.map(id=>MOVES[id]).filter((m):m is NonNullable<typeof m>=>!!m);
 if(moves.some(m=>m.role==='heal'))utility.push('CURA');
 if(moves.some(m=>m.role==='cleanse'))utility.push('PURIFICA');
 if(moves.some(m=>m.role==='drain'))utility.push('DRENA');
 for(const kind of ['fracture','weaken','scorch'] as const)
  if(c.moves.some(id=>MOVE_EFFECTS[id]?.kind===kind))utility.push(kind==='fracture'?'FRACTURA':kind==='weaken'?'DEBILITA':'ARDOR');
 const threat=incoming(c,enemy,flags);
 const hpRatio=Math.min(1,Math.max(0,c.hp)/Math.max(1,maxHp(c)));
 const viable=c.hp>0, survival=viable?Math.min(30,c.hp/Math.max(1,threat)*7):0;
 const score=viable?damage+survival+(best?.effective?4:0)+Math.min(5,utility.length*1.25):0;
 const summary=!viable?'SIN VIDA':best
  ?MOVES[best.id]!.name+' '+best.min+'–'+best.max+' daño'+(best.effective?' · EFICAZ':'')+
   ' · posible respuesta '+threat+' daño'
  :'SIN ATAQUE EQUIPADO';
 return {speciesId:c.speciesId,name:SPECIES[c.speciesId]!.name,role:creatureRole(c),
  viable,bestMoveId:best?.id??null,minDamage:best?.min??0,maxDamage:damage,effective:best?.effective??false,
  enemyElement:es.element,estimatedIncoming:threat,utility,summary,score:Number(score.toFixed(2))};
}
export function teamGuide(team:readonly Creature[],enemy:Creature,flags:readonly string[]=[]):TacticalTeamGuide{
 const profiles=team.map(c=>tacticalProfile(c,enemy,flags));
 const members=profiles.slice().sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
 const best=members.find(c=>c.viable)||null;
 const missingCounter=!profiles.some(p=>p.viable&&p.effective);
 const notice=missingCounter
  ?'NINGUNA TÉCNICA ACTIVA EFICAZ · busca afinidad '+Object.entries(TYPE_ADV).find(([,target])=>target===SPECIES[enemy.speciesId]?.element)?.[0]+' o equipa una técnica conocida.'
  :'Tu equipo tiene contraataques efectivos. Cambiar de vínculo consume turno y protege a quien entra.';
 return {members,recommended:best?.speciesId??null,missingCounter,notice};
}
export function loadoutUpgrade(c:Creature,enemy:Creature,flags:readonly string[]=[]):TacticalUpgrade|null{
 const current=tacticalProfile(c,enemy,flags),available=unlockedMoves(c);
 const options=available.filter(id=>!c.moves.includes(id)).map(id=>offensive(c,enemy,id,flags))
  .filter((p):p is NonNullable<typeof p>=>!!p).sort((a,b)=>b.max-a.max||a.id.localeCompare(b.id));
 const best=options[0];if(!best||best.max<=current.maxDamage+2)return null;
 return {moveId:best.id,currentMax:current.maxDamage,candidateMax:best.max,
  reason:'La técnica '+MOVES[best.id]!.name+' podría subir el daño máximo de '+current.maxDamage+' a '+best.max+
  ' contra '+SPECIES[enemy.speciesId]!.name+'. Solo si sustituyes una técnica; equiparla es gratis fuera del combate.'};
}
export function relicUpgrade(c:Creature,enemy:Creature,flags:readonly string[],
 stock:Readonly<{team:Creature[];storage:Creature[];relics?:Partial<Record<RelicId,number>>}>):TacticalRelic|null{
 const current=tacticalProfile(c,enemy,flags);
 const options=RELIC_IDS.filter(id=>id!==c.equipment&&freeRelicCopies(stock,id)>0).map(id=>{
  const hypothetical={...c,equipment:id};
  const expected=tacticalProfile(hypothetical,enemy,flags);
  const damageGain=Math.max(0,expected.maxDamage-current.maxDamage);
  const incomingReduction=Math.max(0,current.estimatedIncoming-expected.estimatedIncoming);
  return {id,damageGain,incomingReduction,score:damageGain+incomingReduction*0.8,
   reason:RELICS[id].name+' · '+(damageGain?'+'+damageGain+' daño':'sin ganancia ofensiva')+
    (incomingReduction?' · -'+incomingReduction+' daño recibido':'')};
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const best=options[0];return best&&best.score>0?best:null;
}
export function recruitmentValue(candidate:Creature,party:readonly Creature[]):string{
 const species=SPECIES[candidate.speciesId];if(!species)return'CRIATURA NO IDENTIFICADA';
 const owned=party.some(c=>c.speciesId===candidate.speciesId);
 const elementIsNew=!party.some(c=>SPECIES[c.speciesId]?.element===species.element);
 const role=creatureRole(candidate);
 return (owned?'OTRO EJEMPLAR':elementIsNew?'NUEVA AFINIDAD':'NUEVO VÍNCULO')+
  ' · '+species.element.toUpperCase()+' contra '+TYPE_ADV[species.element].toUpperCase()+
  ' · '+role+(candidate.hp<=0?' · NECESITA CURACIÓN':'');
}
export function storyThreat(flags:readonly string[]):Creature|null{
 if(!flags.includes('first-word'))return createCreature('hollowhart',12,()=>0.5);
 if(flags.includes('marsh-chapter-complete')&&!flags.includes('crown-nullscribe-fallen'))
  return createCreature('nullscribe',16,()=>0.5);
 return null;
}
