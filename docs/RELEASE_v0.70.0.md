# v0.70.0 — Mobile frame-pacing and WebGL scene upload

## Integrated engineering
- WebGL2 now allocates its fixed 960×540 source scene texture once during graphics initialization; every animation frame uses `texSubImage2D` rather than re-allocating with `texImage2D`. Output resolution, DPR and viewport scaling remain independent.
- Touch devices with credible low-performance hints (at most two logical cores, at most 2 GiB RAM, or at most four of both) default to reversible 1.4× adaptive glyph-cell scaling. Desktop and high-capability mobile keep the established presentation.
- The adaptive frame-pacing controller restores fine detail after sustained fast frames. Explicit user opt-out remains authoritative and persistent.
- The gameplay, combat timing, music, color/bond cursor, save v1 and original authored graphics configuration are unchanged. There are no new external dependencies or device identifiers collected.

## Acceptance gates
- Deterministic WebGL mock: exactly one texture allocation across 180 frames; no invalid texture dimensions accepted.
- New low-end/high-end/mobile/desktop/missing-capability cases, alongside existing adaptive and manual-control tests.
- Full TypeScript build and Node regressions, Chromium WebGL2 + Canvas2D modes, Android API 35 native + Chrome, offline standalone/PWA audit, Pages commit provenance and live public desktop/mobile resume checks.
- For comparison, v0.69.1 Android CI 40503670504 captured **40 emulated Chrome frames: 77.795 ms average, 136.1 ms p95**. This short and uncontrolled sample does not establish performance on a physical device.

## Commercial gates unchanged
The independently frozen roadmap remains **21/32 = 68.75% weighted**. G4 requires a named physical minimum device at sustained >=30 FPS during 30 minutes with thermal/battery evidence; C4, W4, N4, P4, G2, U2, U4, A3, A4 and Q4 retain their independent acceptance conditions.
