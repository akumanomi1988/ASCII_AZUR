/**
 * M3: exploration meaning, bounded encounter pacing and fog-respecting leads.
 * Read-only projections from existing world, party and v1 flags; no new saves.
 */
import {SPECIES,TYPE_ADV} from '../domain.js';
import {ZONES,type ZoneId,type Landmark} from '../world.js';
import type {FieldObjective} from './field-journal.js';

export interface ExplorationRegionTheme {title:string;purpose:string;payoff:string;optional:boolean;}
const REGIONAL_THEMES:Record<ZoneId,ExplorationRegionTheme>={
 village:{title:'LA SILLA VACÍA',purpose:'Iria busca a su hermano mientras Arken pierde el recuerdo de sus habitantes.',payoff:'Escucha al Archivista, prepara tu equipo y encuentra pistas para recuperar sus nombres.',optional:false},
 forest:{title:'LOS NOMBRES ENTRE RAÍCES',purpose:'Los árboles repiten voces borradas. El Peregrino puede devolver una historia a Arken.',payoff:'Los senderos y los testigos revelan afinidades útiles antes de Hollowhart.',optional:false},
 sanctuary:{title:'TRES VOCES, UNA PALABRA',purpose:'La Custodia conserva tres juramentos de Raíz, Bruma y Éter.',payoff:'Enfrenta o vincula a los tres testigos y regresa con la Custodia; el Guardián custodia la Primera Palabra.',optional:false},
 marsh:{title:'LAS VIDAS QUE NO NACIERON',purpose:'Nael guarda los nombres de personas que nunca llegaron a existir.',payoff:'La campana, el farol y los tres testigos preparan una decisión irreversible sobre su recuerdo.',optional:false},
 spire:{title:'EL CIELO SIN DESTINO',purpose:'Oriel y Nullscribe discrepan sobre quién debe escribir el futuro de los vivos.',payoff:'La Lumbre, el Archivo y los centinelas preparan el final: conservar los nombres o liberar el Telar.',optional:false},
 ossuary:{title:'LAS VOCES QUE EL TELAR NO ALCANZÓ',purpose:'Edda escucha historias sin decisiones posibles. Este capítulo ocurre después del final principal.',payoff:'La Concha, el Faro y los testigos conducen al Pozo; el Jardín se abrirá al cerrar esta Vigilia opcional.',optional:true},
 garden:{title:'UNA PRIMAVERA SIN ORDEN',purpose:'Silas protege un jardín que nunca ha florecido. La Vigilia es opcional.',payoff:'Escucha la Semilla y el Árbol, resuelve sus testigos y decide si llega la primavera.',optional:true}
};
export function regionFieldGuide(zone:ZoneId,flags:readonly string[]):ExplorationRegionTheme{
 const guide=REGIONAL_THEMES[zone];
 const opened=zone==='ossuary'?flags.includes('crown-trilogy-complete'):zone==='garden'?flags.includes('afterlight-ossuary-complete'):true;
 return opened?{...guide}: {title:ZONES[zone].name.toUpperCase(),purpose:'La historia aún no ha abierto este territorio.',payoff:'Avanza en los capítulos anteriores antes de cruzar.',optional:guide.optional};
}

