/** ASCII AZUR procedural score: all sounds are synthesized locally with Web Audio. */
export type MusicScene = 'title' | 'village' | 'forest' | 'sanctuary' | 'marsh' | 'spire' | 'battle' | 'boss';
type Note = number | null;
type Theme = {
  bpm: number; root: number; mode: readonly number[];
  melody: readonly Note[]; bass: readonly Note[]; chords: readonly (readonly number[])[];
  texture: 'warm' | 'mist' | 'void' | 'percussion';
};
const themes:Record<MusicScene,Theme> = {
  title:{bpm:68,root:48,mode:[0,2,3,5,7,8,10],melody:[0,null,2,null,3,null,2,null,4,null,3,2,0,null,-2,null],bass:[0,null,null,null,-2,null,null,null,-4,null,null,null,-2,null,null,null],chords:[[0,2,4],[-2,0,2],[-4,-2,0],[-2,0,3]],texture:'mist'},
  village:{bpm:78,root:48,mode:[0,2,3,5,7,8,10],melody:[0,null,2,3,4,null,3,null,2,null,0,null,-2,0,null,null],bass:[0,null,null,null,-2,null,null,null,-4,null,null,null,-2,null,null,null],chords:[[0,2,4],[-2,0,2],[-4,-2,0],[-2,0,3]],texture:'warm'},
  forest:{bpm:66,root:45,mode:[0,2,3,5,7,8,10],melody:[0,null,null,2,3,null,null,2,4,null,3,null,1,null,-2,null],bass:[0,null,null,null,-2,null,null,null,-4,null,null,null,-2,null,null,null],chords:[[0,2,4],[-2,0,2],[-4,-2,0],[-2,0,3]],texture:'mist'},
  sanctuary:{bpm:56,root:45,mode:[0,1,3,5,7,8,10],melody:[0,null,null,null,3,null,2,null,5,null,null,3,1,null,-1,null],bass:[0,null,null,null,-3,null,null,null,-4,null,null,null,-1,null,null,null],chords:[[0,2,4],[-3,-1,1],[-4,-2,0],[-1,1,3]],texture:'void'},
  marsh:{bpm:62,root:43,mode:[0,2,3,5,7,8,10],melody:[0,null,3,null,2,1,null,-2,0,null,4,3,1,null,-2,null],bass:[0,null,null,null,-4,null,null,null,-2,null,null,null,-5,null,null,null],chords:[[0,2,4],[-4,-2,0],[-2,0,2],[-5,-2,1]],texture:'mist'},
  spire:{bpm:52,root:41,mode:[0,1,3,5,6,8,10],melody:[0,null,3,null,5,3,1,null,-2,null,1,4,null,-1,0,null],bass:[0,null,null,null,-3,null,null,null,-5,null,null,null,-1,null,null,null],chords:[[0,2,4],[-3,-1,1],[-5,-2,0],[-1,1,3]],texture:'void'},
  battle:{bpm:126,root:45,mode:[0,2,3,5,7,8,10],melody:[0,0,4,null,3,2,4,null,5,4,3,2,0,null,-2,0],bass:[0,null,0,null,-2,null,-2,null,-4,null,-4,null,-2,null,-2,null],chords:[[0,2,4],[-2,0,2],[-4,-2,0],[-2,0,3]],texture:'percussion'},
  boss:{bpm:144,root:43,mode:[0,1,3,5,7,8,10],melody:[0,null,3,2,1,0,-2,null,4,3,5,null,3,1,0,-2],bass:[0,null,0,null,-1,null,-1,null,-4,null,-4,null,-2,null,-2,null],chords:[[0,2,4],[-1,1,3],[-4,-2,0],[-2,0,2]],texture:'percussion'}
};
export type AmbienceProfile={gain:number;lowpassHz:number;modulation:number};
/** Ambient soundbed uses one looping seeded-noise buffer, no samples or streaming. */
export function ambienceForScene(scene:MusicScene):AmbienceProfile{
 switch(scene){case 'forest':return{gain:.14,lowpassHz:450,modulation:.35};
 case 'spire':return{gain:.16,lowpassHz:210,modulation:.23};
 case 'marsh':return{gain:.20,lowpassHz:340,modulation:.48};
 case 'sanctuary':return{gain:.17,lowpassHz:240,modulation:.18};
 case 'village':return{gain:.06,lowpassHz:650,modulation:.12};
 case 'battle':return{gain:.045,lowpassHz:1100,modulation:.1};
 case 'boss':return{gain:.085,lowpassHz:310,modulation:.2};
 default:return{gain:.035,lowpassHz:600,modulation:.15};}
}
export function themeForZone(zone:'village'|'forest'|'sanctuary'|'marsh'|'spire'):MusicScene{return zone;}
export function midiFrequency(midi:number):number{return 440*Math.pow(2,(midi-69)/12);}
/** Scaled degree -> chromatic offset, supporting degrees below zero. */
export function degreeSemitone(degree:number,mode:readonly number[]):number {
  const octave=Math.floor(degree/7),index=((degree%7)+7)%7;
  return octave*12+mode[index]!;
}
export function getThemeSummary(scene:MusicScene):{bpm:number;steps:number;texture:string}{
  const t=themes[scene];return {bpm:t.bpm,steps:t.melody.length,texture:t.texture};
}
export class Sound {
  private ctx:AudioContext|null=null;
  private master:GainNode|null=null;
  private musicMaster:GainNode|null=null;
  private fxMaster:GainNode|null=null;
  private bus:GainNode|null=null;
  private ambience:GainNode|null=null;private ambientFilter:BiquadFilterNode|null=null;
  private ambientSource:AudioBufferSourceNode|null=null;private windLfo:OscillatorNode|null=null;private windDepth:GainNode|null=null;
  private enabled=true;
  private musicVolume=.38;
  private fxVolume=.55;
  private scene:MusicScene='title';
  private timer:ReturnType<typeof setInterval>|null=null;
  private nextAt=0;
  private step=0;
  private readonly lookAhead=.28;

