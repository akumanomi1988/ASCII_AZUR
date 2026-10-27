# v0.70.1 — Deterministic public startup readiness

## Reason for patch
The v0.70.0 main run **40564069723** passed 501/501 Node tests, Chromium, Android API 35 native APK and Chrome, and published the exact `c6fe46ad0c029b176f3ad976b19212cc7894f8d7` Pages build. The public desktop smoke passed. The mobile-width smoke failed because it sent a New Game click after `document.readyState === "complete"` but before confirming application event handlers were installed.

## Delivered
- The game marks the document with a small, read-only `data-azur-ready=true` flag only once the `AzurGame` constructor has finished registering its listeners and starting its loop.
- The public desktop/mobile acceptance waits for this explicit readiness alongside document completion and New Game presence before sending a real Chromium input sequence.
- Regression tests assert that the smoke cannot fall back to the previous DOM-only condition.
- No combat/AI/story/state/progression/graphics settings change. Existing v0.70.0 WebGL scene reuse and hardware-aware adaptive rendering remain present.
- Bumped standalone, PWA offline cache and user-visible patch to **0.70.1** to avoid mixed-version distribution across Pages caches.

## Acceptance required
- 501+ Node tests, TypeScript, complete campaign/save/audio simulation, Chromium render/touch acceptance, Android API 35 installed APK and Chrome.
- Main workflow publishes Pages and a real external Chromium smoke must PASS on both desktop and mobile-width viewports, including new game, starter, save, and continue.
- Physical Android ≥30 FPS sustained, thermals/battery and independent human sign-off remain entirely external. Frozen weighted roadmap: **21/32, 68.75%**.
