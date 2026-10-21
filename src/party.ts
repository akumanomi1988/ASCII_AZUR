import type {Creature} from './domain.js';
/** Pure party operations: data mutates only through an explicitly returned snapshot. */
export interface PartyState {team:Creature[];storage:Creature[];}
export const PARTY_LIMIT=6;
export function transferStoredCreature(state:PartyState,storedUid:string,replaceUid?:string):PartyState{
 const t=state.team,s=state.storage;
 const source=s.findIndex(c=>c.uid===storedUid);
 if(source<0)throw Error('Creature missing from reserve');
 if(t.some(c=>c.uid===storedUid))throw Error('Creature already in team');
 if(new Set([...t,...s].map(c=>c.uid)).size!==t.length+s.length)throw Error('Duplicate creature identity');
 const team=[...t],storage=[...s],creature=storage[source]!;
 if(replaceUid!==undefined){
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
 const i=state.team.findIndex(c=>c.uid===uid);
 if(i<0)throw Error('Creature missing from team');
 if(state.team.length<=1)throw Error('Cannot reserve last team member');
 const team=[...state.team],storage=[...state.storage];storage.push(team.splice(i,1)[0]!);
 return{team,storage};
}
