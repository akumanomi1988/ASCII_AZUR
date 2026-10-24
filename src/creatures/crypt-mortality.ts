/** Permanent companion losses are resolved before the battle checkpoint is persisted. */
import type {Creature,SaveGame} from '../domain.js';
export interface FallenCompanion {uid:string;speciesId:string;level:number;}
export function establishPrimary(save:SaveGame):boolean{
 if(save.primaryUid)return false;
 if(!save.team[0])return false;save.primaryUid=save.team[0].uid;return true;
}
export function loseCryptCompanion(save:SaveGame,victim:Creature):boolean{
 if(!save.dungeon?.active||victim.hp>0)return false;
 establishPrimary(save);if(victim.uid===save.primaryUid)return false;
 const index=save.team.findIndex(c=>c.uid===victim.uid);if(index<0)return false;
 save.team.splice(index,1);save.fallen=[...(save.fallen??[]),{uid:victim.uid,speciesId:victim.speciesId,level:victim.level}].slice(-200);
 // Owned relic counts already include equipped copies; removal makes the copy free.
 if(save.activeBattle){
  delete save.activeBattle.effects[victim.uid];delete save.activeBattle.recoveryUses?.[victim.uid];
  save.activeBattle.ally=Math.max(0,save.team.findIndex(c=>c.hp>0));
 }
 return true;
}
