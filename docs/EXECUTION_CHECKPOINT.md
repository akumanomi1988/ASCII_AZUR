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

## v0.68 native regression follow-up
- PR run 40467809790: browser succeeded. Native Android's OS-only tap implementation reached new-game, dialogue, rotation and resume but failed to open the export DocumentsUI picker after touching `#exportBtn`.
- Proven previous run 40461641746 opened the export picker via CDP, but froze at `Input.dispatchTouchEvent` for `#importBtn`. Use CDP for the proven normal API 35 WebView controls and actual Android OS taps for SAF **import**, checking the system DocumentsUI activity rather than depending on CDP while the application is backgrounded. Recheck before merging.

## v0.69 candidate (2026-10-27)
Feature branch feature/v069-combat-pacing-menu-light carries slower combat reactions, delayed visual HP, low-health warnings and spatial keyboard/glowing bond focus. The authoritative save format is unchanged. CI, Pages source provenance and human acceptance pending; frozen progress remains 21/32 = 68.75%.

## v0.69.1 continuity polish — candidate
- Visual focus orb follows mouse across whole active menus, retains individual hover glow and native text caret. No gameplay/JSON format changes.
- Confirm TypeScript, Node, desktop/mobile browser, Android API 35 and exact deployed-source verification before release. Official 21/32 = 68.75% remains unchanged.

### Native DocumentsUI regression recovery (v0.69.1)
- CI 40498917862 passed Node + Chromium. Android native APK reached SAF import but surfaced the previous export SAVE dialog; this is not evidence of gameplay/data loss.
- The native acceptance driver now checks the system's focused/resumed activity and accessibility tree after export, and uses bounded real Android Back events until the app is foregrounded. It refuses to continue with the import while export DocumentsUI remains active.
- Re-run native APK JSON export/import and full CI before merge. Commercial/human QA percentage remains unchanged.

### Android stale accessibility hierarchy correction
- CI 40500037773 shows native `topResumedActivity=AZUR` while UIAutomator still displayed export `SAVE`. The previous bounded retry issued another `Back`, leaving the game for Launcher. The updated driver now waits when AZUR is resumed, refreshes the game activity only after repeated stale readings and reserves Back solely for genuinely foregrounded external activities. Final approval still requires a clean native import replay.

### Android acceptance verified 2026-10-27
- CI 40501006762: Android APK 19 checks PASS, real SAF JSON export/import and replace-dialog PASS; Android Chrome 27 checks PASS. Chromium browser PASS. Node suite 497/498 PASS: sole failure was a stale test assertion matching the old helper expression; this test is corrected here without modifying runtime/gameplay code. Full required CI must pass on this test-only revision before merge.
