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

## v0.70 performance engineering candidate
Branch `feature/mobile-render-budget-v070`: preallocated WebGL source texture + subimage uploads, adaptive low-hardware mobile hints respecting persisted user opt-out, testable 180-frame API contract, unchanged save/AI/audio. Verify main release and public source before claiming deployment. Frozen 21/32 = 68.75% until external hardware/human acceptance.

## v0.70.1 live public smoke startup race
Main v0.70.0 Actions 40564069723: 501 Node checks, Chromium and Android API 35 passed, Pages published source c6fe46ad; public desktop smoke passed but responsive mobile smoke tapped New Game immediately after HTML document.complete, before verified JavaScript application readiness. The new game exposes `document.documentElement.dataset.azurReady=true` only after constructor initialization; public smoke waits for this signal before attempting any input. This is a fail-closed user-interaction readiness gate, not a browser-performance timeout increase alone. Revalidate live source, desktop/mobile smoke after merged hotfix; commercial roadmap still 21/32.

## v0.71 — Coherent illustrated cinematic candidate
A player's complete browser playthrough identified the old 2-minute prologue as atmospheric but visually incoherent. Branch `feature/v071-storyboard-prologue` replaces symbol-only stage with ten connected in-engine authored SVG panels: recurring Arken village, a hooded traveler, the Archivist and canonical Cindrel/Velaria/Thorne with continuous path, Lumbre, shadows, pages and bond energy. Local CSS provides parallax, walking, hovering, breathing, luminous effects, deliberate fades and high-contrast/reduced-motion variants. No network resources or new dependencies. Full offline browser/Android CI, 120-second+skip/replay/save regression and exact Pages provenance pending. Fixed weighted roadmap 21/32 = 68.75% until independent art/narrative acceptance.

## v0.71.1 narrative accessibility — proposed
- Playback improvements for the existing ten-scene opening: pause/resume narration pace without changing the original two-minute auto-play duration, rewind to the current/previous scene, explicit keyboard arrows/P, paused animated SVG and accessible pressed state. Responsive five-button control grid guarantees 44px minimum touch height on narrow screens.
- Preserve intro skip, title replay, starter selection, save-v1 and all local/offline assets. Tests cover deterministic clock operations and real Chromium DOM interaction. One Android API 35 CI matrix only.
- Candidate release requires passing TypeScript, Node, browser, native APK/Chrome, Pages source provenance and public desktop/mobile smoke. G2/N4/U4 and physical/human gate statuses remain OPEN; original 21/32 (68.75%) is unchanged.
