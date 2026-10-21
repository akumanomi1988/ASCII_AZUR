import test from 'node:test';import assert from 'node:assert/strict';
import {ambienceForScene} from '../dist/audio.js';
test('all soundscapes are quiet and have safe filter frequencies',()=>{for(const scene of ['title','village','forest','sanctuary','battle','boss']){const p=ambienceForScene(scene);assert.ok(p.gain>0&&p.gain<.3);assert.ok(p.lowpassHz>=200&&p.lowpassHz<1500);}});
test('forest, village and sanctuary soundscapes are distinct',()=>{assert.notDeepEqual(ambienceForScene('forest'),ambienceForScene('village'));assert.notDeepEqual(ambienceForScene('forest'),ambienceForScene('sanctuary'));});
