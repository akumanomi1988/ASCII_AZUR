#!/usr/bin/env python3
"""Stage the exact TS-built static game for the offline APK. No network or secrets."""
from pathlib import Path
import hashlib
import json
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / 'android/app/src/main/assets'
SOURCES = ('index.html', 'style.css', 'sw.js', 'manifest.webmanifest', 'assets/icon.svg')
def stage():
    package = json.loads((ROOT / 'package.json').read_text())
    version = package['version']
    source = (ROOT / 'index.html').read_text(encoding='utf-8')
    assert f'WORLD ENGINE v{version}' in source, 'Build version differs from current source'
    assert '<script type="module" src="dist/main.js"></script>' in source
    modules = list((ROOT / 'dist').rglob('*.js'))
    assert len(modules) > 25, 'Compile TypeScript with npm run build first'
    assert all(p.is_file() and not p.is_symlink() for p in modules)
    for p in SOURCES:
        assert (ROOT / p).is_file(), 'Missing bundled asset: ' + p
    if TARGET.exists(): shutil.rmtree(TARGET)
    TARGET.mkdir(parents=True)
    for p in SOURCES:
        dst = TARGET / p
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / p, dst)
    shutil.copytree(ROOT / 'dist', TARGET / 'dist')
    js = (ROOT / 'android/native-bridge.js').read_text(encoding='utf-8')
    (TARGET / 'native-bridge.js').write_text(js, encoding='utf-8')
    html = source.replace('<script type="module" src="dist/main.js"></script>',
        '<script src="native-bridge.js"></script><script type="module" src="dist/main.js"></script>')
    assert html != source, 'Native export adapter missing'
    (TARGET / 'index.html').write_text(html, encoding='utf-8')
    digest = hashlib.sha256((TARGET / 'dist/main.js').read_bytes()).hexdigest()
    manifest = {'schema':'ascii-azur-android-package-v1','version':version,
        'main_sha256':digest,'js_modules':len(modules),'offline':True,
        'asset_origin':'https://appassets.androidplatform.net/assets/'}
    (TARGET / 'package-info.json').write_text(json.dumps(manifest,indent=2)+'\n')
    assert len(list((TARGET / 'dist').rglob('*.js'))) == len(modules)
    print('ANDROID_STAGE_PASS '+json.dumps(manifest))
if __name__ == '__main__': stage()