const REGIONAL_SITE_CLUES:Readonly<Record<ZoneId,Partial<Record<Landmark['kind'],string>>>>={
 village:{npc:'Una conversación puede convertir una ausencia en un objetivo concreto.',rune:'La primera inscripción explica qué significa conservar una palabra.',chest:'El cofre contiene suministros y una inscripción; solo puede abrirse una vez.',altar:'Descansa, recobra la salud y prepara tu expedición sin gastar Tónicos.'},
 forest:{npc:'El Peregrino conoce a alguien en Arken que teme haberlo olvidado.',rune:'La raíz conserva un juramento previo al silencio.',chest:'Una ruta apartada custodia un alijo finito útil para preparar al Guardián.',altar:'Lumbre de los viajeros: cura y establece un destino de regreso.'},
 sanctuary:{npc:'La Custodia reconoce a cada testigo derrotado o vinculado y entrega una ofrenda finita cuando estén los tres.',rune:'La inscripción describe el precio de la primera palabra.',guardian:'Hollowhart es Raíz; busca ofensivas de Ceniza y protege tus vínculos del golpe cargado.',chest:'Un desvío del sendero oculta una reliquia y suministros sin repetición.',altar:'Recupera vida antes del Guardián y revisa los juramentos disponibles.'},
 marsh:{npc:'Nael escucha a quien ha conocido las dos vidas y los tres testigos.',memory:'Las dos memorias no conceden recursos: permiten comprender qué escogerás en el Tribunal.',verdict:'La decisión queda fijada en el Atlas y cambia las palabras de Nael más adelante.',chest:'Un arca de la Marisma conserva suministros y una reliquia finita.',altar:'La Lumbre recupera tus vínculos antes de la sentencia.'},
 spire:{npc:'Oriel escucha cómo elegiste recordar en la Marisma, y después contará el desenlace.',memory:'La Lumbre y el Archivo cuentan por qué conservar un nombre no implica gobernarlo.',verdict:'El Telar ofrece dos destinos irreversibles y cuatro epílogos según tu elección anterior.',guardian:'Nullscribe carga ECLIPSE; observa el aviso y usa GUARDIA cuando corresponda.',chest:'El tesoro guarda una reliquia y suministros para preparar el combate final.',altar:'Recupera salud y revisa técnicas antes del enfrentamiento final.'},
 ossuary:{npc:'Edda conserva voces que el Telar nunca llegó a registrar.',memory:'La Concha y el Faro revelan el peso de las decisiones no tomadas.',verdict:'Anclar las voces o devolverlas al mar cambia el sentido del viaje hacia el Jardín.',chest:'El arca contiene una reliquia y recursos finitos, no una misión obligatoria.',altar:'Esta Lumbre permite descansar y volver por rutas ya recorridas.'},
 garden:{npc:'Silas busca una respuesta que no obligue a la primavera a repetir el pasado.',memory:'La Semilla y el Árbol describen dos maneras de cuidar algo aún inexistente.',verdict:'Abrir la primavera o guardar el reposo resuelve la Vigilia; ninguna altera el final principal.',chest:'Un último cofre conserva suministros y una reliquia opcional.',altar:'Recupera a los vínculos antes de las últimas decisiones.'}
};
export function landmarkFieldHint(zone:ZoneId,site:Landmark,done:boolean):string{
 const purpose=REGIONAL_SITE_CLUES[zone][site.kind]??(site.kind==='portal'?'La siguiente región requiere caminar hasta el portal y cumplir su condición narrativa.':'Descubre qué guarda este lugar.');
 if(site.kind==='chest')return (done?'Ya saqueado; no reaparecen recursos. ':'')+purpose+(done?'':' Recibirás 3 Sellos, 2 Tónicos y 25 Ecos, además de la reliquia si aún queda.');
 if(site.kind==='altar'&&done)return'Ya visitada. Descansa para sanar y usa la red de Lumbres desde aquí.';
 return done?'Ya documentado. '+purpose:purpose;
}
const TRAIL_STORIES:Record<Exclude<ZoneId,'village'>,readonly [string,string,string]>={
 forest:['Una voz de Bruma abre camino a las raíces.', 'La raíz persiste aun donde cayó la ceniza.', 'Un eco de Éter desafía a quien solo confía en la fuerza.'],
 sanctuary:['La Raíz conserva el primer juramento.', 'La Bruma escucha sin escribir destinos.', 'El Éter refleja una palabra aún sin dueño.'],
 marsh:['Una vida imposible flota entre juncos.', 'El sonido de la campana atrae antiguos ecos.', 'Una brasa recuerda el sendero que el agua negó.'],
 spire:['Una ceniza de Arken alcanzó la Corona.', 'La Bruma oculta nombres que todavía importan.', 'El Éter prueba si tu memoria sabe defenderse.'],
 ossuary:['Una marea trajo nombres más antiguos que el Telar.', 'Un testigo ha olvidado la orilla.', 'Una raíz permanece bajo la sal.'],
 garden:['Una voz de escarcha duerme bajo el follaje.', 'La ceniza puede calentar una semilla.', 'Un eco guarda el invierno sin encerrarlo.']
};
export function witnessFieldHint(zone:ZoneId,slot:number,speciesId:string,done:boolean):string{
 if(zone==='village'||!Number.isInteger(slot)||slot<0||slot>2)return'Encuentro no identificado.';
 const species=SPECIES[speciesId];
 const trail=TRAIL_STORIES[zone][slot];
 if(!species)return trail??'Rastro por identificar.';
 const counter=Object.entries(TYPE_ADV).find(([,effect])=>effect===species.element)?.[0];
 return (done?'Testimonio conservado. ':'Rastro activo. ')+trail+' '+species.name+' · '+species.element+
  (counter?' · contraataque elemental: '+counter:'')+'. Victoria o captura resuelven el rastro una sola vez.';
}
export function witnessFieldAftermath(zone:ZoneId,id:string,flags:readonly string[]):string|null{
 const match=/^(forest|sanctuary|marsh|spire|ossuary|garden)-([0-2])$/.exec(id);
 if(!match||match[1]!==zone||!flags.includes('roamer-'+id))return null;
 const index=Number(match[2]),resolved=[0,1,2].filter(i=>flags.includes('roamer-'+zone+'-'+i)).length;
 return 'TESTIGO '+(index+1)+'/3 · '+TRAIL_STORIES[zone as Exclude<ZoneId,'village'>][index]+
  (resolved===3?' · Los tres testimonios están listos para su custodio.':' · '+resolved+'/3 resueltos.');
}
export interface ExplorationLead {id:string;zone:ZoneId;label:string;hint:string;}
/** Only pre-discovered, actionable, unfinished goals can be recommended. */
export function nextKnownFieldLead(entries:readonly FieldObjective[],zone:ZoneId,x:number,y:number):ExplorationLead|null{
 const actionable=entries.filter(e=>e.zone===zone&&e.known&&e.trackable&&!e.done&&e.x!==undefined&&e.y!==undefined);
 const rank=(e:FieldObjective):number=>{
  const priority:Record<string,number>={npc:0,memory:1,witness:2,rune:3,guardian:4,verdict:5,chest:6,altar:7,epilogue:0,crypt:8};
  return (priority[e.kind]??9)*12+Math.hypot((e.x??x)-x,(e.y??y)-y);
 };
 actionable.sort((a,b)=>rank(a)-rank(b)||a.id.localeCompare(b.id));
 const pick=actionable[0];return pick?{id:pick.id,zone:pick.zone,label:pick.label,hint:pick.hint}:null;
}
export interface WildPacing {chance:number;distance:number;reason:string;}
/** Roll at fixed movement intervals even when the roll misses, preventing "retry every frame".
 * Cleared regions remain replayable; mandatory visible witnesses are unaffected. */
export function wildPacing(zone:ZoneId,flags:readonly string[]):WildPacing{
 const clear=flags.includes('survey-'+zone);
 // The authored Ossuary/Garden pilgrimages are choice-led, not random-battle attrition.
 // Visible witnesses and manual duels remain available; wild travel resumes after that chapter.
 if((zone==='ossuary'||zone==='garden')&&!flags.includes('afterlight-'+zone+'-complete'))
  return {chance:0,distance:12,reason:'VIGILIA GUIADA · TESTIGOS VISIBLES'};
 const witnesses=zone!=='village'&&[0,1,2].every(i=>flags.includes('roamer-'+zone+'-'+i));
 if(clear)return{chance:0.035,distance:12,reason:'RECONOCIMIENTO COMPLETO'};
 if(witnesses)return{chance:0.07,distance:9,reason:'TRES RASTROS RESUELTOS'};
 return{chance:zone==='forest'?.22:.12,distance:zone==='forest'?6:7,reason:'TERRITORIO ACTIVO'};
}
