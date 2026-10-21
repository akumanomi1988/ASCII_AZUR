#!/usr/bin/env python3
"""Build a reproducible source+playable ZIP and copy a one-file demo."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED,ZipInfo
import shutil, json
root=Path(__file__).resolve().parent.parent
release=root/'release';release.mkdir(exist_ok=True)
ver=json.loads((root/'package.json').read_text())['version']
play=release/f'ASCII_AZUR_v{ver}_JUGAR.html';shutil.copy2(root/'play.html',play)
archive=release/f'ASCII_AZUR_v{ver}_FUENTES.zip'
folders=('src/','dist/','tests/','tools/','.github/','assets/','docs/')
roots=('README.md','package.json','tsconfig.json','index.html','style.css','sw.js','manifest.webmanifest','.gitignore','play.html','RELEASE_v0.11.md')
files=sorted([f for f in root.rglob('*') if f.is_file() and f.relative_to(root).as_posix().startswith(folders) and '__pycache__' not in f.parts and f.suffix!='.pyc'] + [root/name for name in roots if (root/name).exists()]+[f for f in root.glob('RELEASE_v0.12.md')])
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=8) as z:
    for f in files:
        info=ZipInfo('ASCII_AZUR/'+f.relative_to(root).as_posix(),date_time=(2026,1,1,0,0,0))
        info.compress_type=ZIP_DEFLATED;info.external_attr=0o644<<16
        z.writestr(info,f.read_bytes())
print(f'RELEASE READY: {play.name} ({play.stat().st_size} bytes); {archive.name} ({archive.stat().st_size} bytes); {len(files)} sources')
