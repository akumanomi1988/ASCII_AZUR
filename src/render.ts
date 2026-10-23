import {hash,TILE,WORLD_H,WORLD_W,terrain,ZONES,type ZoneId} from './world.js';
import {SPECIES,type Creature} from './domain.js';
import type {CombatFxFrame} from './actors/combat-fx.js';
import {sampleBattleSignature,type BattleSignature} from './actors/battle-direction.js';
import {sampleCreaturePerformance,rigFor,type CreatureAction,type CreaturePerformance} from './actors/creature-performance.js';
import {SoftwareGlyphFrame} from './render/software-glyph.js';
import {VISUAL_ASSETS} from './render/semantic-assets.js';
import {biomePalette} from './render/biome-art.js';
import {sampleHeroPose} from './actors/hero-performance.js';
import {glyphVisible} from './render/legibility.js';
import {readGraphics,glyphCell,canvasGlyphCell,type GraphicsProfile} from './render/graphics-profile.js';
import type {RoamingEncounter} from './world/encounters.js';
export const W=960,H=540;
const GLYPHS=' .,:;irsXA253hMHGS#9B&@░▒▓█*+o%';
const VS=`#version 300 es
in vec2 a_pos;out vec2 v_uv;
void main(){v_uv=a_pos*.5+.5;gl_Position=vec4(a_pos,0.,1.);}`;
const FS=`#version 300 es
precision highp float;
uniform sampler2D u_scene;uniform sampler2D u_atlas;
uniform vec2 u_resolution;uniform vec2 u_cell;
uniform float u_time;uniform float u_quality;uniform float u_contrast;uniform float u_edges;uniform float u_brightness;uniform float u_pixelMode;
uniform vec4 u_crop;
in vec2 v_uv;out vec4 outColor;
vec3 at(vec2 p){
 vec2 uv=u_crop.xy+p*u_crop.zw;
 return texture(u_scene,vec2(clamp(uv.x,0.,1.),1.-clamp(uv.y,0.,1.))).rgb;
}
float glyphCoverage(vec2 pos,int index){
 // Sampling within a tile interior prevents bleed at adjacent atlas borders.
 vec2 xy=clamp(fract(pos/u_cell),vec2(.07),vec2(.93));
 vec2 uv=(vec2(float(index%8),float(index/8))+xy)/vec2(8.,4.);
 return texture(u_atlas,uv).a;
}
void main(){
 vec2 pos=vec2(gl_FragCoord.x,u_resolution.y-gl_FragCoord.y);
 vec2 cell=floor(pos/u_cell), center=(cell+.5)*u_cell/u_resolution;
 vec2 stepPx=max(u_cell/u_resolution,vec2(.001))*.45;
 vec3 raw=at(center), n=at(center+vec2(0.,-stepPx.y)), s=at(center+vec2(0.,stepPx.y));
 vec3 e=at(center+vec2(stepPx.x,0.)), w=at(center-vec2(stepPx.x,0.));
 vec3 smoothColor=(raw+n+s+e+w)*.2;
 float edge=(length(n-s)+length(e-w))*u_edges;
 float saturation=max(max(raw.r,raw.g),raw.b)-min(min(raw.r,raw.g),raw.b);
 float lum=clamp((dot(raw,vec3(.2126,.7152,.0722))-.5)*u_contrast+.5+u_brightness,0.,1.);
 float noise=fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453);
 if(u_pixelMode>.5){
   // Each pixel is *always* covered by its own RGB cell background.
   // Visible Unicode masks then supply independent foreground coloration.
   // Semantic structure comes from local boundaries/texture, not absolute surface brightness.
   // Flat stone and paths remain continuous RGB backgrounds instead of vertical glyph bands.
   float structure=clamp(length(raw-smoothColor)*1.8+edge*.30+max(0.,saturation-.22)*.10,0.,1.);
   int index=structure>.58?26:structure>.42?25:structure>.28?24:structure>.14?23:(structure>.08&&noise>.82?1:0);
   vec3 bg=clamp(mix(raw,smoothColor,.34)*(.67+u_brightness*.15),0.,1.);
   vec3 fg=clamp(raw*(1.3+(u_contrast-1.)*.16)+vec3(.09,.09,.085),0.,1.);
   // Saturated, interactive-looking colors retain legibility against dark stone.
   fg+=saturation*vec3(.07,.08,.09);
   float coverage=glyphCoverage(pos,index);
   outColor=vec4(mix(bg,clamp(fg,0.,1.),coverage),1.);
   return;
 }
 // Atmospheric mode: gentle punctuation on low-detail surfaces, strong glyphs at actual silhouettes.
 float detail=clamp(pow(lum*1.43,.79)+edge*.16+saturation*.13,0.,1.);
 int index=int(floor(clamp(detail*22.+(noise-.5)*.7,1.,22.)));
 if(edge>.43&&detail>.14)index=min(22,index+3);
 vec3 bg=vec3(.006,.011,.019)+raw*.20;
 vec3 fg=clamp(raw*(2.4+saturation*.35)+vec3(.12,.14,.14),0.,1.);
 fg=mix(fg,vec3(dot(fg,vec3(.299,.587,.114))),1.-u_quality);
 float ink=glyphCoverage(pos,index);
 float visibility=clamp(.14+lum*2.25+edge*.27,0.,1.);
 if(lum+edge*.3<.012)visibility=0.;
 outColor=vec4(mix(bg,fg,ink*visibility),1.);
}
`;
function shader(gl:WebGL2RenderingContext,type:number,src:string):WebGLShader {const s=gl.createShader(type);if(!s)throw Error('shader');gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Shader: '+gl.getShaderInfoLog(s));return s;}
function texture(gl:WebGL2RenderingContext):WebGLTexture {const t=gl.createTexture();if(!t)throw Error('texture');gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
export class AsciiRenderer {
  canvas:HTMLCanvasElement;readonly source:HTMLCanvasElement;readonly ctx:CanvasRenderingContext2D;
  private gl:WebGL2RenderingContext|null=null;private program:WebGLProgram|null=null;private tex:WebGLTexture|null=null;private atlas:WebGLTexture|null=null;private uniforms:Record<string,WebGLUniformLocation|null>={};
  renderMode:'ascii'|'glyph-pixel'='ascii';pixelDetail:'fine'|'balanced'|'chunky'='balanced';quality=1; density=.32;glyphScale=.8;contrast=1.18;edgeStrength=1.2;brightness=.02;performanceScale=1;private software:SoftwareGlyphFrame|null=null;private frame=0;private fpsStart=performance.now();fps=0;mode:'gpu'|'fallback'='fallback';
  constructor(canvas:HTMLCanvasElement){this.canvas=canvas;this.source=document.createElement('canvas');this.source.width=W;this.source.height=H;const ctx=this.source.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas2D no disponible');this.ctx=ctx;this.initGPU();}
  private initGPU(){const gl=this.canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});if(!gl){this.initFallback();return;}try{const p=gl.createProgram();if(!p)throw Error('program');gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,VS));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,FS));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('Link: '+gl.getProgramInfoLog(p));gl.useProgram(p);const arr=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,arr);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(p,'a_pos');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);this.tex=texture(gl);gl.activeTexture(gl.TEXTURE1);this.atlas=texture(gl);const atlas=document.createElement('canvas');atlas.width=8*32;atlas.height=4*36;const a=atlas.getContext('2d');if(!a)throw Error('glyph atlas');a.clearRect(0,0,atlas.width,atlas.height);a.fillStyle='#fff';a.font='bold 31px monospace';a.textAlign='center';a.textBaseline='middle';for(let i=0;i<GLYPHS.length;i++){a.fillText(GLYPHS[i]!,i%8*32+16,Math.floor(i/8)*36+19);}gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);for(const k of ['u_resolution','u_cell','u_time','u_quality','u_contrast','u_edges','u_brightness','u_pixelMode','u_crop'])this.uniforms[k]=gl.getUniformLocation(p,k);gl.uniform1i(gl.getUniformLocation(p,'u_scene'),0);gl.uniform1i(gl.getUniformLocation(p,'u_atlas'),1);this.gl=gl;this.program=p;this.mode='gpu';this.resize();}catch(e){console.error('WebGL ASCII falló:',e);this.initFallback();}}
  private initFallback(){this.gl=null;this.mode='fallback';// When WebGL2 is missing, keep the game playable with a CPU glyph compositor.
    let fallback=this.canvas.getContext('2d');if(!fallback){const replacement=document.createElement('canvas');replacement.id=this.canvas.id;replacement.className=this.canvas.className;replacement.setAttribute('aria-label',this.canvas.getAttribute('aria-label')||'Juego ASCII');this.canvas.replaceWith(replacement);this.canvas=replacement;fallback=this.canvas.getContext('2d');}if(!fallback)throw Error('Sin motor gráfico soportado');this.resize();}
  getGraphics():GraphicsProfile{return readGraphics({renderMode:this.renderMode,pixelDetail:this.pixelDetail,quality:this.quality,density:this.density,glyphScale:this.glyphScale,contrast:this.contrast,edgeStrength:this.edgeStrength,brightness:this.brightness});}
  setGraphics(input:unknown){const x=readGraphics(input);this.renderMode=x.renderMode;this.pixelDetail=x.pixelDetail;this.density=x.density;this.glyphScale=x.glyphScale;this.contrast=x.contrast;this.edgeStrength=x.edgeStrength;this.brightness=x.brightness;this.quality=x.quality;}
  /** Runtime-only cell scale; never included in graphics preferences or save games. */
  setPerformanceScale(scale:number){this.performanceScale=Number.isFinite(scale)?Math.max(1,Math.min(2.4,scale)):1;}
  resize(){const rect=this.canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.min(1920,Math.max(320,Math.round((rect.width||W)*dpr)));this.canvas.height=Math.min(1080,Math.max(180,Math.round((rect.height||H)*dpr)));if(this.gl)this.gl.viewport(0,0,this.canvas.width,this.canvas.height);}
  private crop(){const aspect=this.canvas.width/this.canvas.height,sourceAspect=W/H;
    if(aspect<sourceAspect){const frac=aspect/sourceAspect;return{x:(1-frac)/2,y:0,w:frac,h:1};}
    const frac=sourceAspect/aspect;return{x:0,y:(1-frac)/2,w:1,h:frac};
  }
  present(t:number){this.frame++;if(t-this.fpsStart>800){this.fps=Math.round(this.frame*1000/(t-this.fpsStart));this.frame=0;this.fpsStart=t;}const gl=this.gl;if(gl&&this.program&&this.tex){gl.useProgram(this.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.source);gl.uniform2f(this.uniforms.u_resolution!,this.canvas.width,this.canvas.height);const rect=this.canvas.getBoundingClientRect();const dpr=this.canvas.width/(rect.width||W);
      const base=Math.max(5.0,Math.min(10.0,(rect.width||W)/130))*dpr;
      const cell=glyphCell(base,this.getGraphics());gl.uniform2f(this.uniforms.u_cell!,cell.width*this.performanceScale,cell.height*this.performanceScale);
      const crop=this.crop();gl.uniform4f(this.uniforms.u_crop!,crop.x,crop.y,crop.w,crop.h);gl.uniform1f(this.uniforms.u_time!,t*.001);gl.uniform1f(this.uniforms.u_quality!,this.quality);gl.uniform1f(this.uniforms.u_contrast!,this.contrast);gl.uniform1f(this.uniforms.u_edges!,this.edgeStrength);gl.uniform1f(this.uniforms.u_brightness!,this.brightness);gl.uniform1f(this.uniforms.u_pixelMode!,this.renderMode==='glyph-pixel'?1:0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return;}
    const c=this.canvas.getContext('2d');if(!c)return;
    const rect=this.canvas.getBoundingClientRect(), dpr=this.canvas.width/(rect.width||W);
    const cell=canvasGlyphCell(Math.max(5,Math.min(10,(rect.width||W)/130))*dpr,this.getGraphics(),this.canvas.width,this.canvas.height);
    const cw=Math.ceil(cell.width*this.performanceScale),ch=Math.ceil(cell.height*this.performanceScale);const crop=this.crop(),data=this.ctx.getImageData(0,0,W,H).data;
    if(!this.software||this.software.width!==this.canvas.width||this.software.height!==this.canvas.height)this.software=new SoftwareGlyphFrame(this.canvas.width,this.canvas.height,GLYPHS);
    this.software.clear();
    for(let y=0;y<this.canvas.height;y+=ch){
      const srcY=Math.min(H-1,Math.floor((crop.y+(y+ch*.5)/this.canvas.height*crop.h)*H));
      for(let x=0;x<this.canvas.width;x+=cw){
        const srcX=Math.min(W-1,Math.floor((crop.x+(x+cw*.5)/this.canvas.width*crop.w)*W));
        const i=(srcY*W+srcX)*4,r=data[i]!,g=data[i+1]!,b=data[i+2]!;
        const rawLevel=(r*.2126+g*.7152+b*.0722)/255;
        const level=Math.max(0,Math.min(1,(rawLevel-.5)*this.contrast+.5+this.brightness));
        // Brightness palette is 0..22; 23..26 are reserved for directional strokes.
        const sample=(px:number,py:number)=>{const j=(Math.max(0,Math.min(H-1,py))*W+Math.max(0,Math.min(W-1,px)))*4;return (data[j]!*.2126+data[j+1]!*.7152+data[j+2]!*.0722)/255;};
        const ox=Math.max(1,Math.floor(cw*crop.w*W/this.canvas.width*.48));
        const oy=Math.max(1,Math.floor(ch*crop.h*H/this.canvas.height*.48));
        const gx=sample(srcX+ox,srcY)-sample(srcX-ox,srcY);
        const gy=sample(srcX,srcY+oy)-sample(srcX,srcY-oy);
        const edge=(Math.abs(gx)+Math.abs(gy))*this.edgeStrength;
        const cellX=Math.floor(x/cw),cellY=Math.floor(y/ch);
        const noise=Math.abs(Math.sin(cellX*12.9898+cellY*78.233)*43758.5453)%1;
        if(this.renderMode==='glyph-pixel'){
          const neighborLevel=(sample(srcX+ox,srcY)+sample(srcX-ox,srcY)+sample(srcX,srcY+oy)+sample(srcX,srcY-oy))*.25;
          const structure=Math.max(0,Math.min(1,edge*.30+Math.abs(level-neighborLevel)*1.8));
          // Flat materials use contiguous background pixels; glyphs mark actual detail.
          const index=structure>.58?26:structure>.42?25:structure>.28?24:structure>.14?23:structure>.08&&noise>.82?1:0;
          const background:[number,number,number]=[r*.67,g*.67,b*.67];
          const foreground:[number,number,number]=[Math.min(255,r*1.3+23),Math.min(255,g*1.3+23),Math.min(255,b*1.3+22)];
          this.software.putCell(index,x,y,Math.min(cw,this.canvas.width-x),Math.min(ch,this.canvas.height-y),foreground,background);
          continue;
        }
        if(!glyphVisible(level,edge,noise))continue;
        const v=Math.max(0,Math.min(1,Math.pow(level*1.55,.68)+edge*.30));
        let index=Math.max(1,Math.min(22,Math.floor(v*22+(noise-.5)*1.25)));
        if(edge>.43&&v>.14)index=Math.min(22,index+3);
        const alpha=Math.min(1,Math.max(.22,(level+edge*.28+.09)*3.15));
        this.software.put(index,x,y,cw,ch,r,g,b,alpha);
      }
    }
    c.putImageData(this.software.data,0,0);
  }
}
export interface DrawPlayer {x:number;y:number;facing:number;walking:boolean;}
export interface Camera {x:number;y:number;}
function light(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,strength=.5){const g=ctx.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=strength;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}
function poly(ctx:CanvasRenderingContext2D,points:number[][],fill:string){ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(points[0]![0]!,points[0]![1]!);for(const p of points.slice(1))ctx.lineTo(p[0]!,p[1]!);ctx.closePath();ctx.fill();}
/** Deliberately authored micro-detail layered over recognizable species silhouettes.
 * Geometry remains a prepass; all visible marks undergo ASCII conversion. */
