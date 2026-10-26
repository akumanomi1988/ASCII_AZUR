import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';

function modules(dir){
 return readdirSync(dir).flatMap(name=>{
  const path=join(dir,name);
  return statSync(path).isDirectory()?modules(path):path.endsWith('.js')?[path]:[];
 });
}
test('Android 11 Chrome 83 uses an ES2020 syntax baseline',()=>{
 const config=JSON.parse(readFileSync('tsconfig.json','utf8'));
 assert.equal(config.compilerOptions.target,'ES2020');
});
test('browser bundles contain no ES2021 logical assignment operators',()=>{
 for(const file of modules('dist')){
  const contents=readFileSync(file,'utf8');
  for(const syntax of ['??=','||=','&&=']){
   assert.ok(!contents.includes(syntax),file+' retained incompatible '+syntax);
  }
 }
});
test('ES2022-only APIs are not used by shipped browser modules',()=>{
 for(const file of modules('dist')){
  const contents=readFileSync(file,'utf8');
  assert.ok(!contents.includes('Object.hasOwn('),file+' requires Chrome 93');
  assert.ok(!contents.includes('.at(-1)'),file+' requires Chrome 92 Array/String.at');
  assert.ok(!contents.includes('.replaceAll('),file+' requires Chrome 85 replaceAll');
 }
});
