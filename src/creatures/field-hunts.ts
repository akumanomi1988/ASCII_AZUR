/** Field-hunt briefing reuses existing direct duels, real party tactics and research.
 * No new encounter, save state, progress flags or alternative battle rules. */
import {createCreature,SPECIES,TYPE_ADV,type SaveGame,type Element} from '../domain.js';
import {ZONE_IDS,type ZoneId} from '../world.js';
import {activeWildBiome,BIOME_DUEL_SPECIES,biomeDuelLevel} from '../world/encounters.js';
import {researchCatalogue,RESEARCH_TIERS} from './field-research.js';
import {teamGuide,creatureRole,tacticalProfile,recruitmentValue} from './tactical-identity.js';

export type HuntStatus='unseen'|'seen'|'bonded';
export interface HuntCandidate {
 id:string;name:string;level:number;element:Element;status:HuntStatus;
 role:string;counterElement:Element;newAffinity:boolean;
 bestLeadUid:string|null;bestLeadName:string|null;bestMove:string|null;
 forecast:string;recruitment:string;
}
export interface FieldHuntBoard {
 zone:ZoneId;habitat:ZoneId;transition:boolean;entries:HuntCandidate[];
 bonded:number;total:number;nextTier:string|null;
 seals:number;captureRoom:boolean;available:boolean;
}
/** Early chapters use the already active Sanctuary population, not late
 * marsh/spire inhabitants who only enter the natural ecosystem afterward.
 * Duels remain available at the actual region's usual level and award nothing
 * except their existing win/capture/XP rules. */
export function fieldHuntBoard(save:SaveGame):FieldHuntBoard|null {
 const zone=save.zone as ZoneId;
 if(!ZONE_IDS.includes(zone)||save.activeBattle||save.dungeon?.active||save.expedition)return null;
 const habitat=activeWildBiome(zone,save.flags);
 const research=researchCatalogue(save.team,save.storage,save.flags);
 const next=RESEARCH_TIERS.find(t=>!save.flags.includes('research-reward-'+t.id));
 const entries=BIOME_DUEL_SPECIES[habitat].map((id,index):HuntCandidate=>{
  const species=SPECIES[id]!;
  const enemy=createCreature(id,biomeDuelLevel(zone,index),()=>0.5);
  const status=research.entries.find(e=>e.id===id)?.status??'unknown';
  const known=status==='bonded'||status==='seen'?status:'unseen';
  const recommendation=teamGuide(save.team,enemy,save.flags);
  const recommended=save.team.find(c=>c.hp>0&&c.speciesId===recommendation.recommended)
    ??save.team.find(c=>c.hp>0);
  const profile=recommended?tacticalProfile(recommended,enemy,save.flags):null;
  const counter=Object.entries(TYPE_ADV).find(([,target])=>target===species.element)?.[0] as Element|undefined;
  return{id,name:species.name,level:enemy.level,element:species.element,status:known,
   role:creatureRole(enemy),counterElement:counter??species.element,
   newAffinity:!save.team.concat(save.storage).some(c=>SPECIES[c.speciesId]?.element===species.element),
   bestLeadUid:recommended?.uid??null,
   bestLeadName:recommended?SPECIES[recommended.speciesId]?.name??null:null,
   bestMove:profile?.bestMoveId??null,forecast:profile?.summary??'EQUIPO SIN CRIATURAS CONSCIENTES',
   recruitment:recruitmentValue(enemy,[...save.team,...save.storage])};
 });
 return{zone,habitat,transition:habitat!==zone,entries,bonded:research.bonded,
  total:research.total,nextTier:next?next.title+' · '+research.bonded+'/'+next.count+' VÍNCULOS':null,
  seals:save.inventory.seals,captureRoom:save.team.length<6||save.storage.length<500,
  available:save.team.some(c=>c.hp>0)};
}
/** Verify again at the moment of confirmation: a stale briefing must not
 * start an unauthorized or chapter-locked species in a changed region. */
export function fieldHuntPermission(save:SaveGame,speciesId:string,leaderUid:string):HuntCandidate|null {
 const board=fieldHuntBoard(save);
 if(!board||!board.available||!leaderUid)return null;
 if(!save.team.some(c=>c.uid===leaderUid&&c.hp>0))return null;
 return board.entries.find(e=>e.id===speciesId)??null;
}