function creatureDetails(ctx:CanvasRenderingContext2D,id:string,perf:CreaturePerformance,t:number,reduced:boolean){
 const rig=rigFor(id), col=rig.accent;
 ctx.save();
 // A few high-contrast identifiers survive character density reduction.
 ctx.strokeStyle=col;ctx.lineWidth=1.4;ctx.globalAlpha=.82;
 const eye=(x:number,y:number,r=3)=>{ctx.fillStyle='#101820';ctx.fillRect(x-r,y-r,r*2,r*2);if(perf.blink>.7){ctx.fillStyle=col;ctx.fillRect(x-r,y,r*2,1);}else{ctx.fillStyle=rig.detail;ctx.fillRect(x-1,y-1,Math.max(2,r-1),Math.max(2,r-1));}};
 if(perf.family==='canid'){
   // Forehead blaze, shoulder fur, ear highlights and characteristic ash-marks.
   eye(22,-9);ctx.beginPath();ctx.moveTo(5,-11);ctx.lineTo(-3,-1);ctx.lineTo(4,2);ctx.moveTo(-8,-10);ctx.lineTo(-19,-14);ctx.moveTo(-8,-4);ctx.lineTo(-22,-6);ctx.stroke();
   ctx.fillStyle=col;ctx.fillRect(15,-25,2,5);ctx.fillRect(23,-26,2,4);
   if(id==='cinderwulf'){ctx.strokeStyle='#fff0d4';ctx.beginPath();ctx.moveTo(-10,-13);ctx.lineTo(-3,-20);ctx.lineTo(8,-19);ctx.stroke();}
 } else if(perf.family==='spirit'){
   const yy=-14;eye(-7,yy,4);eye(6,yy,4);
   ctx.globalAlpha=.7;ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(-4,-5);ctx.quadraticCurveTo(0,-1,5,-5);ctx.stroke();
   for(let i=0;i<6;i++){const ang=i*2.399+t*.34,r=21+i%3*7;ctx.fillStyle=col;ctx.fillRect(Math.cos(ang)*r, -14+Math.sin(ang)*r,2,3);}
 } else if(perf.family==='moth'){
   const f=reduced?0:perf.wing*2;
   ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(-18,-26+f);ctx.lineTo(-11,-9);ctx.lineTo(-23,-3);ctx.moveTo(18,-26-f);ctx.lineTo(11,-9);ctx.lineTo(23,-3);ctx.stroke();
   ctx.fillStyle='#ece2ff';for(const dir of [-1,1]){ctx.beginPath();ctx.ellipse(dir*17,-14,4,6,.4*dir,0,7);ctx.fill();ctx.fillStyle='#494164';ctx.fillRect(dir*17-1,-15,2,3);ctx.fillStyle='#ece2ff';}
   eye(-3,-18,2);eye(3,-18,2);
 } else if(perf.family==='owl'){
   eye(-9,-20,6);eye(8,-20,6);
   ctx.strokeStyle='#ece0ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-8,-20,8,0,Math.PI*2);ctx.arc(8,-20,8,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle=col;for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(-18+j*7,-4);ctx.lineTo(-17+j*7,2);ctx.stroke();}
 } else if(perf.family==='boar'){
   eye(23,-13,4);ctx.strokeStyle='#d2a18a';ctx.beginPath();ctx.moveTo(-16,-5);ctx.lineTo(9,-4);ctx.moveTo(-11,2);ctx.lineTo(5,4);ctx.stroke();
   ctx.fillStyle='#f3e2b8';ctx.fillRect(30,-3,3,2);
 } else if(perf.family==='fish'){
   eye(14,-11,4);ctx.strokeStyle='#b3e8e9';ctx.beginPath();for(let i=0;i<4;i++){ctx.moveTo(-10+i*6,-13+i%2*2);ctx.lineTo(-3+i*6,-9+i%2*2);}ctx.stroke();
   for(let i=0;i<3;i++){ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(-10+i*10,3,2+i%2,0,7);ctx.stroke();}ctx.globalAlpha=1;
 } else if(perf.family==='sprout'){
   eye(-8,-7,4);eye(5,-7,4);ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-15,-7);ctx.lineTo(-22,-3);ctx.moveTo(13,-7);ctx.lineTo(22,-4);ctx.stroke();
 } else if(perf.family==='stag'){
   eye(18,-30,4);ctx.strokeStyle='#e6d1b7';ctx.lineWidth=2;
   // Carved antler sockets and branching runes identify the boss at a glance.
   ctx.beginPath();ctx.moveTo(9,-42);ctx.lineTo(0,-54);ctx.moveTo(18,-42);ctx.lineTo(25,-55);ctx.stroke();
   ctx.strokeStyle='#c7afd5';ctx.beginPath();ctx.moveTo(-9,-16);ctx.lineTo(0,-22);ctx.lineTo(10,-14);ctx.lineTo(0,-6);ctx.closePath();ctx.stroke();
 } else {
   eye(-10,-13,4);eye(8,-13,4);
   ctx.strokeStyle='#c2cfa4';ctx.beginPath();ctx.moveTo(-16,-17);ctx.lineTo(-7,-26);ctx.lineTo(2,-17);ctx.lineTo(12,-23);ctx.stroke();
   for(let i=0;i<4;i++){ctx.fillStyle=col;ctx.fillRect(-15+i*9,-29+(i%2)*4,3,3);}
 }
 // Authored signature motifs: these survive both dense and coarse glyph sampling.
 if(id==='cindrel'||id==='cinderwulf'){
   // Flame-spine chain across the canid's back; Cinderwulf gets a longer crown.
   const crest=id==='cinderwulf'?5:3;
   ctx.fillStyle=id==='cinderwulf'?'#ffe6ae':'#ffc878';
   for(let j=0;j<crest;j++){
     const xx=-17+j*7,yy=-17-(j%2)*4;
     poly(ctx,[[xx-3,yy+7],[xx,yy-8-(id==='cinderwulf'?4:0)],[xx+4,yy+6]],ctx.fillStyle as string);
   }
   // Tail splits into two individually readable tongues of fire.
   ctx.strokeStyle='#ffbe68';ctx.lineWidth=3.3;ctx.beginPath();
   ctx.moveTo(-28,-12);ctx.quadraticCurveTo(-35,-22+perf.tail*3,-42,-29+perf.tail*6);
   ctx.moveTo(-31,-10);ctx.quadraticCurveTo(-35,-10+perf.tail*2,-41,-17+perf.tail*6);ctx.stroke();
   ctx.fillStyle='#ffe2aa';ctx.fillRect(21,-10,3,2);
 } else if(id==='velaria'){
   // The mourner's veil and hanging lunar crown distinguish her from Wispawn.
   ctx.strokeStyle='#cafff1';ctx.lineWidth=2.8;ctx.beginPath();
   ctx.moveTo(-12,-29);ctx.quadraticCurveTo(0,-42,12,-29);ctx.stroke();
   poly(ctx,[[-14,-25],[-24,-7],[-21+perf.tail*2,13],[-13,8],[-9,-5]],'#75c6b9');
   poly(ctx,[[14,-25],[24,-7],[20-perf.tail*2,12],[13,8],[9,-5]],'#75c6b9');
   ctx.fillStyle='#e2fff5';ctx.fillRect(-2,-38,4,11);
   ctx.fillStyle='#85ead4';ctx.fillRect(-5,-30,10,3);
   ctx.strokeStyle='#e3fff2';ctx.lineWidth=2.1;ctx.beginPath();
   ctx.moveTo(-12,-4);ctx.quadraticCurveTo(0,5,12,-4);ctx.stroke();
 } else if(id==='mourveil'){
   ctx.strokeStyle='#e7fffa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-35,18,3.25,6.18);ctx.stroke();
   ctx.fillStyle='#c1f5ed';for(let i=0;i<5;i++)ctx.fillRect(-22+i*11,9+(i%2)*5,2,8);
 } else if(id==='mnemoshade'){
   ctx.strokeStyle='#f0d9ff';ctx.lineWidth=2;for(let i=0;i<4;i++){const xx=-27+i*18;ctx.strokeRect(xx,-45+(i%2)*8,8,11);}
 } else if(id==='bellroot'){
   ctx.strokeStyle='#e8dda5';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-19,11,0,Math.PI);ctx.stroke();
 } else if(id==='ashglass'){
   ctx.strokeStyle='#fff4d1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-21,-25);ctx.lineTo(-31,-40+perf.wing*3);ctx.moveTo(21,-25);ctx.lineTo(31,-40-perf.wing*3);ctx.stroke();
 }
 if(perf.expression==='feral'||perf.expression==='transcendent'){
   ctx.globalAlpha=.7;ctx.strokeStyle=col;ctx.lineWidth=1.4;
   for(let i=0;i<7;i++){const a=i*2.399+t*.6,r=23+i%3*8;ctx.beginPath();ctx.moveTo(Math.cos(a)*r, -15+Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+5),-15+Math.sin(a)*(r+5));ctx.stroke();}
 }
 ctx.restore();
}
export function drawCreature(ctx:CanvasRenderingContext2D,speciesId:string,x:number,y:number,scale=1,t=0,action:CreatureAction='idle',reducedMotion=false){const sp=SPECIES[speciesId];if(!sp)return;
 const perf=sampleCreaturePerformance(speciesId,t,action,reducedMotion);
 ctx.save();ctx.translate(x,y-perf.bob*scale);ctx.rotate(perf.roll);ctx.scale(scale*perf.breath,scale/perf.breath);ctx.globalAlpha=.22;ctx.fillStyle='#071018';ctx.beginPath();ctx.ellipse(0,7,17,5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;const col=sp.color,shadow='#172534';ctx.fillStyle=col;
  if([0,5].includes(sp.shape)){ // wolf, tail, four legs and ears
    poly(ctx,[[-13,-2],[-33,-22+perf.tail*5],[-28,1+perf.tail*3],[-15,7]],col);
    ctx.fillRect(-10,1+perf.gait*1.9,5,13);ctx.fillRect(10,0-perf.gait*1.9,5,14);ctx.beginPath();ctx.ellipse(0,-5,20,13,0,0,7);ctx.fill();poly(ctx,[[6,-12],[15,-30],[19,-14],[27,-9],[28,0],[10,-1]],col);poly(ctx,[[10,-20],[11,-36],[20,-24]],col);poly(ctx,[[19,-19],[26,-32],[27,-15]],col);ctx.fillStyle='#f7e2b8';ctx.fillRect(23,-6,3,3);
  }else if(sp.shape===1||sp.shape===3){ // ghost
    ctx.beginPath();ctx.moveTo(-16,8);ctx.quadraticCurveTo(-24,-16,-12,-25);ctx.quadraticCurveTo(0,-41,12,-25);ctx.quadraticCurveTo(26,-9,15,8);ctx.lineTo(8,1+perf.tail*2);ctx.lineTo(0,14+perf.tail*3);ctx.lineTo(-9,3-perf.tail*2);ctx.closePath();ctx.fill();ctx.fillStyle='#182335';ctx.fillRect(-8,-15,4,6);ctx.fillRect(5,-15,4,6);light(ctx,0,-12,32,col,.25);
  }else if(sp.shape===4){ // moth wings
    ctx.beginPath();ctx.ellipse(-15,-10,13+perf.wing*2,19,-.5+perf.wing*.12,0,7);ctx.ellipse(15,-10,13-perf.wing*2,19,.5-perf.wing*.12,0,7);ctx.fill();ctx.fillStyle=shadow;ctx.beginPath();ctx.ellipse(0,-8,7,17,0,0,7);ctx.fill();ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(-3,-19);ctx.lineTo(-9,-34);ctx.moveTo(3,-19);ctx.lineTo(9,-34);ctx.stroke();
  }else if(sp.shape===7){ // Owl: huge eyes, angular feather mantle and animated wings
    const wing=perf.wing*7;poly(ctx,[[-5,-8],[-31,-28+wing],[-29,5],[-5,5]],col);poly(ctx,[[5,-8],[31,-28-wing],[29,5],[5,5]],col);
    ctx.beginPath();ctx.ellipse(0,-12,15,19,0,0,7);ctx.fill();poly(ctx,[[-15,-25],[-15,-42],[-6,-29],[6,-29],[15,-42],[15,-25]],col);
    ctx.fillStyle='#19243d';ctx.fillRect(-12,-23,10,9);ctx.fillRect(3,-23,10,9);ctx.fillStyle='#f6e7b2';ctx.fillRect(-8,-21,4,4);ctx.fillRect(6,-21,4,4);poly(ctx,[[-3,-13],[3,-13],[0,-6]],'#ecac82');
  }else if(sp.shape===8){ // Boar: tusks, stout profile, triangular ears
    ctx.beginPath();ctx.ellipse(0,-6,24,15,0,0,7);ctx.fill();ctx.fillRect(-18,1,8,13);ctx.fillRect(10,1,8,13);
    poly(ctx,[[10,-18],[17,-32],[26,-16]],col);ctx.beginPath();ctx.ellipse(20,-8,14,12,0,0,7);ctx.fill();
    ctx.fillStyle='#634b4c';ctx.fillRect(29,-5,7,6);ctx.fillStyle='#fff0ce';poly(ctx,[[10,-2],[9,10],[19,2]],'#f4dfb9');
    ctx.fillRect(23,-15,4,4);
  }else if(sp.shape===9){ // River fish: unmistakable tail + dorsal fin
    poly(ctx,[[-18,-9],[-38,-27+perf.tail*5],[-34,0],[-38,16-perf.tail*5],[-16,4]],col);
    ctx.beginPath();ctx.ellipse(1,-5,23,13,0,0,7);ctx.fill();poly(ctx,[[-11,-16],[1,-31],[11,-15]],'#5bb2c1');
    ctx.fillStyle='#e6ffda';ctx.fillRect(14,-10,4,4);ctx.strokeStyle='#4d8497';ctx.beginPath();ctx.moveTo(-10,-2);ctx.lineTo(9,5);ctx.stroke();
  }else if(sp.shape===10){ // Seed creature: big sprout, roots and bark eyes
    ctx.beginPath();ctx.ellipse(0,-2,15,15,0,0,7);ctx.fill();
    ctx.strokeStyle='#93af7c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(0,-35);ctx.stroke();
    poly(ctx,[[0,-31],[-20+perf.tail*3,-37],[-14,-22],[0,-22]],'#79b389');poly(ctx,[[0,-30],[19,-44],[16,-24],[1,-20]],'#b7df83');
    ctx.fillStyle='#263e37';ctx.fillRect(-8,-6,5,4);ctx.fillRect(5,-6,5,4);
  }else if(sp.shape===11){ // the original Nullscribe: empty scroll beneath a shattered halo
    const flutter=perf.wing*3;poly(ctx,[[-20,-31],[-34,4],[-8,14],[12,14],[34,4],[20,-31]],'#342843');
    ctx.fillStyle=col;ctx.fillRect(-15,-43,30,43);ctx.fillStyle='#19172c';ctx.fillRect(-10,-37,20,30);
    ctx.strokeStyle='#e9c8fc';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-27,-50-flutter);ctx.lineTo(0,-65);ctx.lineTo(27,-50+flutter);ctx.moveTo(-23,-62);ctx.lineTo(0,-72);ctx.lineTo(23,-62);ctx.stroke();
    ctx.fillStyle='#fff2dc';ctx.fillRect(-8,-27,5,4);ctx.fillRect(4,-27,5,4);ctx.fillStyle='#d3a6f2';ctx.fillRect(-2,-16,4,10);
  }else if(sp.shape===12){ // Mourveil: rain-veil and lunar ribbons
    ctx.beginPath();ctx.moveTo(-15,9);ctx.quadraticCurveTo(-23,-10,-12,-30);ctx.quadraticCurveTo(0,-45,12,-30);ctx.quadraticCurveTo(23,-10,15,9);ctx.lineTo(8,3+perf.tail*2);ctx.lineTo(0,15);ctx.lineTo(-8,4-perf.tail*2);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#e6fff8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-29,15,Math.PI,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#2c5362';ctx.fillRect(-10,-20,6,5);ctx.fillRect(4,-20,6,5);
    poly(ctx,[[-15,-15],[-31,10],[-22,22],[-9,4]],'#6cbbc7');poly(ctx,[[15,-15],[31,10],[22,22],[9,4]],'#6cbbc7');
  }else if(sp.shape===13){ // Mnemoshade: broken name shards
    poly(ctx,[[-15,-25],[0,-38],[16,-25],[21,-5],[0,11],[-21,-5]],col);
    ctx.fillStyle='#241d42';poly(ctx,[[-8,-21],[0,-29],[8,-21],[10,-7],[0,1],[-10,-7]],'#241d42');
    ctx.fillStyle='#f5e2ff';ctx.fillRect(-9,-18,5,4);ctx.fillRect(5,-18,5,4);
    for(const dir of [-1,1]){ctx.strokeStyle='#d6b5ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(dir*17,-26);ctx.lineTo(dir*(29+perf.tail*2),-39);ctx.lineTo(dir*35,-23);ctx.stroke();}
    ctx.fillStyle='#e3c5ff';ctx.fillRect(-2,-9,4,12);
  }else if(sp.shape===14){ // Bellroot: rooted bronze bell
    ctx.beginPath();ctx.moveTo(-16,-31);ctx.lineTo(16,-31);ctx.lineTo(23,4);ctx.lineTo(-23,4);ctx.closePath();ctx.fill();
    ctx.fillStyle='#667f64';ctx.fillRect(-25,3,50,6);ctx.fillStyle='#d7eab7';ctx.fillRect(-5,8,10,7);
    ctx.strokeStyle='#5d9a6a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10,9);ctx.lineTo(-21,23);ctx.moveTo(10,9);ctx.lineTo(21,23);ctx.moveTo(0,-30);ctx.lineTo(0,-48);ctx.stroke();
    poly(ctx,[[0,-47],[-16,-55],[-10,-37]],'#8fd1a0');poly(ctx,[[0,-46],[15,-57],[11,-36]],'#b6d88d');
    ctx.fillStyle='#22362f';ctx.fillRect(-10,-16,5,4);ctx.fillRect(6,-16,5,4);
  }else if(sp.shape===15){ // Ashglass: razor-winged glass bird
    const sweep=perf.wing*5;
    poly(ctx,[[-8,-14],[-37,-42+sweep],[-29,-4],[-8,3]],'#e78d68');
    poly(ctx,[[8,-14],[37,-42-sweep],[29,-4],[8,3]],'#f9c686');
    poly(ctx,[[-11,-23],[0,-36],[12,-23],[10,4],[0,12],[-10,4]],col);
    poly(ctx,[[-2,-18],[17,-15],[1,-8]],'#fff0bd');
    ctx.fillStyle='#51393b';ctx.fillRect(-5,-23,4,4);
    ctx.strokeStyle='#ffe1ae';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-22,-18);ctx.lineTo(-32,-29+sweep);ctx.moveTo(22,-18);ctx.lineTo(32,-29-sweep);ctx.stroke();
  }else if(sp.shape===6){ // deer
    ctx.beginPath();ctx.ellipse(0,-9,21,16,0,0,7);ctx.fill();ctx.fillRect(-15,-1,6,18);ctx.fillRect(10,-1,6,18);ctx.beginPath();ctx.ellipse(13,-28,11,13,0,0,7);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(10,-37);ctx.lineTo(-2,-56);ctx.lineTo(-18,-60);ctx.moveTo(-2,-56);ctx.lineTo(-5,-70);ctx.moveTo(15,-37);ctx.lineTo(24,-59);ctx.lineTo(37,-61);ctx.moveTo(24,-59);ctx.lineTo(23,-70);ctx.stroke();ctx.fillStyle='#fbe8c7';ctx.fillRect(17,-30,3,3);
  }else{ // moss beast
    ctx.beginPath();ctx.ellipse(0,-8,22,18,0,0,7);ctx.fill();ctx.fillRect(-14,0,9,15);ctx.fillRect(8,0,9,15);poly(ctx,[[-16,-23],[-23,-44],[-9,-29],[9,-29],[22,-44],[17,-23]],col);ctx.fillStyle='#172534';ctx.fillRect(-9,-11,5,4);ctx.fillRect(8,-11,5,4);
  }creatureDetails(ctx,speciesId,perf,t,reducedMotion);ctx.restore();}
