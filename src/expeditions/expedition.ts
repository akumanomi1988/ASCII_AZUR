/** Seeded, snapshot-driven roguelite expeditions. Pure domain; no DOM or Math.random. */
export type Biome='ashwood'|'crypt'|'marsh'|'archive';
export type RoomKind='skirmish'|'elite'|'cache'|'camp'|'omen'|'boss';
export type Reward={echoes:number;seals:number;tonics:number};
export interface Room {id:string;kind:RoomKind;name:string;description:string;speciesId?:string;level?:number;reward:Reward;}
export interface Expedition {version:1;seed:number;biome:Biome;floor:number;rooms:Room[][];cleared:string[];pending:string|null;treasure:Reward;}
export const BIOMES:Record<Biome,{name:string;subtitle:string;enemies:string[];accent:string}>={
 ashwood:{name:'Bosque que Olvida',subtitle:'Sendas cubiertas de ceniza y raíces',enemies:['cindrel','ashboar','briarling','thorne','gravemoth'],accent:'#d1a078'},
 crypt:{name:'Cripta de los Ausentes',subtitle:'Cámaras bajo los nombres muertos',enemies:['wispawn','runeowl','gravemoth','velaria'],accent:'#b9a1dc'},
 marsh:{name:'Marjal de la Última Lluvia',subtitle:'Aguas oscuras, reflejos y niebla',enemies:['mireling','rillfin','velaria','briarling'],accent:'#83bfbf'},
 archive:{name:'Archivo Fragmentado',subtitle:'Recuerdos escritos en piedra rota',enemies:['runeowl','wispawn','gravemoth','thorne'],accent:'#c6bd9d'}
};
export const EXPEDITION_FLOORS=5;
export function seededRandom(seed:number):()=>number{let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};}
const EMPTY=():Reward=>({echoes:0,seals:0,tonics:0});
function prize(kind:RoomKind,depth:number):Reward{return kind==='cache'?{echoes:16+depth*9,seals:1,tonics:depth>2?1:0}:kind==='camp'?{echoes:0,seals:0,tonics:1}:kind==='omen'?{echoes:14+depth*4,seals:0,tonics:0}:kind==='elite'?{echoes:23+depth*13,seals:1,tonics:0}:kind==='boss'?{echoes:125,seals:2,tonics:2}:{echoes:10+depth*7,seals:0,tonics:0};}
function generateRooms(seed:number,biome:Biome):Room[][]{
 const rng=seededRandom((seed^(["ashwood","crypt","marsh","archive"].indexOf(biome)+1)*0x9e3779b9)>>>0);
 const catalogue=BIOMES[biome].enemies,rooms:Room[][]=[];
 for(let floor=0;floor<EXPEDITION_FLOORS;floor++){
  const kinds:RoomKind[]=floor===4?['boss']:floor===0?['skirmish','cache','omen']:floor===2?['elite','camp','skirmish']:['skirmish','cache','camp'];
  const options=floor===4?1:3;
  rooms.push(Array.from({length:options},(_,index)=>{
    const kind=kinds[(index+((seed>>>floor)%kinds.length))%kinds.length]!;
    const speciesId=kind==='boss'?catalogue[catalogue.length-1]!:catalogue[Math.floor(rng()*catalogue.length)]!;
    const level=kind==='boss'?13:kind==='elite'?9+floor:5+floor+Math.floor(rng()*3);
    const adjective=['sin voz','velada','de los ecos','quebrada','olvidada'][Math.floor(rng()*5)]!;
    const name={skirmish:'Rastro de criaturas',elite:'Guardián errante',cache:'Alijo oculto',camp:'Hoguera silenciosa',omen:'Fragmento de memoria',boss:'Núcleo de la Grieta'}[kind];
    return {id:`f${floor}-r${index}`,kind,name:`${name} ${adjective}`,description:kind==='camp'?'Recupera parte de la salud del equipo.':kind==='cache'?'Recupera provisiones y ecos.':kind==='omen'?'Interpreta una memoria a cambio de Ecos.':kind==='boss'?'Un último vínculo corrompido protege la salida.':kind==='elite'?'Un adversario poderoso guarda este paso.':'Un encuentro te espera tras las sombras.',...(kind==='skirmish'||kind==='elite'||kind==='boss'?{speciesId,level}:{}),reward:prize(kind,floor)};
  }));
 }
 return rooms;
}
export function createExpedition(seed:number,biome:Biome):Expedition{
 if(!Number.isInteger(seed)||seed<1||seed>0xffffffff||!BIOMES[biome])throw Error('Semilla o bioma inválidos');
 return {version:1,seed,biome,floor:0,rooms:generateRooms(seed,biome),cleared:[],pending:null,treasure:EMPTY()};
}
export function availableRooms(run:Expedition):readonly Room[]{return run.rooms[run.floor]??[];}
export function roomById(run:Expedition,id:string):Room|undefined{return availableRooms(run).find(x=>x.id===id);}
export function chooseRoom(run:Expedition,id:string):{next:Expedition;room:Room;requiresBattle:boolean}{
 if(run.pending||run.floor>=EXPEDITION_FLOORS||run.cleared.includes(id))throw Error('Expedición no disponible');
 const room=roomById(run,id);if(!room)throw Error('Sala inexistente');
 const fight=room.kind==='skirmish'||room.kind==='elite'||room.kind==='boss';
 if(fight)return {room,next:{...run,pending:id},requiresBattle:true};
 return {room,next:advance(run,room),requiresBattle:false};
}
function advance(run:Expedition,room:Room):Expedition{
 if(room.kind==='camp')return {...run,floor:run.floor+1,cleared:[...run.cleared,room.id],pending:null};
 return {...run,floor:run.floor+1,cleared:[...run.cleared,room.id],pending:null,treasure:{echoes:run.treasure.echoes+room.reward.echoes,seals:run.treasure.seals+room.reward.seals,tonics:run.treasure.tonics+room.reward.tonics}};
}
export function completeBattle(run:Expedition):Expedition{
 if(!run.pending)throw Error('No hay combate pendiente');
 const room=roomById(run,run.pending);if(!room||!['skirmish','elite','boss'].includes(room.kind))throw Error('Estado de combate inválido');
 return advance(run,room);
}
export function expeditionComplete(run:Expedition){return run.floor>=EXPEDITION_FLOORS&&!run.pending;}
export function validateExpedition(v:unknown):v is Expedition{
 if(!v||typeof v!=='object')return false;const a=v as Partial<Expedition>;
 if(a.version!==1||!Number.isInteger(a.seed)||a.seed!<1||a.seed!>0xffffffff||typeof a.biome!=='string'||!(a.biome in BIOMES)||!Number.isInteger(a.floor)||a.floor!<0||a.floor!>EXPEDITION_FLOORS)return false;
 if(!Array.isArray(a.rooms)||a.rooms.length!==EXPEDITION_FLOORS||!Array.isArray(a.cleared)||a.cleared.length>EXPEDITION_FLOORS||!(a.pending===null||typeof a.pending==='string')||!a.treasure)return false;
 const snapshot=generateRooms(a.seed!,a.biome as Biome);
 // Strict snapshot consistency prevents injected rewards and tampered room levels.
 if(JSON.stringify(a.rooms)!==JSON.stringify(snapshot))return false;
 const validIds=new Set(snapshot.flat().map(r=>r.id));
 if(a.cleared.length!==a.floor||new Set(a.cleared).size!==a.cleared.length||a.cleared.some(id=>!validIds.has(id)))return false;
 for(let i=0;i<a.cleared.length;i++)if(!snapshot[i]!.some(r=>r.id===a.cleared![i]))return false;
 if(a.pending!==null&&!snapshot[a.floor!]?.some(r=>r.id===a.pending))return false;
 const expected=EMPTY();for(let i=0;i<a.cleared.length;i++){const room=snapshot[i]!.find(r=>r.id===a.cleared![i])!;if(room.kind!=='camp'){expected.echoes+=room.reward.echoes;expected.seals+=room.reward.seals;expected.tonics+=room.reward.tonics;}}
 return Object.entries(expected).every(([k,n])=>(a.treasure as unknown as Record<string,unknown>)[k]===n);
}
export function settleExpedition(run:Expedition,won:boolean):Reward{
 if(won&&!expeditionComplete(run))throw Error('Expedición no completada');
 const factor=won?1:.25;
 return {echoes:Math.floor(run.treasure.echoes*factor),seals:won?run.treasure.seals:0,tonics:won?run.treasure.tonics:0};
}