  get musicScene():MusicScene{return this.scene;}
  get isEnabled():boolean{return this.enabled;}
  getMusicVolume():number{return this.musicVolume;}
  getEffectsVolume():number{return this.fxVolume;}

  private init(){
    if(this.ctx)return;
    this.ctx=new AudioContext();
    this.master=this.ctx.createGain();this.master.gain.value=this.enabled?1:0;
    this.master.connect(this.ctx.destination);
    this.musicMaster=this.ctx.createGain();this.musicMaster.gain.value=this.musicVolume;
    this.musicMaster.connect(this.master);
    this.fxMaster=this.ctx.createGain();this.fxMaster.gain.value=this.fxVolume;
    this.fxMaster.connect(this.master);
    this.newBus(true);this.startAmbience();
    this.nextAt=this.ctx.currentTime+.08;
    this.timer=setInterval(()=>this.tick(),90);
  }
  /** Must be called by a tap/click/keypress; browsers block automatic audio. */
  unlock(){try{this.init();if(this.ctx?.state==='suspended')void this.ctx.resume().catch(()=>{});this.tick();}catch{/* unavailable audio must not interrupt gameplay */}}
  setEnabled(v:boolean){this.enabled=v;if(v&&this.ctx)this.unlock();if(this.ctx&&this.master){this.master.gain.setTargetAtTime(v?1:0,this.ctx.currentTime,.07);}}
  setMusicVolume(v:number){this.musicVolume=Math.max(0,Math.min(1,v));if(this.ctx&&this.musicMaster){this.musicMaster.gain.setTargetAtTime(this.musicVolume,this.ctx.currentTime,.05);if(this.musicVolume>0)this.nextAt=Math.max(this.nextAt,this.ctx.currentTime+.06);}}
  setEffectsVolume(v:number){this.fxVolume=Math.max(0,Math.min(1,v));if(this.ctx&&this.fxMaster)this.fxMaster.gain.setTargetAtTime(this.fxVolume,this.ctx.currentTime,.05);}
  setScene(scene:MusicScene){
    if(this.scene===scene)return;
    this.scene=scene;this.step=0;
    if(!this.ctx)return;
    this.newBus(false);this.setAmbience();
    this.nextAt=this.ctx.currentTime+.08;
    this.tick();
  }
  private startAmbience(){
    const ctx=this.ctx;if(!ctx||!this.musicMaster)return;
    const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),samples=buffer.getChannelData(0);
    let seed=11235813;for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;samples[i]=((seed>>>0)/4294967295)*2-1;}
    const src=ctx.createBufferSource();src.buffer=buffer;src.loop=true;
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.Q.value=.6;
    const gain=ctx.createGain();gain.gain.value=0;
    src.connect(filter).connect(gain).connect(this.musicMaster);
    const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.type='sine';lfo.frequency.value=.18;depth.gain.value=0;
    lfo.connect(depth).connect(gain.gain);lfo.start();src.start();
    this.ambientSource=src;this.ambientFilter=filter;this.ambience=gain;this.windLfo=lfo;this.windDepth=depth;
    this.setAmbience();
  }
  private setAmbience(){
    const ctx=this.ctx;if(!ctx||!this.ambience||!this.ambientFilter)return;
    const a=ambienceForScene(this.scene);
    this.ambience.gain.setTargetAtTime(a.gain,ctx.currentTime,.65);
    this.windDepth?.gain.setTargetAtTime(a.gain*a.modulation,ctx.currentTime,.65);
    this.ambientFilter.frequency.setTargetAtTime(a.lowpassHz,ctx.currentTime,.6);
  }
  private newBus(initial:boolean){
    if(!this.ctx||!this.musicMaster)return;
    const now=this.ctx.currentTime,old=this.bus;
    const next=this.ctx.createGain();next.gain.setValueAtTime(initial?1:0,now);
    if(!initial)next.gain.linearRampToValueAtTime(1,now+.65);
    next.connect(this.musicMaster);this.bus=next;
    if(old){old.gain.cancelScheduledValues(now);old.gain.setValueAtTime(old.gain.value,now);old.gain.linearRampToValueAtTime(0,now+.65);
      // Disconnect only after previously scheduled notes have released.
      setTimeout(()=>{try{old.disconnect();}catch{/* already disposed */}},2200);
    }
  }
  private note(midi:number,at:number,duration:number,kind:'lead'|'bass'|'pad'|'bell'|'perc',volume:number){
    const c=this.ctx,bus=this.bus;if(!c||!bus||!this.enabled||this.musicVolume===0)return;
    const oscillator=c.createOscillator(),gain=c.createGain();
    oscillator.type=kind==='bass'?'triangle':kind==='lead'?'sine':kind==='pad'?'triangle':kind==='bell'?'sine':'square';
    const freq=midiFrequency(midi);oscillator.frequency.setValueAtTime(freq,at);
    if(kind==='bell')oscillator.frequency.exponentialRampToValueAtTime(freq*.998,at+duration);
    const attack=kind==='pad'?.12:.01,release=kind==='pad'?.38:kind==='bass'?.12:.16;
    const end=at+Math.max(duration,attack+.03),stop=end+release;
    gain.gain.setValueAtTime(.00001,at);
    gain.gain.linearRampToValueAtTime(volume,at+attack);
    gain.gain.setValueAtTime(volume*.72,end);
    gain.gain.exponentialRampToValueAtTime(.00001,stop);
    let output:AudioNode=oscillator;
    if(kind==='bass'||kind==='pad'){
      const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(kind==='bass'?650:1100,at);output.connect(filter);output=filter;
    }
    output.connect(gain).connect(bus);oscillator.start(at);oscillator.stop(stop+.02);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
  private tick(){
    const c=this.ctx;if(!c||c.state!=='running'||!this.enabled||this.musicVolume===0)return;
    if(this.nextAt<c.currentTime-.08)this.nextAt=c.currentTime+.08;
    let queued=0;
    while(this.nextAt<c.currentTime+this.lookAhead&&queued++<12){
      const t=themes[this.scene],step=this.step,idx=step%16,stepDuration=60/t.bpm/2;
      const chord=t.chords[Math.floor(idx/4)]!;
      const lead=t.melody[idx],bass=t.bass[idx];
      if(lead!=null){
        this.note(t.root+24+degreeSemitone(lead,t.mode),this.nextAt,stepDuration*(this.scene==='battle'?.83:1.55),'lead',t.texture==='percussion'?.045:.032);
      }
      if(bass!=null)this.note(t.root-12+degreeSemitone(bass,t.mode),this.nextAt,stepDuration*3.5,'bass',.048);
      if(idx%4===0){
        for(const degree of chord)this.note(t.root+12+degreeSemitone(degree,t.mode),this.nextAt,stepDuration*3.55,'pad',t.texture==='void'?.018:.010);
      }
      if(t.texture==='percussion'&&idx%2===0)this.note(t.root-24,this.nextAt,.035,'perc',.014);
      if(t.texture==='mist'&&idx%8===6)this.note(t.root+36+degreeSemitone(chord[1]!,t.mode),this.nextAt,stepDuration*2.1,'bell',.017);
      this.step++;this.nextAt+=stepDuration;
    }
  }
  tone(freq:number,duration=.12,type:OscillatorType='sine',volume=.04,delay=0){
    if(!this.enabled)return;try{
      this.unlock();const c=this.ctx;if(!c||!this.fxMaster)return;
      const at=c.currentTime+Math.max(0,delay),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);
      g.gain.setValueAtTime(.00001,at);g.gain.linearRampToValueAtTime(volume,at+.008);
      g.gain.exponentialRampToValueAtTime(.00001,at+duration);
      o.connect(g).connect(this.fxMaster);o.start(at);o.stop(at+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
    }catch{/* browser audio unavailable */}
  }
  hit(){this.tone(148,.15,'sawtooth',.028);this.tone(82,.2,'triangle',.035,.05);}
  /** Lightweight synthesized elemental attacks; no asset downloads or extra runtime dependencies. */
  hitElement(element:string){
    switch(element){
      case 'Ceniza':this.tone(188,.16,'sawtooth',.026);this.tone(72,.26,'triangle',.03,.03);break;
      case 'Bruma':this.tone(325,.22,'sine',.032);this.tone(438,.28,'sine',.018,.06);break;
      case 'Raíz':this.tone(93,.24,'triangle',.041);this.tone(146,.15,'square',.016,.03);break;
      case 'Éter':this.tone(550,.21,'sine',.035);this.tone(733,.3,'triangle',.023,.07);break;
      default:this.hit();break;
    }
  }
  evolve(){for(let i=0;i<7;i++)this.tone(262*Math.pow(2,i*2/12),.31,'sine',.025,i*.18);}
  pick(){this.tone(430,.10,'sine',.04);this.tone(620,.14,'sine',.035,.09);this.tone(820,.16,'sine',.035,.18);}
  select(){this.tone(540,.07,'sine',.022);}
  portal(){this.tone(160,.35,'triangle',.032);this.tone(320,.45,'sine',.020,.13);}
  pause(){if(this.ctx&&this.ctx.state==='running')void this.ctx.suspend().catch(()=>{});}
  resume(){if(this.ctx&&this.enabled&&this.ctx.state==='suspended'){void this.ctx.resume().then(()=>{this.nextAt=this.ctx!.currentTime+.08;this.tick();}).catch(()=>{});}}
  dispose(){if(this.timer)clearInterval(this.timer);this.timer=null;try{this.windLfo?.stop();this.ambientSource?.stop();}catch{/* already stopped */}this.windLfo=null;this.windDepth=null;this.ambientSource=null;this.ambience=null;this.ambientFilter=null;if(this.ctx)void this.ctx.close().catch(()=>{});this.ctx=null;}
}
