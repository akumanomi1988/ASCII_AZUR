#!/usr/bin/env python3
"""Offline dependency audit: every static JS module required by the app is cached."""
from pathlib import Path
import re, json
root=Path(__file__).resolve().parent.parent
dist=root/'dist'
assert dist.joinpath('main.js').is_file(), 'Run npm run build first'
worker=(root/'sw.js').read_text()
listed=set(re.findall(r"'\./(dist/[^']+\.js)'",worker))
visited=set()

def walk(relative):
    relative=relative.as_posix()
    if relative in visited:return
    visited.add(relative)
    path=dist/relative
    if not path.is_file():raise RuntimeError(f'Compiled dependency missing: {relative}')
    js=path.read_text()
    for target in re.findall(r"\b(?:import|export)\s+(?:[^\n]*?\s+from\s+)?['\"](\.[^'\"]+\.js)['\"]",js):
        import posixpath
        dep=Path(posixpath.normpath(posixpath.join(relative.rsplit('/',1)[0] if '/' in relative else '.',target)))
        walk(dep)
walk(Path('main.js'))
missing={'dist/'+f for f in visited}-listed
assert not missing,f'PWA service worker missing imports: {sorted(missing)}'
assert all((root/item).exists() for item in listed), 'Missing worker cache asset'
package=json.loads((root/'package.json').read_text())
major,minor,*_=package['version'].split('.')
assert worker.count('ascii-azur-v0'+minor+'-q')==1, 'PWA cache version and package mismatch'
assert 'WORLD ENGINE v'+major+'.'+minor in (root/'index.html').read_text(), 'Visual version mismatch'
assert 'const CACHE=' in worker and "'./'" in worker
print(f'RELEASE AUDIT PASS · {len(visited)} JS modules reachable · {len(listed)} offline cached · version {package["version"]}')
