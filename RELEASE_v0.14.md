# ASCII AZUR v0.14 — Character Silhouette Golden Slice

Released only after CI and Pages verify. Source of truth: `akumanomi1988/ASCII_AZUR`.

## Gameplay / art changes

- Four deliberately authored hero views: north/rear, east/profile, south/front, west/mirrored profile. Previously only a few face pixels differed.
- Deterministic walk steps, separately animated cloak and arms, lightweight idle pose and reduced-motion compliance. All draw commands remain processed by the ASCII renderer.
- Cindrel/Cinderwulf flame spines and split tail, Velaria flowing veil and lunar crown. Species-specific details follow existing animation parameters.
- Sparse tonal sampling in WebGL2 and Canvas2D to reduce clutter from flat ground while keeping edges and brighter objects visible. No topology/gameplay changes.
- Existing glyph density, scale, brightness, contrast and edge sliders continue to control the renderer.

## Acceptance evidence

- 123 automated tests pass, including new pose and legibility tests; production TypeScript compile and offline dependency audit PASS (25/25 cached JS modules).
- Legacy v0.13 encounter/settings QA PASS on desktop and both mobile orientations.
- New v0.14 browser checks: 4 distinct hero poses by pixel checksums, graphics settings and startup in desktop + mobile landscape; no JavaScript exceptions in Chromium software Canvas2D fallback.
- Android physical device GPU/WebGL2 performance and independent user-testing remain **NOT VERIFIED**.
- Existing v1 saved-game schema unmodified; restore tests executed in unit suite. No game progression changes.

## Known limitations

- Hero is a relatively small subject in the dense-glyph world; additional legibility and movement polish remain necessary.
- Fragment shader path compiled as part of TypeScript packaging but did not receive verified WebGL2 device rendering in the browser smoke tests.
- No new campaign chapter. Product is **not** production ready.
