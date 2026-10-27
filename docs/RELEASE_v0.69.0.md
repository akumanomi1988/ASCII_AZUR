# v0.69.0 — Deliberate combat and luminous menu navigation

## Integrated engineering
- Attacks run 1.68 seconds with wind-up, impact, two discrete injured-creature blinks and recovery. Healing, capture, guard, switches and faint reactions are longer and distinct.
- Actual HP is written and checkpointed immediately; an independent visual health timeline delays the visible health loss until impact and interpolates for 0.82 seconds. Amber warning below 45% HP, blinking red at or below 23%. ARIA health progress remains truthful.
- Player-to-enemy tempo is approximately 1.9 seconds with longer KO/capture/item beats. Enemy visual response locks action controls until the cue finishes. Reduced-motion shortens waiting, preserves feedback and suppresses decorative motion.
- Arrow keys/WASD navigate by actual screen-space button geometry across title, dialogs, drawer, choices and combat. Native form handling and Tab/Escape are preserved.
- Focus-selected controls glow with a mouse/keyboard-following bond-color orb and bounded trail. The orb is decorative, does not intercept events, and respects reduced motion.
- No new game rules, currency, rewards, save keys, network services or external packages.

## Release gates
- TypeScript build, all Node campaign/regression tests plus deterministic visual HP/direction checks.
- Chromium desktop/mobile and Android API 35 native shell acceptance, standalone/offline PWA asset closure, merged source and exact deployed public smoke.
- Human combat pacing review, art/legibility assessment, actual low-end Android heat/FPS and commercial QA still require independent human/physical-device evidence. Official 21/32 = 68.75% is not adjusted by code alone.