/** Four-authored-view traveller. The south, north, and lateral shapes remain legible at low glyph density. */
export function drawHero(ctx:CanvasRenderingContext2D,x:number,y:number,t:number,moving:boolean,facing=2,npc=false,reducedMotion=false){
  const pose=sampleHeroPose(t,moving,facing,reducedMotion),side=pose.view==='right'?1:-1;
  const cape=npc?'#416361':'#35677b',capeEdge=npc?'#799387':'#8ed0dc';
  const cloth=npc?'#7b7966':'#485671',hood=npc?'#596b60':'#26394e';
  const gold=npc?'#c8ad81':'#e5bf7c';
  ctx.save();ctx.translate(x,y+pose.bob);ctx.scale(.9,.9);
  ctx.fillStyle='#061016';ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(0,5,19,5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  if(pose.view==='left'||pose.view==='right'){
    // A wholly different profile: narrow hood, forward face, trailing cloak and diagonal gait.
    ctx.save();ctx.scale(side,1);
    ctx.fillStyle='#263442';ctx.fillRect(-9,-11+pose.step,7,15);ctx.fillRect(3,-10-pose.step,7,15);
    ctx.fillStyle='#ae9f83';ctx.fillRect(-11,1+pose.step,10,3);ctx.fillRect(2,1-pose.step,10,3);
    poly(ctx,[[-8,-41],[-18,-34],[-26+pose.cape*.8,-8],[-23+pose.cape,2],[-7,-9],[9,-20],[7,-42]],cape);
    poly(ctx,[[-8,-39],[-11,-24],[-4,-13],[9,-13],[13,-26],[7,-40]],cloth);
    ctx.fillStyle='#b7bbac';ctx.fillRect(5,-34,7,6);ctx.fillStyle=gold;ctx.fillRect(3,-22,6,3);
    // Arm is in front of the cloak and carries a distinctive weapon silhouette.
    ctx.fillStyle='#374b5d';ctx.fillRect(4,-27+pose.arm,7,18);ctx.fillStyle='#c0a78e';ctx.fillRect(4,-13+pose.arm,7,5);
    ctx.strokeStyle=gold;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(12,-12+pose.arm);ctx.lineTo(17,-39+pose.arm);ctx.stroke();
    poly(ctx,[[15,-41+pose.arm],[19,-53+pose.arm],[22,-39+pose.arm]],'#e4f7ef');
    // Profile hood has a pronounced nose and one high-contrast eye.
    poly(ctx,[[-12,-46],[-10,-57],[-2,-66],[8,-62],[15,-47],[9,-40],[-8,-40]],hood);
    poly(ctx,[[0,-55],[12,-52],[15,-46],[10,-40],[1,-42]],'#c6b4a0');
    ctx.fillStyle='#142432';ctx.fillRect(7,-50,7,5);
    if(!pose.blink){ctx.fillStyle='#f9e3b9';ctx.fillRect(11,-49,3,2);}
    ctx.strokeStyle=capeEdge;ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-16,-30);ctx.lineTo(-21+pose.cape*.6,-5);ctx.stroke();
    ctx.restore();
  }else{
    const back=pose.view==='back';
    // Feet establish the direction of travel and are not obscured by the cape.
    ctx.fillStyle='#29323c';ctx.fillRect(-10,-11+pose.step,7,15);ctx.fillRect(4,-11-pose.step,7,15);
    ctx.fillStyle='#a7a18b';ctx.fillRect(-11,0+pose.step,10,4);ctx.fillRect(3,0-pose.step,10,4);
    poly(ctx,[[-14,-38],[-22,-30],[-23-pose.cape*.4,-7],[-16+pose.cape*.15,1],[-8,-9],[6,-10],[18-pose.cape*.3,2],[22,-29],[11,-40]],cape);
    ctx.strokeStyle=capeEdge;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-19,-30);ctx.lineTo(-17-pose.cape*.3,-11);ctx.moveTo(17,-28);ctx.lineTo(15-pose.cape*.25,-8);ctx.stroke();
    // The rear view is dominated by a long cloak and an unbroken hood; no phantom face/eyes.
    if(back){
      poly(ctx,[[-13,-38],[-15,-16],[-8,-5],[7,-5],[16,-17],[13,-39]],'#2a5667');
      poly(ctx,[[-11,-35],[-5,-21],[0,-13],[6,-23],[11,-35]],'#3c7890');
      ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-1,-27);ctx.lineTo(0,-13);ctx.stroke();
      ctx.fillStyle='#6a8290';ctx.fillRect(-18,-37,8,9);ctx.fillRect(10,-37,8,9);
      ctx.strokeStyle=gold;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(17,-9);ctx.lineTo(22,-41);ctx.stroke();
      ctx.fillStyle='#e0e8dc';ctx.fillRect(20,-51,4,15);
      poly(ctx,[[-15,-44],[-13,-57],[-3,-66],[8,-59],[15,-45],[10,-37],[-12,-37]],hood);
      poly(ctx,[[-12,-49],[-5,-59],[6,-57],[12,-47],[8,-42],[-9,-42]],'#3e6371');
      ctx.strokeStyle='#85b4b5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,-54);ctx.lineTo(5,-54);ctx.stroke();
    }else{
      poly(ctx,[[-12,-38],[-16,-19],[-9,-11],[9,-11],[16,-19],[12,-38]],cloth);
      poly(ctx,[[-15,-38],[-22,-34],[-18,-26],[-10,-28]],'#8caaa9');
      poly(ctx,[[15,-38],[22,-34],[18,-26],[10,-28]],'#768e9d');
      ctx.fillStyle='#253746';ctx.fillRect(-6,-34,12,16);
      ctx.fillStyle=gold;ctx.fillRect(-2,-31,4,10);ctx.fillRect(-6,-27,12,3);
      ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-11,-13);ctx.lineTo(12,-13);ctx.stroke();
      ctx.fillStyle=cloth;ctx.fillRect(-19,-29+pose.arm,7,17);ctx.fillRect(12,-29-pose.arm,7,17);
      ctx.fillStyle='#baa688';ctx.fillRect(-19,-14,8,6);ctx.fillRect(12,-14,8,6);
      ctx.strokeStyle=gold;ctx.lineWidth=2.8;ctx.beginPath();ctx.moveTo(18,-12);ctx.lineTo(22,-39);ctx.stroke();
      ctx.fillStyle='#dfe6d7';ctx.fillRect(20,-51,4,16);ctx.fillStyle='#c99e65';ctx.fillRect(17,-38,10,3);
      poly(ctx,[[-15,-43],[-12,-56],[-2,-66],[9,-60],[15,-45],[10,-37],[-11,-37]],hood);
      poly(ctx,[[-11,-49],[-3,-61],[9,-56],[11,-45]],npc?'#819487':'#618a94');
      poly(ctx,[[-10,-49],[-6,-42],[8,-42],[10,-50],[2,-54]],'#c5b49b');
      ctx.fillStyle='#152634';ctx.fillRect(-7,-47,15,6);
      if(!pose.blink){ctx.fillStyle='#f6eac8';ctx.fillRect(-5,-47,3,2);ctx.fillRect(5,-47,3,2);}
      ctx.strokeStyle=gold;ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-2,-62);ctx.lineTo(2,-62);ctx.stroke();
    }
  }
  ctx.restore();
}
function drawArchivist(ctx:CanvasRenderingContext2D,x:number,y:number,t:number){
 ctx.save();ctx.translate(x,y+Math.sin(t*1.2)*.9);ctx.scale(1.26,1.26);
 // A tall archivist with an unmistakable wide hat, parchment scroll and bent staff.
 ctx.fillStyle='#081319';ctx.beginPath();ctx.ellipse(0,5,23,6,0,0,Math.PI*2);ctx.fill();
 poly(ctx,[[-11,-33],[-22,-18],[-25,4],[25,4],[21,-18],[11,-33]],'#526b66');
 poly(ctx,[[-11,-32],[-8,-18],[-17,3],[18,3],[8,-18],[11,-32]],'#71877a');
 ctx.fillStyle='#283c41';ctx.fillRect(-8,-22,16,20);
 ctx.fillStyle='#c9b283';ctx.fillRect(-3,-23,6,22);
 // Broad angular brim distinguishes this NPC from the protagonist.
 poly(ctx,[[-24,-52],[-8,-56],[8,-56],[24,-52],[19,-45],[-19,-45]],'#a49b79');
 poly(ctx,[[-12,-53],[-13,-67],[-3,-83],[10,-67],[12,-53]],'#415960');
 ctx.fillStyle='#b7a781';ctx.fillRect(-12,-56,24,4);
 poly(ctx,[[-9,-50],[-9,-39],[-5,-35],[7,-35],[10,-50]],'#c7b39d');
 ctx.fillStyle='#1b2d34';ctx.fillRect(-8,-48,6,4);ctx.fillRect(3,-48,6,4);
 ctx.fillStyle='#edf1d2';ctx.fillRect(-5,-47,2,2);ctx.fillRect(6,-47,2,2);
 poly(ctx,[[-5,-41],[0,-30],[6,-41],[3,-32],[-2,-31]],'#d8dfd0');
 ctx.strokeStyle='#b3a07d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(19,-19);ctx.lineTo(29,-69);ctx.stroke();
 ctx.fillStyle='#d2b987';ctx.fillRect(25,-70,9,4);
 ctx.fillStyle='#d9c49d';ctx.fillRect(-25,-28,15,18);ctx.fillStyle='#8e6b55';ctx.fillRect(-22,-25,10,2);ctx.fillRect(-22,-20,10,2);
 ctx.restore();
}
function drawNPC(ctx:CanvasRenderingContext2D,x:number,y:number,t:number,id:string){
 if(id==='archivist'){drawArchivist(ctx,x,y,t);return;}
 ctx.save();ctx.translate(x,y+Math.sin(t*1.5+x*.01)*1.3);ctx.scale(.87,.87);
 const palette:Record<string,[string,string,string]>={
  merchant:['#a9815b','#d6a572','#f5d9aa'],scout:['#537d91','#8da7b1','#c5e1dd'],
  pilgrim:['#587c61','#93b287','#dfdfb1'],keeper:['#675981','#afa0cf','#d6c1eb']};
 const [cloak,trim,skin]=palette[id]||palette.merchant!;
 ctx.fillStyle='#07111b';ctx.beginPath();ctx.ellipse(0,6,18,5,0,0,Math.PI*2);ctx.fill();
 // Each NPC has a unique top silhouette and accessory.
 poly(ctx,[[-11,-39],[-19,-30],[-19,0],[18,0],[20,-29],[12,-39]],cloak);
 ctx.fillStyle=trim;ctx.fillRect(-13,-20,26,3);ctx.fillRect(-3,-33,6,19);
 ctx.fillStyle=skin;ctx.fillRect(-7,-54,14,13);
 ctx.fillStyle='#11222b';ctx.fillRect(-5,-49,3,3);ctx.fillRect(3,-49,3,3);
 if(id==='merchant'){
   ctx.fillStyle='#9e6d4f';ctx.fillRect(-22,-53,44,7);poly(ctx,[[-14,-53],[-9,-68],[9,-68],[16,-53]],'#bc956c');
   ctx.fillStyle='#a48961';ctx.fillRect(-28,-24,13,21);ctx.strokeStyle='#f1ca85';ctx.strokeRect(-28,-24,13,21);
   ctx.fillStyle='#e9ca7e';ctx.fillRect(-25,-19,7,7);
 }else if(id==='scout'){
   poly(ctx,[[-12,-55],[-10,-72],[-1,-65],[13,-72],[13,-55]],'#37596e');
   ctx.strokeStyle='#c9c89e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(22,-11);ctx.lineTo(27,-68);ctx.stroke();
   ctx.fillStyle='#cad4c6';ctx.fillRect(24,-66,7,5);
 }else if(id==='pilgrim'){
   poly(ctx,[[-15,-53],[-15,-64],[0,-77],[14,-63],[14,-52]],'#63765d');
   ctx.fillStyle='#a0c8a4';ctx.fillRect(13,-30,22,15);ctx.fillStyle='#283e34';ctx.fillRect(17,-26,13,7);
 }else{
   ctx.fillStyle='#9e8fc4';ctx.fillRect(-20,-61,40,5);
   ctx.fillStyle='#8c77a7';ctx.fillRect(-3,-78,6,24);
   ctx.strokeStyle='#b3a5e9';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(24,-6);ctx.lineTo(24,-82);ctx.stroke();
   ctx.fillStyle='#d6caef';ctx.fillRect(18,-86,13,11);
   light(ctx,24,-70,47,'#a395da',.22);
 }
 ctx.restore();
}
function drawShadow(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry=8){
 ctx.save();ctx.globalAlpha=.48;ctx.fillStyle='#060d17';ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawTree(ctx:CanvasRenderingContext2D,x:number,y:number,k:number,t:number,zone:ZoneId){
 const a=biomePalette(zone),sw=Math.sin(t*.7+k*7)*1.4;
 drawShadow(ctx,x,y,27);
 ctx.save();ctx.translate(x,y);
 if(a.silhouette==='cypress'){
   ctx.fillStyle=a.trunk;poly(ctx,[[-5,5],[-7,-48],[7,-48],[6,5]],a.trunk);
   for(let j=0;j<3;j++){
     const width=27-j*5,top=-94+j*19,bottom=-22+j*10;
     poly(ctx,[[-width+sw, bottom],[sw-4,top],[sw+5,top+3],[width+sw,bottom]],j===0?a.canopyDark:j===1?a.canopyMid:a.canopyLight);
   }
   poly(ctx,[[sw-6,-78],[sw-3,-98],[sw+5,-81],[sw+1,-57]],a.rim);
   ctx.fillStyle=a.accent;ctx.fillRect(-15,-39,3,3);ctx.fillRect(13,-26,3,3);
 }else if(a.silhouette==='ash-oak'){
   poly(ctx,[[-9,5],[-14,-40],[-8,-62],[2,-59],[7,-29],[10,5]],a.trunk);
   poly(ctx,[[-12,-40],[-39,-65],[-35,-72],[-5,-54]],a.trunk);
   poly(ctx,[[2,-51],[28,-76],[34,-68],[7,-37]],a.trunk);
   poly(ctx,[[-42+sw,-49],[-34,-78],[-9+sw,-94],[10,-74],[5,-43]],a.canopyDark);
   poly(ctx,[[-7+sw,-64],[5,-94],[32+sw,-88],[42,-60],[21,-44]],a.canopyMid);
   poly(ctx,[[-19,-83],[2,-98],[20,-84],[4,-69]],a.canopyLight);
   poly(ctx,[[-15,-31],[-31,-3],[-13,-11],[-4,-25]],a.trunk);
   poly(ctx,[[7,-31],[25,-2],[10,-10],[1,-21]],a.trunk);
   ctx.fillStyle=a.rim;ctx.fillRect(19,-74,6,3);ctx.fillRect(-34,-58,5,3);
   ctx.fillStyle=a.accent;ctx.fillRect(-6,-54,3,8);
 }else if(a.silhouette==='reliquary'){
   poly(ctx,[[-10,4],[-22,-47],[-5,-95],[10,-45],[13,4]],a.canopyDark);
   poly(ctx,[[-8,-1],[-13,-43],[-1,-88],[5,-41],[4,-2]],a.canopyMid);
   poly(ctx,[[-2,-85],[2,-45],[3,-7],[9,-45]],a.canopyLight);
   poly(ctx,[[10,-2],[17,-50],[31,-75],[37,-34],[24,-3]],a.canopyMid);
   poly(ctx,[[18,-48],[31,-75],[30,-36],[23,-10]],a.rim);
   poly(ctx,[[-23,0],[-35,-35],[-24,-63],[-12,-30],[-13,0]],a.canopyMid);
   ctx.fillStyle=a.accent;ctx.fillRect(-3,-92,6,8);ctx.fillRect(24,-65,4,7);
   ctx.fillStyle=a.stoneLight;ctx.fillRect(-16,-1,32,5);
 }else if(a.silhouette==='mangrove'){
   poly(ctx,[[-6,5],[-7,-39],[-21,-59],[-15,-63],[2,-48],[8,-19],[6,5]],a.trunk);
   poly(ctx,[[-1,-32],[14,-61],[21,-64],[12,-33]],a.trunk);
   poly(ctx,[[-5,-30],[-26,6],[-15,0],[3,-14]],a.trunk);
   poly(ctx,[[4,-25],[26,6],[14,1],[-2,-14]],a.trunk);
   poly(ctx,[[-37+sw,-52],[-27,-83],[5+sw,-88],[19,-67],[3,-43]],a.canopyDark);
   poly(ctx,[[-2+sw,-57],[14,-91],[36+sw,-82],[43,-51],[23,-41]],a.canopyMid);
   poly(ctx,[[-23,-72],[-6,-88],[9,-76],[5,-62]],a.canopyLight);
   ctx.fillStyle=a.rim;for(let j=0;j<5;j++){const xx=-30+j*14;ctx.fillRect(xx,-48+(j%2)*5,2,15+j%3*6);}
   ctx.fillStyle=a.accent;ctx.fillRect(23,-74,4,3);ctx.fillRect(-20,-65,3,3);
 }else{
   poly(ctx,[[-12,5],[-19,-38],[-10,-81],[0,-104],[15,-75],[11,-17],[18,5]],a.canopyDark);
   poly(ctx,[[-4,-93],[1,-103],[9,-74],[5,-19],[11,3],[0,-5]],a.canopyMid);
   poly(ctx,[[1,-102],[6,-78],[2,-51],[-2,-82]],a.rim);
   poly(ctx,[[-30,-22],[-34,-62],[-26,-76],[-18,-55],[-17,-18]],a.canopyMid);
   poly(ctx,[[23,-33],[30,-75],[38,-56],[33,-20]],a.canopyMid);
   ctx.fillStyle=a.accent;ctx.fillRect(-5,-59,10,3);ctx.fillRect(-4,-46,8,3);
   poly(ctx,[[21+sw,-95],[27+sw,-109],[33+sw,-91]],a.canopyLight);
   poly(ctx,[[-33-sw,-92],[-26-sw,-105],[-20-sw,-86]],a.rim);
 }
 ctx.restore();
}
function drawCottage(ctx:CanvasRenderingContext2D,x:number,y:number,k:number,t:number){
 drawShadow(ctx,x,y,30);
 ctx.save();ctx.translate(x,y);
 const m=VISUAL_ASSETS.cottage.materials;
 poly(ctx,[[-24,2],[-24,-41],[25,-41],[25,2]],k>.5?'#605a56':m.wall);
 ctx.fillStyle='#3d3333';ctx.fillRect(-23,-38,5,39);ctx.fillRect(19,-38,5,39);
 poly(ctx,[[-34,-38],[-2,-72],[33,-38]],'#5a474f');
 poly(ctx,[[-24,-43],[-2,-65],[24,-43]],'#866e69');
 ctx.strokeStyle='#c7a088';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-30,-40);ctx.lineTo(-2,-70);ctx.lineTo(29,-40);ctx.stroke();
 ctx.fillStyle='#271f24';ctx.fillRect(-9,-23,17,24);
 ctx.fillStyle='#947256';ctx.fillRect(-7,-20,13,21);
 ctx.fillStyle='#edca87';ctx.fillRect(14,-29,8,9);ctx.fillRect(-20,-29,7,9);
 ctx.fillStyle='#4f3c37';ctx.fillRect(15,-27,3,6);
 ctx.fillStyle='#f6dc9b';ctx.fillRect(3,-11,2,2);
 light(ctx,17,-26,40,'#ffc985',.18+Math.sin(t*1.3+k)*.035);
 ctx.restore();
}
function drawMasonry(ctx:CanvasRenderingContext2D,x:number,y:number,k:number,zone:ZoneId){
 const a=biomePalette(zone);drawShadow(ctx,x,y,27);
 ctx.save();ctx.translate(x,y);
 if(zone==='spire'){
   poly(ctx,[[-22,4],[-18,-57],[-9,-72],[14,-68],[23,-43],[21,5]],a.stoneDark);
   poly(ctx,[[-13,-60],[-3,-75],[5,-65],[4,5],[-8,5]],a.stoneMid);
   ctx.fillStyle=a.accent;ctx.fillRect(-3,-48,6,4);ctx.fillRect(-2,-34,4,9);
   poly(ctx,[[12,-53],[20,-63],[26,-49],[21,-31]],a.stoneLight);
 }else if(zone==='sanctuary'){
   ctx.fillStyle=a.stoneDark;ctx.fillRect(-25,-48,50,52);
   ctx.fillStyle=a.stoneMid;ctx.fillRect(-25,-52,50,9);ctx.fillRect(-20,-37,8,41);ctx.fillRect(13,-37,8,41);
   poly(ctx,[[-11,-24],[0,-39],[12,-24],[12,4],[-11,4]],'#22283b');
   ctx.fillStyle=a.stoneLight;ctx.fillRect(-23,-52,9,4);ctx.fillRect(14,-52,9,4);
   ctx.fillStyle=a.accent;ctx.fillRect(-1,-30,3,10);
 }else{
   ctx.fillStyle=a.stoneDark;ctx.fillRect(-25,-34,50,38);
   ctx.fillStyle=a.stoneMid;ctx.fillRect(-24,-39,48,8);ctx.fillRect(-20,-20,13,11);ctx.fillRect(4,-19,16,12);
   ctx.fillStyle=a.stoneLight;ctx.fillRect(-25,-39,17,3);ctx.fillRect(2,-39,18,3);
   if(k>.7){ctx.fillStyle=a.accent;ctx.fillRect(-2,-29,4,8);}
 }
 ctx.restore();
}
function drawStone(ctx:CanvasRenderingContext2D,x:number,y:number,k:number,zone:ZoneId){
 const a=biomePalette(zone);drawShadow(ctx,x,y,21,6);
 ctx.save();ctx.translate(x,y);
 if(zone==='sanctuary'||zone==='spire'){
   poly(ctx,[[-20,1],[-17,-18],[-4,-31],[12,-25],[21,-5],[13,5]],a.stoneDark);
   poly(ctx,[[-7,-28],[13,-25],[21,-5],[0,-8]],a.stoneMid);
   poly(ctx,[[-17,-18],[-4,-31],[-7,-21],[-15,-9]],a.stoneLight);
   ctx.fillStyle=a.accent;ctx.fillRect(4,-17,4,3);
 }else{
   poly(ctx,[[-22,0],[-19,-12],[-9,-21],[12,-18],[22,-6],[16,4]],a.stoneDark);
   poly(ctx,[[-9,-21],[12,-18],[18,-8],[3,-10]],a.stoneMid);
   poly(ctx,[[-19,-12],[-9,-21],[3,-19],[-8,-13]],a.stoneLight);
   if(zone==='marsh'){ctx.fillStyle=a.grassLight;ctx.fillRect(-11,-7,9,3);}
   if(zone==='forest'){ctx.fillStyle=a.grass;ctx.fillRect(5,-8,7,4);}
 }
 ctx.restore();
}
function drawRuin(ctx:CanvasRenderingContext2D,x:number,y:number,k:number,zone:ZoneId){
 const a=biomePalette(zone);drawShadow(ctx,x,y,29);
 ctx.save();ctx.translate(x,y);
 ctx.fillStyle=a.stoneDark;ctx.fillRect(-19,-57,14,61);ctx.fillRect(8,-57,14,61);
 ctx.fillStyle=a.stoneMid;ctx.fillRect(-25,-60,50,11);
 ctx.fillStyle=a.stoneLight;ctx.fillRect(-20,-62,15,4);ctx.fillRect(7,-62,16,4);
 poly(ctx,[[-15,-53],[-10,-40],[-12,0],[-17,0]],a.stoneMid);
 ctx.fillStyle=a.accent;ctx.fillRect(-2,-48,5,5);
 ctx.restore();
}
function drawGround(ctx:CanvasRenderingContext2D,zone:ZoneId,camX:number,camY:number,t:number){
 const z=ZONES[zone],a=biomePalette(zone);
 ctx.fillStyle=z.ground;ctx.fillRect(0,0,W,H);
 const left=Math.max(0,Math.floor(camX/TILE)-1),right=Math.min(WORLD_W-1,Math.ceil((camX+W)/TILE)+1);
 const top=Math.max(0,Math.floor(camY/TILE)-1),bottom=Math.min(WORLD_H-1,Math.ceil((camY+H)/TILE)+2);
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
   const k=hash(x,y,z.seed),xx=x*TILE-camX,yy=y*TILE-camY,tile=terrain(zone,x,y);
   ctx.fillStyle=k>.48?a.soil[0]:a.soil[1];ctx.fillRect(xx,yy,TILE+1,TILE+1);
   if(tile==='path'){
     ctx.fillStyle=a.path;ctx.fillRect(xx,yy,TILE+1,TILE+1);
     ctx.fillStyle=a.pathMark;ctx.globalAlpha=.5;
     for(let i=0;i<3;i++){const px=xx+6+hash(x*7+i,y,z.seed+211)*34,py=yy+6+hash(x,y*7+i,z.seed+213)*33;ctx.fillRect(px,py,4+i%2,2);}
     ctx.globalAlpha=1;
     ctx.fillStyle=a.pathRim;
     if(terrain(zone,x,y-1)!=='path')ctx.fillRect(xx,yy,TILE,3);
     if(terrain(zone,x,y+1)!=='path')ctx.fillRect(xx,yy+TILE-3,TILE,3);
     if(terrain(zone,x-1,y)!=='path')ctx.fillRect(xx,yy,3,TILE);
     if(terrain(zone,x+1,y)!=='path')ctx.fillRect(xx+TILE-3,yy,3,TILE);
   }else if(tile==='water'){
     ctx.fillStyle=a.water;ctx.fillRect(xx,yy,TILE+1,TILE+1);
     ctx.strokeStyle=a.waterRim;ctx.globalAlpha=.56;ctx.lineWidth=2;
     for(let i=0;i<2;i++){const wave=yy+14+i*19+Math.sin(t*1.1+k+i)*2;ctx.beginPath();ctx.moveTo(xx+8+i*4,wave);ctx.quadraticCurveTo(xx+22,wave-4,xx+36+i*2,wave);ctx.stroke();}
     ctx.globalAlpha=1;
   }else if(tile==='grass'){
     ctx.fillStyle=a.grass;ctx.globalAlpha=.22;ctx.fillRect(xx+2,yy+3,43,41);ctx.globalAlpha=1;
     ctx.strokeStyle=a.grassLight;ctx.lineWidth=2;ctx.globalAlpha=.65;
     for(let i=0;i<2;i++){const gx=xx+12+hash(x+i,y,z.seed+23)*26,gy=yy+17+hash(x,y+i,z.seed+25)*20;ctx.beginPath();ctx.moveTo(gx,gy+6);ctx.lineTo(gx-4,gy-2);ctx.moveTo(gx,gy+6);ctx.lineTo(gx+4,gy-4);ctx.stroke();}
     ctx.globalAlpha=1;
   }else if(tile==='ground'||tile==='stone'){
     if(k>.78){ctx.fillStyle=a.soilMark;ctx.fillRect(xx+9,yy+16,4,2);ctx.fillRect(xx+29,yy+33,3,2);}
     if(zone==='sanctuary'&&k>.91){ctx.fillStyle=a.stoneMid;ctx.fillRect(xx+19,yy+15,8,2);}
     if(zone==='spire'&&k>.92){ctx.fillStyle=a.canopyMid;ctx.fillRect(xx+23,yy+12,3,10);}
   }
 }
 // Subtle world-space glow is shared by both graphics profiles.
 for(let i=0;i<6;i++){const xx=((i*271+Math.sin(t*.2+i)*90-camX*.09)%1250+1250)%1250-150,yy=70+i*76+Math.sin(t*.34+i*2)*24;light(ctx,xx,yy,230,z.glow,.02);}
}
function drawClimate(ctx:CanvasRenderingContext2D,zone:ZoneId,t:number,seed:number,reduced=false){
 const speed=reduced?0:t;
 ctx.save();
 if(zone==='forest'||zone==='marsh'){
   const count=reduced?18:zone==='marsh'?48:36;
   ctx.lineWidth=1.25;ctx.strokeStyle=zone==='marsh'?'#91e1cb':'#b6d8dc';
   for(let i=0;i<count;i++){
     const a=hash(i,131,seed),b=hash(i,53,seed),drift=speed*(100+a*140);
     const x=((a*W+drift)%W+W)%W,y=((b*H+speed*(190+b*130))%H+H)%H;
     ctx.globalAlpha=.09+.18*hash(i,22,seed);
     ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+7+b*7);ctx.stroke();
   }
   ctx.fillStyle=zone==='marsh'?'#8bdfbc':'#b9d2a4';
   for(let i=0;i<12;i++){
     const x=((hash(i,176,seed)*W+speed*(12+i%4*7))%W+W)%W;
     const y=((hash(i,113,seed)*H+Math.sin(speed*.8+i)*12)%H+H)%H;
     ctx.globalAlpha=.12+.22*hash(i,42,seed);ctx.fillRect(x,y,2+i%2,2);
   }
 }else if(zone==='sanctuary'||zone==='spire'){
   const glyphs=zone==='spire'?['✦','∴','◊','·']:['+','*','o','~'];ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 11px monospace';
   for(let i=0;i<(reduced?13:36);i++){
     const x=((hash(i,35,seed)*W+Math.sin(speed*.28+i)*11)%W+W)%W;
     const y=((hash(i,79,seed)*H-speed*(13+i%5*6))%H+H)%H;
     const alpha=(.13+.22*hash(i,87,seed))*(.7+.3*Math.sin(speed*.6+i));
     ctx.globalAlpha=alpha;ctx.fillStyle=i%3?(zone==='spire'?'#c6a4f7':'#b9a6ea'):(zone==='spire'?'#f1d7e9':'#e6c7a2');ctx.fillText(glyphs[i%glyphs.length]!,x,y);
   }
 }else{
   ctx.fillStyle='#d7b77c';
   for(let i=0;i<(reduced?12:30);i++){
     const a=hash(i,154,seed),x=((a*W+Math.sin(speed*.33+i)*28)%W+W)%W;
     const y=((hash(i,177,seed)*H-speed*(11+i%4*5))%H+H)%H;
     ctx.globalAlpha=.1+.24*hash(i,78,seed);ctx.fillRect(x,y,2,2+i%3);
   }
 }
 ctx.restore();
}
export function drawWorld(ctx:CanvasRenderingContext2D,zone:ZoneId,hero:DrawPlayer,t:number,flash=0,defeated=false,camera?:Camera,reducedMotion=false,roamers:readonly RoamingEncounter[]=[],finalBossDefeated=false){const z=ZONES[zone];const c=camera||hero;
  const camX=Math.max(0,Math.min(WORLD_W*TILE-W,(c.x+.5)*TILE-W*.5));const camY=Math.max(0,Math.min(WORLD_H*TILE-H,(c.y+.5)*TILE-H*.5));drawGround(ctx,zone,camX,camY,t);const objects:{x:number;y:number;draw:()=>void}[]=[];
const left=Math.max(0,Math.floor(camX/TILE)-2),right=Math.min(WORLD_W-1,Math.ceil((camX+W)/TILE)+2),top=Math.max(0,Math.floor(camY/TILE)-3),bottom=Math.min(WORLD_H-1,Math.ceil((camY+H)/TILE)+2);
for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){const typ=terrain(zone,x,y);const xx=(x+.5)*TILE-camX,yy=(y+.78)*TILE-camY,k=hash(x,y,z.seed);if(typ==='tree'){
   const nearPath=terrain(zone,x+1,y)==='path'||terrain(zone,x-1,y)==='path'||terrain(zone,x,y+1)==='path'||terrain(zone,x,y-1)==='path';
   const cottage=zone==='village'&&nearPath&&hash(x,y,z.seed+771)>.72;
   objects.push({x:xx,y:yy,draw:()=>cottage?drawCottage(ctx,xx,yy,k,t):drawTree(ctx,xx,yy,k,t,zone)});
 }
 if(typ==='wall')objects.push({x:xx,y:yy,draw:()=>drawMasonry(ctx,xx,yy,k,zone)});
 if(typ==='stone')objects.push({x:xx,y:yy,draw:()=>{drawStone(ctx,xx,yy,k,zone);}});}
