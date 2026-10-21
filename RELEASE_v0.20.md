# ASCII AZUR v0.20 — Optional stable-FPS glyph pacing

## Problem
The microscopic character renderer is intentionally dense and may deliver poor frame pacing on mobile and Canvas2D devices. Manual art settings must remain authoritative; changing player-selected tiny glyph density behind their back would be a regression.

## Implementation
- `AdaptiveGlyphs` provides an opt-in target of 30 FPS and applies a temporary, bounded 1.0–2.4x glyph-cell scaling factor. It does **not** change any settings stored in `ascii-azur-graphics-v2` or save-game v1.
- Uses rolling requestAnimationFrame interval samples (not real GPU timings). Checks at most every 1.8 seconds with 20+ samples; requires two slow windows to reduce density and three fast windows to restore detail. No adjustment during modal screens, visibility pause, or before gameplay.
- Adds accessible `FPS estables` checkbox to existing graphic settings, available via the mobile drawer. The choice is persisted in a separate key (`ascii-azur-adaptive-fps-v1`) and **defaults OFF** for maximum glyph detail.
- WebGL2 and Canvas2D both apply the temporary scale. The HUD shows AUTO and current factor while enabled; existing image/color parameters and all creature/world rules remain unchanged.
- Removes the factor instantly when the option is disabled. Does not claim to guarantee 30 FPS; bounded recovery still depends on hardware.

## Verified locally
- TypeScript build, generated standalone HTML, Node regression suite, and offline cache audit: PASS.
- Pure timing tests cover disabled state, slow-motion hysteresis, bounded scale, conservative restoration, and pause/invalid samples.
- Chromium desktop and simulated landscape mobile: setting accessible, enabled/disabled UI updates, separate preference write, no uncaught JavaScript errors.

## Open gates
- Physical Android WebGL2 / Canvas2D frame-times, temperature/battery and independent player usability remain unverified. The 30 FPS target is a target, not a guarantee.
- Full campaign, independent playtesting and premium quality criteria are incomplete.
