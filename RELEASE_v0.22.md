# ASCII AZUR v0.22 — Capture tactics and transparency

## Player-facing improvement

Creature binding now displays the exact current chance (percent) directly in the combat action. This value responds to enemy HP, level advantage and active enemy status effects. Applying one or two *distinct, active* ailments earns +8 or +16 percentage points, capped by the existing 94% maximum. Failed binding still consumes one seal and grants the opponent a turn; Guardian encounters remain uncapturable. The accessible label states the probability and the risk.

The displayed chance and the actual random resolution call the **same** pure model (`combat/capture-odds.ts`). The previous baseline capture formula is preserved for creatures without status ailments. No saved-game schema changes, map regeneration, graphic profile changes or AI changes.

## Evidence and limitations

- TypeScript strict compilation and PWA import audit pass: 31 reachable JS modules / 32 cached assets.
- Node suite: 167/167 pass; includes six additional model/runtime tests over v0.21, covering baseline, status stacking/expiry, max probability, deterministic behavior and control feedback.
- Chromium self-contained HTML checked on desktop 1180×740, emulated touch landscape 844×390 and touch portrait 390×844: bound capture control, chance and accessible label visible, no script errors or viewport clipping.
- Pending real-world validation: Android GPU FPS, live public-origin HTTP smoke and independent player feedback. Quality score not increased without evidence.
