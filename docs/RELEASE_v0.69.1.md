# v0.69.1 — Continuous bond-cursor polish

## Delivered
- The original bond-colored cursor follows mouse movement continuously throughout each active menu, including gaps between buttons.
- Hovered buttons illuminate separately from keyboard focus; moving away removes hover without stealing keyboard selection or activating anything.
- Text editing keeps its native pointer, and leaving a menu or window clears the decorative cursor.
- Touch, reduced-motion settings, input pass-through, save v1, combat timing and gameplay mechanics remain unaffected.

## Acceptance
- Browser acceptance explicitly checks menu-gap continuity, hover cleanup, text-input preservation, leaving menu surfaces and non-intercepting pointer events.
- Full TypeScript/Node, Chromium, Android API 35, offline standalone, GitHub Pages source provenance and live public smoke are required before the patch can ship.
- No independent physical Android, external pacing or commercial acceptance milestones are claimed.
