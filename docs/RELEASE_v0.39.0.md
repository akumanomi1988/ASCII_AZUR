# ASCII AZUR v0.39.0 — Save Integrity & Safe Import

## Goal

Protect player progress against stale browser tabs, partial or refused local writes, and import failures while retaining the version-1 save schema and deterministic world snapshots.

## Player-facing behavior

- A tab that resumed an older save can no longer silently replace progress written by another tab. The footer warns the player and recommends exporting current progress.
- Import validates its file and commits the replacement to storage **before** switching the active world. On a quota refusal or stale-tab conflict, the current game remains unchanged.
- An existing valid primary is never replaced if its backup cannot be written first.
- The existing in-game export is the escape hatch when storage is unavailable.
- Identical auto-saves do not churn the backup.

## Engineering and regression matrix

- `src/core/save-store.ts`: optional expected-primary conflict guard, fail-closed backup rotation, readback verification and primary/backup recovery.
- `src/main.ts`: session baseline lifecycle, cross-tab warning, safe import transaction and clear save-error status.
- `tests/save-store.test.mjs`: fresh/legacy save, backup rotation, corruption/oversize, read errors, invalid data, stale tabs, empty-slot races, quota/interruption, partial writes and 500 rotations.
- `tools/browser-acceptance.py`: actual Chromium save-conflict and import success/failure flows in both display modes and rendering backends.
- No new runtime dependencies or save-schema fields.

## Acceptance

- `npm run verify` PASS
- Browser matrix PASS, including new Q2 assertions
- Feature PR CI PASS, main CI PASS
- GitHub Pages source SHA and HTTP smoke PASS
- No regression to legacy v1 saves, chapter progression or PWA cache

These items must be marked verified only when evidence is available. Q2 roadmap milestone remains open until long-play and cross-device acceptance.
