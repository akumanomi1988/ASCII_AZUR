import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
function luminance(hex){
  const rgb=hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255);
  const [r,g,b]=rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*r+.7152*g+.0722*b;
}
function contrast(a,b){
  const l=[luminance(a),luminance(b)].sort((a,b)=>b-a);
  return (l[0]+.05)/(l[1]+.05);
}
function highContrastTokens(){
  const block=css.match(/:root\.azur-high-contrast\{([^}]+)\}/)?.[1];
  assert.ok(block,'high contrast palette missing');
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m=>[m[1],m[2]]));
}
test('accessible presentation: critical text tokens meet WCAG AA normal text contrast',()=>{
  const p=highContrastTokens();
  for(const foreground of ['ink','muted','gold','teal']){
    for(const background of ['bg','panel']){
      assert.ok(contrast(p[foreground],p[background])>=4.5,`${foreground} over ${background} has insufficient contrast`);
    }
  }
});
test('accessible presentation: zoom, keyboard skip link and nonvisual state are preserved',()=>{
  assert.doesNotMatch(html,/user-scalable=no|maximum-scale=1/i);
  assert.match(html,/<a class="skip-link" href="#viewport">/);
  assert.match(html,/id="viewport"[^>]+tabindex="0"[^>]+aria-describedby="accessibilityInstructions"/);
  assert.match(html,/id="accessibilityStatus"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.match(html,/id="saveStatus"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.match(css,/\.skip-link:focus\{transform:none\}/);
  assert.match(css,/:root\.azur-high-contrast :is\(button,input,select,a,\[tabindex\]\):focus-visible/);
});


test('narrative and combat overlays expose dialog, focus and health semantics',()=>{
  assert.match(html, /id="dialogue"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /id="starterScreen"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /id="toast"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /id="enemyHealthTrack"[^>]*role="progressbar"/);
  assert.match(html, /id="allyHealthTrack"[^>]*role="progressbar"/);
  assert.match(html, /id="battleActions"[^>]*role="group"/);
  assert.match(html, /id="closeDialogue"[^>]*aria-label="Continuar diálogo"/);
  assert.match(html, /id="mute"[^>]*aria-pressed="false"/);
});