for(const l of z.landmarks){const xx=(l.x+.5)*TILE-camX,yy=(l.y+.75)*TILE-camY;if(xx<-100||xx>W+100||yy<-100||yy>H+100)continue;
 if(l.kind==='altar'||l.kind==='portal'){objects.push({x:xx,y:yy,draw:()=>{drawRuin(ctx,xx,yy,0,zone);light(ctx,xx,yy-29,l.kind==='portal'?95:75,l.kind==='portal'?'#83d0d8':'#f6c089',.5);ctx.fillStyle=l.kind==='portal'?'#91cdd9':'#e7bc7f';ctx.fillRect(xx-3,yy-34,7,9);}});}
 if(l.kind==='npc')objects.push({x:xx,y:yy,draw:()=>{drawNPC(ctx,xx,yy,t,l.npcId||'archivist');}});
 if(l.kind==='memory'||l.kind==='verdict')objects.push({x:xx,y:yy,draw:()=>{
  ctx.save();ctx.translate(xx,yy);const pulse=reducedMotion?.38:.38+Math.sin(t*1.6+l.x)*.15;
  ctx.fillStyle=l.kind==='verdict'?'#253749':'#255059';ctx.fillRect(-17,-30,34,30);
  ctx.strokeStyle=l.kind==='verdict'?'#d8b68d':'#85d5c1';ctx.lineWidth=3;ctx.strokeRect(-19,-34,38,36);
  ctx.font='bold 24px monospace';ctx.textAlign='center';ctx.fillStyle=l.kind==='verdict'?'#ffdaa8':'#a7f1da';ctx.fillText(l.kind==='verdict'?'◇':'◈',0,-10);
  light(ctx,0,-17,l.kind==='verdict'?88:64,l.kind==='verdict'?'#edbd83':'#6fdac7',pulse);ctx.restore();
 }});
 if(l.kind==='rune')objects.push({x:xx,y:yy,draw:()=>{
  ctx.save();ctx.translate(xx,yy);const glow=0.25+Math.sin(t*1.7)*.09;
  ctx.fillStyle='#263744';ctx.fillRect(-10,-29,20,30);ctx.fillStyle='#748e9e';ctx.fillRect(-11,-33,22,6);
  ctx.fillStyle='#e4d0a8';ctx.textAlign='center';ctx.font='bold 17px monospace';ctx.fillText('*+#',0,-10);
  light(ctx,0,-21,42,'#e4d0a8',glow);ctx.restore();
 }});
 if(l.kind==='chest')objects.push({x:xx,y:yy,draw:()=>{ctx.fillStyle='#705b46';ctx.fillRect(xx-18,yy-14,36,18);ctx.fillStyle='#b29869';ctx.fillRect(xx-18,yy-18,36,8);ctx.fillRect(xx-2,yy-18,5,22);light(ctx,xx,yy,40,'#e5a778',.18);}});
 if(l.kind==='guardian'&&(l.npcId==='nullscribe'?!finalBossDefeated:!defeated))objects.push({x:xx,y:yy,draw:()=>{drawCreature(ctx,l.npcId==='nullscribe'?'nullscribe':'hollowhart',xx,yy,l.npcId==='nullscribe'?2.7:2.25,t);light(ctx,xx,yy-45,120,l.npcId==='nullscribe'?'#ca97ee':'#a791d5',.3);}});
 }
