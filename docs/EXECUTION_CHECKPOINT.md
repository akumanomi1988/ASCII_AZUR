# Engineering continuation checkpoint — 2026-10-27

## Baseline and planned release
- Stable main is v0.67.0. The new-game cinematic is proposed as v0.68.0, PR #52 (`feature/new-game-cinematic-intro`).
- Fixed commercial acceptance: **21/32 = 68.75% weighted** under `docs/AAA_ROADMAP.md`. No external/human milestone is implicitly accepted by this delivery.
- Keep the independent README redesign from main, the authored hero, and existing save-v1 and three-slot compatibility.

## Diagnosed engineering regressions
- Actions 40461641746: 490 of 491 Node tests passed. The CI contract still expected API `[30, 35]` while the current cost-conscious workflow uses one representative Android API 35; fixed the assertion rather than restoring excessive emulator matrices.
- Native Android APK tested new journey, cinematic skip, starter, dialogue, rotation and drawer successfully. The later SAF import tap stalled on CDP `Input.dispatchTouchEvent`. The native acceptance driver now uses real ADB OS touches for every API level and checks the click probe.
- Chromium browser acceptance had passed for the feature, but the full pull request is **not accepted** until current CI passes on the corrected source.

## Remaining actionable verification
1. Require green `verify`, `browser`, and `android-emulator` checks for the updated PR. Inspect logs and correct any further real failure.
2. Merge PR #52 only after checks pass, then verify the published main CI, `gh-pages` source commit and live public smoke.
3. Continue independent C4/P4 combat-collection balancing; W4/G4/U2 physical Android; N4/U4/G2 human narrative-usability-visual approval; A3/A4 real audio review; Q4 independent release approval. Reuse the fixed original criteria.

## Environment limits
GitHub connector has write access and provides Actions CI. The local sandbox is writable but cannot resolve `github.com` to clone/restore dependencies, so automated verification must be backed by actual CI evidence. Physical device, human sessions and signing remain external.
