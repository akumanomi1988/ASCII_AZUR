# v0.71.1 — Readable, player-paced opening

## Delivered
The existing ten-panel illustrated 120-second prologue can now be paused, resumed and rewound without losing the scene text, illustration or the selected save slot. The auto-play path still takes exactly 120 seconds. Returning to a previous panel resets that panel's locally authored SVG animation. Players can hold a scene for as long as needed to read or use assistive technology.

Controls remain visible over the cinematic: **Back, Previous, Pause/Resume, Skip, Next**. Left/Right arrows move between panels, **P** toggles playback and **Escape** returns to the title screen. Keyboard Tab navigation remains trapped within the five real buttons. Pause is exposed with `aria-pressed`, the current narration is announced by the original live region, and the animation-play-state freezes SVG motion without removing the image. On narrow/landscape phones, a two-row grid keeps every tap target at least 44 CSS pixels tall and separates the controls from the caption.

## Integrity and compatibility
No quest flag, save schema, battle logic, audio synthesis or world seed changed. Existing title replay, skip-to-starter and browser/Android packaging are preserved. Updated version `0.71.1`, cache name and release query pin keep old and new offline modules separate.

## Automated acceptance to verify
- TypeScript compilation, offline build, release audit and full Node tests.
- Deterministic playback clock: pause, resume, previous, boundary, 120-second duration and invalid delta.
- Chromium illustrated prologue controls and keyboard, without skipping starter/gameplay regression.
- Single Android API 35 native APK/Chrome CI, release Pages exact source and public desktop/mobile smoke.

## External release gates still open
The pre-existing C4, W4, N4, P4, G2, G4, U2, U4, A3, A4, Q4 require independent human/real-device evidence. No milestone is declared accepted by additional playback controls. Frozen weighted roadmap remains 21/32 (68.75%).
