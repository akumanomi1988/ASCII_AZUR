# ASCII AZUR v0.60.1 — Android-native browser acceptance and portrait title repair

## Delivered
- New GitHub Actions matrix running actual Google APIs x86_64 Android 11 (API30) and Android 15 (API35) emulators with the installed native Android Chrome.
- ADB and DevTools-based browser automation of campaign creation, real tap/joystick, accessibility settings, emulator screen orientation changes, game save resume after Android HOME, audio lifecycle including 160 rapid transitions, and memory/frame diagnostics.
- Screenshot, raw memory, report, boot diagnosis and failure log artifacts; no extra dependency on Python image/OCR packages.
- CI Pages release is now gated on both emulators succeeding, in addition to 438+ Node tests, full campaigns, Chromium and audio mastering.
- Portrait title screen no longer clips the Start button behind the sidebar on short Android Chrome viewports. Scrollable in-scene title UI and at least 44px touch targets.
- Offline PWA cache version and HTML banner incremented to v0.60.1 without changing v1 save format.

## Unclosed gates
Emulation does NOT satisfy A3 physical audio performance/mixing, G4 physical 30fps/thermal/battery, U2 actual touchscreen/rotation hardware, W4 human navigation, or Q4 independent release. Those remain open. Roadmap 21/32 and 68.75% remain unchanged.
See docs/ANDROID_EMULATOR_QA.md for reproducible CI evidence and limitations.
