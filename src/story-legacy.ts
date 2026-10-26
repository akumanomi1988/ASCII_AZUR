/** A playable, finite legacy of the trilogy's two irreversible decisions.
 * Every branch is projected from saved v1 flags. No new items or currencies. */
import type {SaveGame} from './domain.js';
import {RELICS,RELIC_IDS,RELIC_COPY_LIMIT,validRelicOwnership,type RelicId} from './creatures/equipment.js';

export const LEGACY_WITNESS_FLAG='legacy-arken-witnessed';
export interface LegacyBranch {
 id:string;title:string;opening:string;nael:string;oriel:string;resolution:string;
 relic:RelicId;reason:string;
}
const OUTCOMES:Readonly<Record<string,LegacyBranch>>={
 'keep:remember':{
  id:'keep:remember',title:'EL ATLAS DE LOS NOMBRES VIVOS',
  opening:'Iria pronuncia el nombre de su hermano en la plaza. Esta vez nadie se lo arrebata.',
  nael:'Nael trae el Atlas desde las Marismas: las vidas imposibles siguen siendo escuchadas, pero ninguna página puede imponerles un destino.',
  oriel:'Oriel confía la custodia del Telar a quienes recuerdan sin reclamar a nadie.',
  resolution:'Arken conservará sus nombres y permitirá que cada voz decida cómo quiere ser recordada.',
  relic:'echo-prism',reason:'La memoria de ambos mundos fortalece las técnicas de Éter.'
 },
 'keep:renew':{
  id:'keep:renew',title:'EL ATLAS DEL PRIMER AMANECER',
  opening:'Iria ha dejado una página en blanco junto al nombre recuperado de su hermano.',
  nael:'Nael conserva el Atlas, pero abre las cubiertas para que cada persona pueda añadir o rechazar su propia historia.',
  oriel:'Oriel desmanteló el mandato del Telar. Nadie recibirá un futuro impuesto.',
  resolution:'Las vidas imposibles quedan a salvo en el Atlas y las posibles escribirán por sí mismas la próxima página.',
  relic:'ember-tooth',reason:'Una promesa que se renueva enciende las técnicas de Ceniza.'
 },
 'release:remember':{
  id:'release:remember',title:'EL SILENCIO QUE PROTEGE',
  opening:'Iria enciende una vela por quienes regresaron y por quienes ya no necesitan hacerlo.',
  nael:'Nael dejó partir las vidas imposibles. La campana y el farol siguen presentes para quienes quieran despedirse.',
  oriel:'Oriel guarda los nombres de los vivos, nunca el derecho a dirigirlos.',
  resolution:'Recordar no será una prisión. Arken protege a los presentes y permite que los ausentes descansen.',
  relic:'pilgrim-ward',reason:'El juramento de dejar partir protege al vínculo de los ataques directos.'
 },
 'release:renew':{
  id:'release:renew',title:'LA PRIMERA PÁGINA EN BLANCO',
  opening:'Iria ha plantado un árbol en la plaza, sin inscribirle un nombre heredado.',
  nael:'Nael dejó descansar las vidas imaginadas y conservó la gratitud, no el peso de una obligación.',
  oriel:'Oriel dejó el Telar vacío: nadie volverá a escribir un destino antes de que ocurra.',
  resolution:'Arken aprende a vivir sin un nombre impuesto. Sus vínculos pueden sanar sin olvidar de dónde vienen.',
  relic:'hearth-bead',reason:'El futuro libre concede una Cuenta de Lumbre que fortalece la recuperación.'
 }
};
/** Fail closed for incomplete or contradictory save flags; never reveal a future outcome. */
export function legacyBranch(flags:readonly string[]):LegacyBranch|null{
 if(!['arken-vow-restored','marsh-chapter-complete','crown-trilogy-complete'].every(f=>flags.includes(f)))return null;
 const marsh=['keep','release'].filter(x=>flags.includes('marsh-choice-'+x));
 const crown=['remember','renew'].filter(x=>flags.includes('crown-choice-'+x));
 if(marsh.length!==1||crown.length!==1)return null;
 const branch=OUTCOMES[marsh[0]+':'+crown[0]];
 return branch?{...branch}:null;
}
export function legacyClaimed(flags:readonly string[]):boolean{return flags.includes(LEGACY_WITNESS_FLAG);}
/** Compute deterministic real equipment award, with the normal six-copy limit. */
export function legacyReward(save:Pick<SaveGame,'flags'|'relics'|'team'|'storage'>):RelicId|null{
 const branch=legacyBranch(save.flags);
 if(!branch||!validRelicOwnership(save.relics,[...save.team,...save.storage]))return null;
 const priority=[branch.relic,...RELIC_IDS];
 return priority.find((id,index)=>priority.indexOf(id)===index&&(save.relics?.[id]??0)<RELIC_COPY_LIMIT)??null;
}
/** Build the entire transaction without mutating the active save on failure. */
export function planLegacyClaim(save:SaveGame):SaveGame|null{
 if(!legacyBranch(save.flags)||legacyClaimed(save.flags)||save.flags.length>=200||
  save.activeBattle||save.dungeon?.active||save.expedition||
  !validRelicOwnership(save.relics,[...save.team,...save.storage]))return null;
 const chosen=legacyReward(save),relics={...save.relics};
 if(chosen)relics[chosen]=(relics[chosen]??0)+1;
 return {...save,flags:[...save.flags,LEGACY_WITNESS_FLAG],relics};
}
export function legacyReceipt(save:Pick<SaveGame,'flags'|'relics'|'team'|'storage'>):string{
 if(legacyClaimed(save.flags))return 'El testimonio ya fue escrito y no puede reclamarse otra vez.';
 const relic=legacyReward(save);
 return relic?'RECOMPENSA ÚNICA · '+RELICS[relic].name+' · '+RELICS[relic].description:
  'Tus reliquias están completas. El testimonio aún puede cerrarse sin duplicar equipo.';
}