for(const e of roamers){const xx=(e.x+.5)*TILE-camX,yy=(e.y+.78)*TILE-camY;if(xx<-80||xx>W+80||yy<-80||yy>H+80)continue;
  objects.push({x:xx,y:yy,draw:()=>{
    const pulse=reducedMotion?.5:.58+.09*Math.sin(t*2+e.x);
    light(ctx,xx,yy-24,52,'#e6a38e',pulse);
    drawCreature(ctx,e.speciesId,xx,yy-.5,0.85,t,'idle',reducedMotion);
    ctx.fillStyle='#f2c4a2';ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillText('!',xx,yy-61);
  }});
}
// Localized visual focus is presentation-only and follows the authored four-way silhouette.
const heroScreenX=(hero.x+.5)*TILE-camX,heroScreenY=(hero.y+.55)*TILE-camY;
objects.push({x:hero.x*TILE-camX,y:hero.y*TILE-camY,draw:()=>{
  light(ctx,heroScreenX,heroScreenY-30,46,'#85cfc3',.19);
  ctx.save();
  ctx.strokeStyle='#91c8c3';ctx.globalAlpha=.65;ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(heroScreenX,heroScreenY+3,18,5,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
  drawHero(ctx,heroScreenX,heroScreenY,t,hero.walking,hero.facing,false,reducedMotion);
}});objects.sort((a,b)=>a.y-b.y);for(const obj of objects)obj.draw();
// Per-biome atmosphere: sparks in Arken, rain and spores in the woods, rising runes in the sanctuary.
// All geometry passes through the same ASCII compositor as the physical world.
drawClimate(ctx,zone,t,z.seed,reducedMotion);
if(flash>0){ctx.fillStyle=`rgba(194,175,229,${flash*.25})`;ctx.fillRect(0,0,W,H);}}
/** Battle direction rendered into the source canvas and then converted to genuine ASCII glpyhs. */
function spellColor(element:string):string{
 switch(element){case 'Ceniza':case 'ember':case 'ash':return '#ffac68';case 'Bruma':case 'mist':return '#8de5e1';case 'Raíz':case 'root':return '#afe4a0';case 'Éter':case 'aether':return '#d9aaff';default:return '#d9cbb3';}
}
function battleEffects(ctx:CanvasRenderingContext2D,fx:CombatFxFrame,t:number,signature:BattleSignature|null){
 const enemy={x:695,y:220},ally={x:268,y:309};
 const from=fx.actor==='ally'?ally:enemy,to=fx.actor==='ally'?enemy:ally;
 const color=spellColor(fx.element);
 ctx.save();
 if(fx.kind==='attack'&&fx.trail>.01){
   const p=Math.max(0,Math.min(1,(fx.phase-.16)/.35));
   const x=from.x+(to.x-from.x)*p,y=from.y-44+(to.y-from.y)*p-40*Math.sin(Math.PI*p);
   ctx.globalAlpha=Math.min(.8,fx.trail*.85);
   ctx.strokeStyle=color;ctx.lineWidth=3+fx.trail*6;
   ctx.beginPath();ctx.moveTo(from.x,from.y-35);ctx.quadraticCurveTo((from.x+to.x)/2,(from.y+to.y)/2-130,x,y);ctx.stroke();
   light(ctx,x,y,32+fx.trail*75,color,.6);
   for(let i=0;i<18;i++){
     const theta=i*2.39996+t*.3, r=7+((i*19)%37)*fx.trail;
     ctx.fillStyle=i%3===0?'#f8f1d9':color;
     ctx.fillRect(x+Math.cos(theta)*r,y+Math.sin(theta)*r,2+(i%3),2+(i%3));
   }
 }
 if(signature&&signature.impact>.03){
   // The species family determines the silhouette of the blow, not merely its color.
   const x=to.x,y=to.y-32,a=signature.impact;
   ctx.save();ctx.globalAlpha=a*.77;ctx.strokeStyle=color;ctx.lineWidth=2+a*4;
   ctx.translate(x,y);
   switch(signature.kind){
     case 'pounce':case 'talons':for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-27+i*13,-24);ctx.quadraticCurveTo(i*11,0,24+i*12,27);ctx.stroke();}break;
     case 'spectral':for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,12+i*19,29+i*12,t*.3,0,Math.PI*2);ctx.stroke();}break;
     case 'wingstorm':for(let i=-1;i<=1;i+=2){ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(i*42,-40,i*67,-5);ctx.quadraticCurveTo(i*37,21,0,0);ctx.stroke();}break;
     case 'stampede':case 'quake':for(let i=-3;i<=3;i++){const h=13+(3-Math.abs(i))*10;ctx.beginPath();ctx.moveTo(i*21,h);ctx.lineTo(i*24,15-h*a);ctx.stroke();}break;
     case 'riptide':for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,17+i*18,-1.4+i*.4,1.9+i*.4);ctx.stroke();}break;
     case 'thorns':for(let i=0;i<8;i++){const z=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(z)*12,Math.sin(z)*12);ctx.lineTo(Math.cos(z)*60,Math.sin(z)*60);ctx.lineTo(Math.cos(z+.25)*43,Math.sin(z+.25)*43);ctx.stroke();}break;
     case 'antlers':for(let i of [-1,1]){ctx.beginPath();ctx.moveTo(0,25);ctx.lineTo(i*21,-25);ctx.lineTo(i*48,-45);ctx.moveTo(i*21,-25);ctx.lineTo(i*13,-50);ctx.stroke();}break;
   }
   ctx.restore();
 }
 if(fx.impact>0){
   const x=to.x,y=to.y-32;ctx.strokeStyle=color;ctx.lineWidth=2+fx.impact*6;ctx.globalAlpha=.75*fx.impact;
   for(let i=0;i<16;i++){
     const angle=(i/16)*Math.PI*2,near=15+fx.impact*13,far=near+10+fx.impact*47;
     ctx.beginPath();ctx.moveTo(x+Math.cos(angle)*near,y+Math.sin(angle)*near);
     ctx.lineTo(x+Math.cos(angle)*far,y+Math.sin(angle)*far);ctx.stroke();
   }
   ctx.globalAlpha=fx.impact*.45;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,14+fx.impact*28,0,Math.PI*2);ctx.fill();
 }
 if(fx.kind==='guard'||fx.kind==='heal'||fx.kind==='capture'){
   const x=from.x,y=from.y-43;const radius=35+fx.trail*32;
   ctx.strokeStyle=fx.kind==='heal'?'#a9e9ab':fx.kind==='capture'?'#d0afea':'#a9d5ed';
   ctx.lineWidth=3;ctx.globalAlpha=fx.trail*.6;
   ctx.beginPath();ctx.ellipse(x,y,radius,radius*.65,0,0,Math.PI*2);ctx.stroke();
   for(let i=0;i<11;i++){const a=i*Math.PI*2/11+t*.9;ctx.fillRect(x+Math.cos(a)*radius,y+Math.sin(a)*radius*.65,3,4);}
 }
 // Damage number is authored in the scene, ensuring its appearance uses ASCII glyphs.
 if(fx.kind==='attack'&&fx.phase>.39&&fx.phase<.85&&fx.damage>0){
   const p=(fx.phase-.39)/.46;ctx.globalAlpha=Math.min(1,Math.min(p*6,(1-p)*5));
   ctx.textAlign='center';ctx.font='bold 35px monospace';ctx.fillStyle=fx.effective?'#ffe3a4':'#efc7bc';
   ctx.fillText(`-${fx.damage}`,to.x,to.y-102-p*43);
   if(fx.effective){ctx.font='bold 13px monospace';ctx.fillStyle='#fff2bf';ctx.fillText('¡EFICAZ!',to.x,to.y-78-p*42);}
 }
 ctx.restore();
}
export function drawBattle(ctx:CanvasRenderingContext2D,enemy:Creature,ally:Creature,t:number,flash=0,fx:CombatFxFrame|null=null,reducedMotion=false,statuses?:{enemy:readonly string[];ally:readonly string[]}){
 ctx.save();if(fx)ctx.translate(fx.shakeX,fx.shakeY);
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0d1524');g.addColorStop(.64,'#172831');g.addColorStop(1,'#222a33');ctx.fillStyle=g;ctx.fillRect(-12,-12,W+24,H+24);
 // Architectural ruins establish perspective and scene scale.
 for(let i=0;i<7;i++){
   const x=75+i*142,dist=i%3;ctx.globalAlpha=.08+(dist*.03);ctx.fillStyle='#9daeb2';
   ctx.fillRect(x,64+dist*18,19,211-dist*12);ctx.fillRect(x-9,63+dist*18,38,12);ctx.fillRect(x-9,267,38,10);
 }
 ctx.globalAlpha=1;
 for(let i=0;i<16;i++){const y=278+i*16;ctx.strokeStyle='#5d7b80';ctx.globalAlpha=.10;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
 ctx.globalAlpha=1;
 light(ctx,702,124,220,SPECIES[enemy.speciesId]!.color,.20);light(ctx,255,286,180,SPECIES[ally.speciesId]!.color,.16);
 ctx.fillStyle='#38505a';ctx.beginPath();ctx.ellipse(700,258,137,20,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(260,339,148,24,0,0,Math.PI*2);ctx.fill();
 const signature=fx?sampleBattleSignature((fx.actor==='ally'?ally:enemy).speciesId,fx,reducedMotion):null;
 const renderUnit=(unit:Creature,x:number,y:number,scale:number,role:'ally'|'enemy',pose?:{x:number;y:number;scaleX:number;scaleY:number;rotation:number;alpha:number})=>{
   ctx.save();ctx.translate(x,y);if(pose){ctx.translate(pose.x,pose.y);ctx.rotate(pose.rotation);ctx.scale(pose.scaleX,pose.scaleY);ctx.globalAlpha*=pose.alpha;}
   if(signature){const p=fx!.actor===role?signature.attacker:signature.defender;ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.scale(p.scaleX,p.scaleY);ctx.globalAlpha*=p.alpha;}
   const action:CreatureAction=fx?.kind==='attack'?(fx.actor===role?'attack':signature&&signature.impact>.08?'hurt':'idle'):'idle';
   drawCreature(ctx,unit.speciesId,0,0,scale,t,action,reducedMotion);ctx.restore();
 };
 const enemyPose=fx?(fx.actor==='enemy'?fx.attacker:fx.target):undefined;
 const allyPose=fx?(fx.actor==='ally'?fx.attacker:fx.target):undefined;
 renderUnit(enemy,695,234,2.15,'enemy',enemyPose);renderUnit(ally,268,319,2.0,'ally',allyPose);
 // Status auras live inside the scene so the final GPU/Canvas compositor renders them as glifos.
 const aura=(x:number,y:number,effects:readonly string[])=>{
   if(!effects.length)return;
   ctx.save();
   for(const [j,kind] of effects.entries()){
     const tone=kind==='scorch'?'#ff925f':kind==='weaken'?'#8ccee2':'#c8a5ff';
     const radius=33+j*13;ctx.strokeStyle=tone;ctx.lineWidth=1.5;
     ctx.globalAlpha=.25+.12*Math.sin(t*2.8+j);
     ctx.beginPath();ctx.ellipse(x,y-28,radius,radius*.28,0,0,Math.PI*2);ctx.stroke();
     for(let i=0;i<9;i++){
       const theta=(i/9)*Math.PI*2+t*(kind==='scorch'?.75:-.32);
       ctx.fillStyle=tone;ctx.fillRect(x+Math.cos(theta)*radius-2,y-30+Math.sin(theta)*radius*.28-16-(kind==='scorch'?((t*12+i*7)%14):0),3,4);
     }
   }
   ctx.restore();
 };
 aura(695,234,statuses?.enemy??[]);aura(268,319,statuses?.ally??[]);
 for(let i=0;i<44;i++){const x=hash(i,41,6)*W,y=hash(i,82,4)*H;ctx.globalAlpha=.08+hash(i,12,8)*.14;ctx.fillStyle='#a6d0d4';ctx.fillRect(x+Math.sin(t+i)*6,y,2,2);}ctx.globalAlpha=1;
 if(fx)battleEffects(ctx,fx,t,signature);
 if(flash>0){ctx.fillStyle=`rgba(231,210,195,${flash*.24})`;ctx.fillRect(0,0,W,H);}
 ctx.restore();
}

/** Evolution is a fully authored in-world ritual, subsequently converted to ASCII. */
export function drawEvolution(ctx:CanvasRenderingContext2D,fromId:string,toId:string,t:number,reducedMotion=false){
 const duration=reducedMotion?.65:3.2;
 const progress=Math.max(0,Math.min(1,t/duration));
 const ease=(x:number)=>x*x*(3-2*x);
 const blend=ease(Math.max(0,Math.min(1,(progress-.28)/.48)));
 ctx.fillStyle='#090f1a';ctx.fillRect(0,0,W,H);
 const background=ctx.createRadialGradient(W*.5,H*.5,3,W*.5,H*.5,370);
 background.addColorStop(0,'#283244');background.addColorStop(.46,'#142532');background.addColorStop(1,'#050a12');
 ctx.fillStyle=background;ctx.fillRect(0,0,W,H);
 const from=SPECIES[fromId],to=SPECIES[toId];if(!from||!to)return;
 ctx.save();ctx.translate(W/2,H/2-20);
 const rotation=t*(reducedMotion?0:.38);
 for(let i=0;i<38;i++){
  const angle=i*Math.PI*2/38+rotation,ring=172+Math.sin(t*2+i*.3)*5;
  const x=Math.cos(angle)*ring,y=Math.sin(angle)*ring*.62;
  ctx.fillStyle=i%3===0?to.color:from.color;ctx.globalAlpha=.2+.5*Math.sin(Math.PI*progress);
  ctx.font='bold 17px monospace';ctx.fillText('ᚨ✧◈✦◊'[i%5]!,x,y);
 }
 ctx.globalAlpha=1;ctx.restore();
 const intensity=Math.sin(Math.PI*progress);
 light(ctx,W/2,H/2,260,to.color,.15+.52*intensity);
 ctx.fillStyle='#203a43';ctx.beginPath();ctx.ellipse(W/2,435,140,19,0,0,Math.PI*2);ctx.fill();
 if(blend<1){ctx.save();ctx.globalAlpha=1-blend;drawCreature(ctx,fromId,W/2,370,3.65*(1+intensity*.16),t,'evolve',reducedMotion);ctx.restore();}
 if(blend>0){ctx.save();ctx.globalAlpha=blend;drawCreature(ctx,toId,W/2,370,3.65*(1+intensity*.20),t,'evolve',reducedMotion);ctx.restore();}
 for(let i=0;i<(reducedMotion?0:44);i++){
  const a=i*2.39996+t*.62,rad=30+(i*13)%165;
  ctx.globalAlpha=.2+intensity*.58;ctx.fillStyle=i%2?to.color:from.color;
  ctx.fillRect(W/2+Math.cos(a)*rad,H/2+Math.sin(a)*rad*.7-45,2+(i%4),2+(i%3));
 }
 ctx.globalAlpha=1;
}
