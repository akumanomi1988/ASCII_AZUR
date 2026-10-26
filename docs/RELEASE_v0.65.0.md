# v0.65.0 — Living consequences of the trilogy

## End-to-end player flow
1. Complete Arken, decide KEEP/RELEASE in the Marsh, and REMEMBER/RENEW in the Crown through ordinary world and boss interactions.
2. The Diary displays the optional **Testimony of Arken** epilogue, including the earned branch's aftermath. Pre-completion saves show no branch, hidden lore or future spoilers.
3. Return physically to the Archivist in Arken (the existing position and reachability). He presents three connected scenes: Iria and Arken's people, Nael and the Marsh Atlas, and Oriel and the Crown's Telar.
4. Confirm the testimony once. The saved result is a durable v1 flag and one owned, combat-effective existing relic: KEEP+REMEMBER → Echo Prism; KEEP+RENEW → Ember Tooth; RELEASE+REMEMBER → Pilgrim Ward; RELEASE+RENEW → Hearth Bead. The reward is manually equipped via Team → Relics; it affects existing combat damage, defense, or healing rules.
5. Existing owned-copy limits apply. An already capped branch relic falls back deterministically to a free existing relic. A collector with every relic at its six-copy cap may still finish the story with no item duplication.
6. The existing Chronicle appends the earned closure to the Crown chapter. It can be re-read without changing flags or granting further resources. Returning to the Archivist later never produces additional items.

## Safety and scope
- No schema migration, new zones, new enemies, grind walls, new mandatory goals, asset downloads, network calls or telemetry. Existing four ending branches and two Afterlight chapters remain intact.
- Save transaction is prepared purely and committed through the game's CAS-based write before live state changes; stale-tab/write failure retains the live save and leaves the testimony unclaimed.
- Invalid, premature or contradictory choice combinations fail closed. Claim is refused in combat, crypt, expedition or with a full 200-flag set. Saved rewards use existing validated stock and never invent new equipment IDs.
- Optional Diary preview is available from any location; durable claim requires proximity to the physically reachable Archivist.
- New v0.65.0 package, header, service-worker cache and module release key ensure offline ESM update coherence.

## Evidence required
Feature and main CI must cover TypeScript, Node, 150 scripted campaign runs, 450 reloads, existing Afterlight walkthroughs, Chromium ASCII/Glyph Pixel × WebGL2/Canvas2D, responsive mobile, Android emulators API 30/35, PWA audit and public exact-source smoke. The new deterministic tests cover all four branches, real saved relic awards, inventory caps, invalid states, Chronicle continuity, and UI/physical NPC interaction.

## Fixed acceptance
Roadmap definitions and weights are unchanged. **21/32 official milestones = 68.75% weighted** before and after implementation. N4 independent narrative/pacing acceptance, physical Android evaluation and the other externally dependent gates are still open. Passing automation is technical implementation evidence, not commercial quality certification.
