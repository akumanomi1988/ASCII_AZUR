import {gainExp,type Creature} from './domain.js';
/** Pure party operations: data mutates only through an explicitly returned snapshot. */
export interface PartyState {primaryUid?:string;team:Creature[];storage:Creature[];}
export const PARTY_LIMIT=6;
export function transferStoredCreature(state:PartyState,storedUid:string,replaceUid?:string):PartyState{
 const t=state.team,s=state.storage;
 const source=s.findIndex(c=>c.uid===storedUid);
 if(source<0)throw Error('Creature missing from reserve');
 if(t.some(c=>c.uid===storedUid))throw Error('Creature already in team');
 if(new Set([...t,...s].map(c=>c.uid)).size!==t.length+s.length)throw Error('Duplicate creature identity');
 const team=[...t],storage=[...s],creature=storage[source]!;
 if(replaceUid!==undefined){
  if(replaceUid===state.primaryUid)throw Error('Primary companion cannot enter reserve');
  const target=team.findIndex(c=>c.uid===replaceUid);
  if(target<0)throw Error('Replacement missing from team');
  storage[source]=team[target]!;team[target]=creature;
 }else{
  if(team.length>=PARTY_LIMIT)throw Error('Team already full');
  team.push(creature);storage.splice(source,1);
 }
 if(team.length===0||team.length>PARTY_LIMIT)throw Error('Invalid resulting party');
 return {team,storage};
}
export function reserveCreature(state:PartyState,uid:string):PartyState{
 if(uid===state.primaryUid)throw Error('Primary companion cannot enter reserve');
 const i=state.team.findIndex(c=>c.uid===uid);
 if(i<0)throw Error('Creature missing from team');
 if(state.team.length<=1)throw Error('Cannot reserve last team member');
 const team=[...state.team],storage=[...state.storage];storage.push(team.splice(i,1)[0]!);
 return{team,storage};
}

/** Rewards the active combatant fully and conscious teammates at 50%.
 * Reserve creatures do not gain XP; no save schema or global experience pool. */
export interface ExperienceAward {uid:string;active:boolean;amount:number;levelUp:boolean;evolved:boolean;from:string;to:string;}
export function grantPartyExperience(team:readonly Creature[],activeIndex:number,amount:number):ExperienceAward[]{
 if(!Number.isInteger(activeIndex)||activeIndex<0||activeIndex>=team.length||!Number.isSafeInteger(amount)||amount<0)throw Error('Invalid combat experience');
 const rewards:ExperienceAward[]=[];
 for(let i=0;i<team.length;i++){
  const creature=team[i]!;
  if(i!==activeIndex&&creature.hp<=0)continue;
  const awarded=i===activeIndex?amount:Math.floor(amount*.5);
  if(awarded===0)continue;
  const from=creature.speciesId;
  const progress=gainExp(creature,awarded);
  rewards.push({uid:creature.uid,active:i===activeIndex,amount:awarded,...progress,from,to:creature.speciesId});
 }
 return rewards;
}
