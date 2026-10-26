import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync('.github/workflows/verify.yml','utf8');
const runner=readFileSync('tools/android-emulator-acceptance.mjs','utf8');
test('Android emulator CI covers two Google Play API generations and gates Pages',()=>{
 assert.match(workflow,/android-emulator:\s*\n/);
 assert.match(workflow,/api-level: \[30, 35\]/);
 assert.match(workflow,/reactivecircus\/android-emulator-runner@v2/);
 assert.match(workflow,/target: google_apis/);
 assert.match(workflow,/if \[ -e \/dev\/kvm \]/);
 assert.match(workflow,/needs: \[verify, browser, android-emulator\]/);
 assert.match(workflow,/ascii-azur-android-api-/);
 assert.match(workflow,/if: always\(\)/);
});
test('Android acceptance sends native Chrome touch protocol, not DOM mock events',()=>{
 assert.match(runner,/Input\.dispatchTouchEvent/);
 assert.match(runner,/adb\('reverse'/);
 assert.match(runner,/localabstract:chrome_devtools_remote/);
 assert.match(runner,/Page\.captureScreenshot/);
 assert.doesNotMatch(runner,/new PointerEvent\(/);
 assert.match(runner,/deviceMemory|dumpsys/);
});
test('Android acceptance covers score lifecycle, virtual joystick, rotation and saved resume',()=>{
 for(const marker of ['testAudio()','frameProbe()','orientation','wm','joystickKnob',
   'motionReduced','highContrast','getElementById("continue")','setEnabled(false)',
   'retiringBuses','musicVoices','audio','chrome-memory.txt','emulatedMeasurements:true','physicalDevice:false']){
  assert.ok(runner.includes(marker),'missing mobile QA contract: '+marker);
 }
});

test('Android compact intro is locally scrollable with a reachable 44px start control',()=>{
 const css=readFileSync('style.css','utf8');
 assert.match(css,/#viewport #titleScreen\.intro\s*\{[^}]*overflow-y: auto/s);
 assert.match(css,/#viewport #titleScreen \.intro-buttons button\s*\{[^}]*min-height: 44px/s);
 assert.match(css,/-webkit-overflow-scrolling: touch/);
 assert.match(runner,/androidNativeOsTaps/);
 assert.match(runner,/__azurNativeTapClick/);
});

test('the starter modal is also a full-screen reachable selection on compact Android',()=>{
 const css=readFileSync('style.css','utf8');
 assert.match(css,/#starterScreen\.choice-overlay:not\(\.hidden\)\s*\{[^}]*position: fixed !important/s);
 assert.match(css,/#starterScreen \.starter\s*\{[^}]*min-height: 92px/s);
 assert.match(css,/#starterScreen \.starters\s*\{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/s);
});
