# ASCII AZUR v0.59.0 — M4 integrated battle clarity and audio/UX polish

This release is an integrated M4 visual/audio/control legibility tranche, not a substitute for independent G2/G4/U2/U4/A2/A3/A4 signoff.

### Delivered
- **Persistent threat language in battle:** a severity-graded, text-first phase/guard/danger/readout separate from turn narration. It distinguishes charging from an imminent next-turn Eclipse, warns of low HP and second-phase danger, and shows guard state explicitly.
- **Accessible decisions:** the same forecast is announced by the existing nonvisual status channel. Its content does not rely on colour or movement and stays correct through save/reload because it is derived from checkpoint battle state. The Guard command receives a visible recommendation only when guarding can actually prevent an imminent charge.
- **Touch and compact-screen layouts:** a responsive 44px minimum for battle decisions, contrasting high-urgency presentation and bounded scrolling on small landscape screens; reduced-motion users receive the exact same textual signals with no forced animation.
- **Procedural encounter motif:** one bounded musical warning when a boss announces an imminent charged strike, plus a distinct final victory cadence. Both use existing audio synthesis, voice caps, pause/mute/device-safe mastering; no licensed/downloaded audio.
- **Performance-aware feedback:** retains the existing 30FPS-adaptive renderer, avoids animation-dependent signaling, and preserves the four render/backend routes (two graphics modes x WebGL2/Canvas2D) and save-v1 combat checkpoints.
- **Independent verification:** deterministic unit/runtime contracts, full TypeScript/standalone/Node campaign/afterlight/offline audits and synthetic-touch browser acceptance are CI requirements. Actual physical Android performance and expert audio/visual/usability review remain OPEN.

**Progress:** roadmap 20/32, 67.50% weighted. Implementation is not acceptance.
