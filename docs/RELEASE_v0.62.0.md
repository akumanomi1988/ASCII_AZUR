# v0.62.0 — Adaptive mobile GPU rendering and combat-exit performance evidence

A real POCO X5 5G first playthrough reported intermittent post-battle jank, especially in microscopic graphics. This observation motivates the work; its root cause has not been objectively verified with a GPU trace.

- WebGL2 adaptation physically reduces GPU backing-buffer pixels instead of just scaling glyphs. The pixel density factor is bounded (62–100% linear), and a buffer resize occurs only after adaptive controller changes. Artwork/graphics preferences and the Canvas2D fallback remain intact.
- Fine/microscopic graphics on a touch device use frame stabilization by default unless the player already made an explicit preference. The player retains control.
- The opt-in endurance laboratory now records synchronous work during victory/capture/defeat and the following 30 visible animation frames. Reports include backing pixel dimensions, preserving privacy (no device identity or background collection).
- Complete project regression, Android native Chrome, browser, offline and public Pages exact-source verification are required before production shipment.

This is engineering mitigation and diagnostic evidence, NOT a demonstrated fix on the reported physical phone. A fresh sustained >=30 FPS / thermal / battery physical-device measurement and independent testers are still required. Formal progress 21/32, weighted 68.75%.
