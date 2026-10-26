# ASCII AZUR — Android emulator and in-browser audio QA

## Scope and provenance

This is a **real Android operating system emulator**, running the real Android Chrome app, not the old Linux Chromium mobile-viewport mock. It does not emulate physical heat, battery, speaker transfer, touchscreen sampling characteristics, or device-specific sustained FPS. The existing synthetic mobile viewport tests remain independent.

The GitHub Actions \`android-emulator\` matrix checks API 30 (Android 11) and API 35 (Android 15) on x86_64 Google APIs system images under KVM. The runner uses \`reactivecircus/android-emulator-runner@v2\`. Each job builds production TypeScript and serves the same \`index.html\`/ES modules used by GitHub Pages. Chrome DevTools is reached through ADB socket forwarding; game requests reach the local CI server through \`adb reverse\`.

## Automated acceptance journey

1. Start Chrome on Android, verify the device identifies as Android, create a save, select a starter, and advance opening dialogue using **Chrome Input.dispatchTouchEvent**, not hand-constructed DOM PointerEvents.
2. Drag and release the actual on-screen joystick through Chrome's touch pipeline. Open options, activate reduced motion and high contrast; verify native touch and persisted preference state.
3. Measure an in-browser Web Audio graph in Chrome with background/foreground music transitions, elemental effects, **160 rapid scene changes**, bounded voices/buses, pause/resume/mute, and disposal. Verify audio context really reaches the running state and resumes after a pause.
4. Switch emulator framebuffer from portrait to landscape and back via \`adb shell wm size\` and verify actual CSS orientation. This tests OS viewport resize, **not** accelerometer or a handheld device's motion sensor.
5. Record 40 browser animation frames and sample frame times. These are **emulated device diagnostic figures only**, not a pass claim for the minimum physical Android 30 FPS gate.
6. Use the Android HOME key, return to Chrome, reload the game, and verify a saved party/seed and contrast preferences persist.
7. Capture **portrait, landscape and resumed PNGs**, Chrome memory diagnostics (\`dumpsys meminfo\`), Chrome performance and Web Audio status in a machine-readable JSON report.

Each API produces an Actions artifact named \`ascii-azur-android-api-<API>-evidence\`. On failure the runner retains its partial report and Android logcat. Existing CI retains screenshots, full Node campaigns, audio WAV masters and save regression artifacts separately.

## Release gating and limitations

The production \`publish-pages\` job requires all of \`verify\`, \`browser\` and both \`android-emulator\` variants. Failing Android acceptance **blocks new production deployment**; the last validated \`gh-pages\` remains live. No bypass or \`continue-on-error\` is allowed.

**A3 remains OPEN** until Android **physical device** transitions, output routing, long-session performance and speaker/audio assessment are recorded, per the frozen \`docs/AAA_ROADMAP.md\`. In particular, emulator audio scheduling and simulated frame measurements are not evidence for physical thermal/battery/G4/U2. This automated step can detect numerous Android-only bugs and provide evidence that makes later physical signoff faster.

## Reproducing in an Android-capable environment

\`\`\`bash
npm install --ignore-scripts
npm run build
# Boot an Android 11/15 Google APIs x86_64 emulator with Chrome and KVM first:
ANDROID_API_LEVEL=35 node tools/android-emulator-acceptance.mjs
\`\`\`

No Android emulator or KVM is available in the local ChatGPT container; authoritative emulated results must come from the linked GitHub Actions runner. If the emulator provisioning itself fails, diagnose the workflow separately before claiming a gameplay regression.

CI host note: KVM acceleration is requested but some GitHub-hosted runners lack /dev/kvm. The emulator action selects software fallback when needed. Such results remain diagnostic and do not represent physical-device performance.

### Confirmed user-facing regression

Android 11 Chrome exposed a gameplay defect: CSS `100vh` exceeded its visible `innerHeight`, positioning the joystick outside Chrome and causing native OS taps to hit browser/system controls. The runtime now sizes the mobile stage from the smaller of `innerHeight` and `visualViewport.height`, refreshing it on viewport resize. Chrome 83 also silently ignored CSS `inset: 0`, leaving the fixed-position stage at its old flow offset (observed `y=73px`). The compact CSS now uses `top/left/right: 0` explicitly; the Android acceptance runner asserts its measured origin as well as joystick visibility. The acceptance runner asserts joystick visibility before native touches. Android 11 Chrome also exposed a clipped portrait title overlay that scrolled the outer page and left Start beneath the sidebar. The responsive CSS now makes the **intro itself scrollable** with 44px controls, and the Android 11 path drives real ADB OS taps calibrated to the on-device viewport. This avoids giving false credit to a DOM `.click()` on an unreachable button.
