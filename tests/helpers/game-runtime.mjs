import fs from 'node:fs';
import vm from 'node:vm';
const fakeContext={
 clearRect(){},fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},translate(){},scale(){},save(){},restore(){},ellipse(){},quadraticCurveTo(){},setTransform(){},rotate(){},arc(){},rect(){},strokeRect(){},putImageData(){},drawImage(){},
 createLinearGradient(){return{addColorStop(){}}},createRadialGradient(){return{addColorStop(){}}},
 getImageData(){return{data:new Uint8ClampedArray(960*540*4)}}
};
export function mount({virtualTime=false,seed=1,priorSave=null}={}){
 const dom=new Map(),store=new Map(),timers=[];
 if(priorSave!==null)store.set('ascii-azur-save-v1',priorSave);
 let nextTimerId=0, clock=0, randomSeed=seed>>>0;
 const randomMath=Object.create(Math);
 randomMath.random=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;};
 const virtualSetTimeout=(callback,delay=0)=>{
  const entry={id:++nextTimerId,callback,at:clock+(Number(delay)||0),cancelled:false};
  timers.push(entry);return entry.id;
 };
 const virtualClearTimeout=(id)=>{for(const t of timers)if(t.id===id)t.cancelled=true;};
 const flushTimers=(limit=50)=>{
  for(let steps=0;steps<limit;steps++){
   const next=timers.filter(t=>!t.cancelled).sort((a,b)=>a.at-b.at||a.id-b.id)[0];
   if(!next){timers.length=0;return;}
   timers.splice(timers.indexOf(next),1);clock=next.at;next.callback();
  }
  if(timers.some(t=>!t.cancelled))throw new Error('Unbounded queued callbacks');
 };
 const make=(id='')=>{
  const classes=new Set(['hidden']);
  return {id,style:{},dataset:{},hidden:false,innerHTML:'',textContent:'',classList:{add:(x)=>classes.add(x),remove:(x)=>classes.delete(x),contains:(x)=>classes.has(x),toggle:(x,on)=>{if(on===undefined? !classes.has(x):on){classes.add(x);return true;}classes.delete(x);return false;}},
    addEventListener(){},focus(){},attributes:{},children:[],setAttribute(k,v){this.attributes[k]=v},getAttribute(k){return this.attributes[k]||''},replaceWith(){},replaceChildren(...xs){this.children=xs},appendChild(x){this.children.push(x)},append(...xs){this.children.push(...xs)},after(){},closest(){return make('sidebar')},
    querySelector(){return null},querySelectorAll(){return[]},getBoundingClientRect(){return{left:0,top:0,width:960,height:540}},
    getContext:(mode)=>mode==='2d'?fakeContext:null,
    set width(x){this._w=x},get width(){return this._w||960},set height(x){this._h=x},get height(){return this._h||540}
  };
 };
 const doc={getElementById:(id)=>{if(!dom.has(id))dom.set(id,make(id));return dom.get(id)},createElement:(name)=>make(name),addEventListener(){},querySelectorAll(){return[]}};
 const win={devicePixelRatio:1,addEventListener(){},setTimeout:virtualTime?virtualSetTimeout:setTimeout};
 const storage={setItem:(k,v)=>store.set(k,v),getItem:(k)=>store.get(k)||null};
 const html=fs.readFileSync(new URL('../../play.html',import.meta.url),'utf8');
 const source=html.split('<script>\n').at(-1).split('\n</script>')[0].replace(/new AzurGame\(\);\s*$/, 'globalThis.GAME = new AzurGame(); globalThis.AZUR_TEST_WORLD = {ZONES,canOccupy,sweepMove,WORLD_W,WORLD_H};');
 const sandbox={document:doc,window:win,localStorage:storage,navigator:{},performance,console,AudioContext:class{constructor(){throw new Error('audio unavailable')}},ImageData:class{constructor(width,height){this.width=width;this.height=height;this.data=new Uint8ClampedArray(width*height*4)}},requestAnimationFrame(){},setTimeout:virtualTime?virtualSetTimeout:setTimeout,clearTimeout:virtualTime?virtualClearTimeout:clearTimeout,Math:virtualTime?randomMath:Math};
 vm.runInNewContext(source,sandbox,{timeout:5000});
 return{game:sandbox.GAME,dom,storage,flushTimers,world:sandbox.AZUR_TEST_WORLD};
}
