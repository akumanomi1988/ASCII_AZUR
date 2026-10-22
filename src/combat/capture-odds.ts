/** Deterministic capture model shared by the battle UI and its RNG resolution. */
import {maxHp,type Creature} from '../domain.js';
import type {StatusEffect} from './tactics.js';

export const CAPTURE_STATUS_BONUS = 0.08;
export const CAPTURE_MAX_STATUS_BONUS = 0.16;
export const CAPTURE_MAX_CHANCE = 0.94;
export interface CapturePreview {chance:number;percent:number;statusBonus:number;accessible:string;}

/** Do not alter the pre-v0.22 baseline: missing HP and ally-level advantage remain identical. */
export function capturePreview(ally:Creature,enemy:Creature,statuses:readonly StatusEffect[]):CapturePreview {
  const health=Math.max(0,Math.min(1,enemy.hp / maxHp(enemy)));
  const base=0.26+(1-health)*0.65+Math.max(0,ally.level-enemy.level)*0.02;
  const active=new Set(statuses.filter(s=>s.remaining>0).map(s=>s.kind));
  const statusBonus=Math.min(CAPTURE_MAX_STATUS_BONUS,active.size*CAPTURE_STATUS_BONUS);
  const chance=enemy.hp<=0?0:Math.min(CAPTURE_MAX_CHANCE,base+statusBonus);
  const percent=Math.round(chance*100);
  return {chance,percent,statusBonus,accessible:`Probabilidad de vínculo ${percent} %${statusBonus?`, bonificación de estados ${Math.round(statusBonus*100)} puntos porcentuales`:''}. Consume un sello. Si falla, el enemigo contraataca.`};
}
