# ASCII AZUR — Native offline Android APK

This is a **separate installable Android shell**, not a rewrite of the browser
game. The bundled source is the same compiled TypeScript from the web release.
The game loads from the safe local HTTPS origin supported by
`WebViewAssetLoader`; no game server, login, camera, telemetry, or tracking.

## Build (JDK 17, Android SDK 35, Gradle 8.10.2, Node 22, Python 3)

```bash
npm ci --ignore-scripts
npm run build
python3 tools/stage-android-assets.py
gradle -p android :app:assembleDebug --no-daemon
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

The output APK is **debug-signed**, suitable only for sideloaded QA. CI attaches
the binary as an artifact only after the native app compiles and Android emulator
QA passes. There is no signing key, release signing, Play listing, or silent
store deployment. Production requires a dedicated protected keystore, verified
package identity, release policy and explicit approval.

## Platform behavior
- Local HTTPS origin `https://appassets.androidplatform.net/assets/` permits
  JavaScript ES modules and persistent WebView localStorage without `file://`.
- Main-page navigation is confined to bundled assets; external HTTP(S) links
  open the user's browser. All other resource URLs are denied.
- No file/content access from WebView. Android System File Picker handles
  `Import`; JSON exports use a bounded native `ACTION_CREATE_DOCUMENT`
  save dialog. Both are explicit user actions, never background uploads.
- `AzNative` is exposed only to the bundled offline game. No arbitrary file
  writes, no implicit cloud backup, and no sharing across the PWA origin.
- Native Android WebView retains the original WebGL2/Canvas2D selection. Hardware FPS remains subject to physical-device benchmarking.
- Android orientation changes do not recreate WebView, preserving game state;
  background/foreground pauses the viewport.
- **Web PWA and Android APK have distinct localStorage origins.** Export from
  one and import into the other; upgrades to the APK preserve its local save
  data, but uninstalling does not.

## Validation and limitations
A real APK must be built and tested on the CI emulator before claiming Android
completion. Verify boot, real native touch, storage persistence after restart,
airplane-mode offline launch, Import/Export with Android picker, orientation,
WebGL2/Canvas2D, and audio. The existing Chrome emulator acceptance is
separate from an installed APK. Physical low-end phone G4/U2/A3, signing,
distribution, and external usability acceptance remain open.
