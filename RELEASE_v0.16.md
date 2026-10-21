# ASCII AZUR v0.16.0 — Creature-specific battle direction

Status: implemented and locally verified; GitHub/Pages evidence is kept in `docs/AI_EVOLUTION_STATE.md`.

## Vertical slice

- Nine authored fighting signatures mapped to all twelve original creatures: pounce, spectral displacement, wingstorm, talons, stampede, riptide, thorns, antlers and quake.
- Distinct anticipation, strike, impact and recoil choreography, including mirrored enemy attacks and glyph-based elemental silhouettes.
- Turn order, move damage, existing AI, save schema, accessibility reduced-motion and microscopic glyph rendering unchanged.
- Added five deterministic tests for animation families, direction, bounded timelines, accessibility and invalid cues.
- Fixed standalone build identifier collision caught during local browser QA; all runtime tests pass after regeneration.

## Evidence and limitations

- `npm run verify`: 130/130 tests PASS, TypeScript build PASS, offline dependency audit PASS (26 JS modules reachable, 27 cached).
- `python3 tools/build-standalone.py`: succeeds, generates self-contained `play.html`.
- Chromium HTML standalone: new game, starter selection, dialogs, direct battle and attack PASS at 1180×740 desktop and 844×390 simulated mobile landscape; no JavaScript exceptions.
- Screenshots: `qa-v016-desktop-attack.png` and `qa-v016-landscape-attack.png` (local QA attachments, not shipped in GitHub sources).
- Unknown: real Android WebGL2 frame times, subjective game feel across all species, full campaign acceptance, public-URL interaction smoke.
- Historical game quality score remains 2.5/5 pending real-world evidence; this release does not meet premium completion criteria.
