import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visibleViewportHeight} from '../dist/core/mobile-viewport.js';

test('old Android Chrome stage uses the actually visible viewport instead of oversized 100vh',()=>{
 assert.equal(visibleViewportHeight(512,700),512);
 assert.equal(visibleViewportHeight(700,512),512);
 assert.equal(visibleViewportHeight(512,null),512);
 assert.equal(visibleViewportHeight(512,undefined),512);
 assert.equal(visibleViewportHeight(800,Infinity),800);
 assert.equal(visibleViewportHeight(Infinity,512),0);
 assert.equal(visibleViewportHeight(-1,512),0);
 assert.equal(visibleViewportHeight(123.9,119.7),119);
});
test('mobile scene and native input acceptance enforce actual viewport visibility',()=>{
 const css=readFileSync('style.css','utf8');
 const main=readFileSync('src/main.ts','utf8');
 const qa=readFileSync('tools/android-emulator-acceptance.mjs','utf8');
 const sw=readFileSync('sw.js','utf8');
 assert.match(css,/height: var\(--azur-visible-height, 100vh\) !important/);
 assert.match(main,/window\.visualViewport\?\.addEventListener\('resize',fit\)/);
 assert.match(qa,/Android joystick fully within the visible browser viewport/);
 assert.match(qa,/Touch target outside visible Chrome viewport/);
 assert.ok(sw.includes('./dist/core/mobile-viewport.js'));
});
