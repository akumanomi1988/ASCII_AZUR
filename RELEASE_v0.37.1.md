# ASCII AZUR v0.37.1 — Legacy World Snapshot Continuity

Follow-up release for the complete v0.37 Afterlight Pilgrimage.

## Player impact
A player resuming a v1 save created before the Ossuary and Garden existed now retains every original terrain byte while immediately persisting both newly generated regions and their landmarks. Subsequent resumes reuse exactly that expanded snapshot; the new pilgrimage no longer depends on future generator implementation details.

## Integration
- No save schema bump, no deletion or reroll of prior region state.
- Seeded 3/4/5-zone saves acquire missing zones once on resume, backed by the existing validated primary/backup rotation.
- Complete seven-zone saves avoid redundant snapshot rewrites.
- Standalone package, offline cache key and visible version identify v0.37.1.
- Chromium regression constructs a historical five-zone save, continues it twice, compares original terrain and checks complete new-region snapshot persistence in ASCII/Pixel and WebGL2/Canvas2D.

## Acceptance
TypeScript, Node regression suite, standalone/PWA release audit, 32 browser screenshots, actual DOM continue/resume and main/Pages exact-source provenance must all pass. Physical Android, human art and overall premium quality remain unverified.
