# v0.52.0 — Creature identity, turn commands and crypt stakes

## Integrated scope

This macroiteration combines the authorized campaign/progression pass and lightweight equipment with the subsequent request for individual stats, permanent crypt losses and classic turn-based commands. It changes existing systems instead of adding a crafting, affix, breeding or ATB framework.

### Creature identity and progression

- New creatures receive persistent HP/attack/defense/speed potential in the inclusive range 0..31. Each attribute scales its species-and-level baseline by `1 + (potential - 16) * .004`, rounded to an integer. The small range preserves species roles; an optimal roll is not required to finish the campaign.
- Potential derives deterministically from the already-generated UID without consuming additional gameplay RNG. Capture keeps the encountered individual; reload and evolution never reroll it. Legacy creatures without the field use neutral 16, rather than receiving a hidden new lottery.
- The team sheet shows current stats, species/level minimum and maximum, individual potential, equipped relic and permanent principal identity. Speed influences the explicitly disclosed escape probability; this remains a turn-based system, not ATB.
- Learned techniques form a permanent repertoire. Level-up/evolution can fill empty active slots but never overwrite a player's equipped moves. At most four active techniques can be changed free of charge outside combat. At least one damaging technique must remain active when editing the loadout.
- Cindrel's base HP/defense change 37/10 → 40/11. Velaria's HP/attack/defense change 40/12/12 → 43/13/14. Thorne retains its tank identity. Restorative techniques improve modestly but each creature has three restorative casts per battle; charges persist in checkpoints and switching/reload cannot refresh them.

### Lightweight equipment and economy

One relic slot per creature; six fixed original relics, no random affixes or crafting:

| Relic | Effect | Price |
|---|---|---:|
| Colmillo de Ascua | +12% Ash move damage | 60 Echoes |
| Perla de Bruma | +12% Mist move damage | 60 Echoes |
| Nudo de Raíz | +12% Root move damage | 60 Echoes |
| Prisma del Eco | +12% Ether move damage | 60 Echoes |
| Amparo del Peregrino | -10% incoming attack damage; excludes scorch | 45 Echoes |
| Cuenta de Lumbre | +20% technique/drain/tonic recovery; never revives | 55 Echoes |

Mara offers a once-only introductory ward and sells copies. Each region's chest grants one finite relic reward; old opened chests can provide that new reward once without repeating old money or consumables. Ownership includes equipped copies across team and reserve, capped at six per type; equip/unequip cannot duplicate items. Relics survive evolution/reserve transfer and cannot be changed during combat. A deceased companion's relic becomes free inventory again.

Damage forecasts, actual combat and AI evaluate the same relic-aware damage rules. Healing does not deal chip damage or consume offensive debuffs; drain recovers from actual HP removed, not overkill. Full-health tonics and unlearned move commands are refused. Existing consumable and chest reward caps are enforced.

### Crypt mortality

- The principal is the original starter UID, independent of current leader ordering. New saves establish it at starter choice; legacy saves establish the current first party member once on resume. It cannot be deposited or swapped into reserve.
- A non-principal creature reduced to zero HP by an enemy or self-scorch inside the active crypt is removed from the party and recorded in a persistent memorial. Neither ordinary healing, battle victory, defeat recovery nor normal reload restores it. Pre-existing fainted creatures are not retroactively killed just for entering.
- The principal can faint but never dies permanently. If no conscious creature remains, the party returns to Arken, preserving crypt progress and companion deaths, and the principal recovers. Outside the crypt, fainting remains recoverable.
- Casualty removal, battle index/status cleanup and pending resolution share the existing save checkpoint. The last-companion/principal-already-down case must remain a valid reloadable pending-defeat save.
- Entry UI explains the irreversible rule before the player selects Enter. Team details distinguish the principal and show the memorial. The local save/export system is not represented as tamper-proof against deliberately restoring an older external file.

### Classic commands and accessible control

Four top-level commands: Techniques, Items, Companions, Guard. Techniques shows a stable 2×2 layout of the four active slots, including disabled empty slots, plus Back. Items contains capture seals, tonics and escape. Entering/leaving a submenu never spends a turn. Executing a technique/item/guard/switch follows the same checkpointed action path as before.

Directional keyboard and D-pad input follows actual grid positions, skipping disabled cells without compacting the grid. Enter/A confirms and Escape/B returns. Touch uses the same real buttons. Read-only guidance is based on equipped techniques, healing charges, effects and enemy charge state. Resume explicitly clears any stale prior battle UI before restoring a checkpoint.

### Local playtest evidence

Bounded optional journey counters record battles, outcomes, commands, consumable use, rests and spending. The journal exports a JSON report by an explicit local download, with no network telemetry or personal identity. Mid-campaign legacy counters clearly identify that they started after introduction. Read-only menus never award resources or advance counters.

## Verification gates

- Pure and runtime checks: ownership/caps/no duplication; invalid imports; legacy defaults; evolution/reserve/reload; healing/status/drain behavior; fixed primary identity; permanent loss from real enemy turns; total wipe; normal-world fainting; learned/active repertoire; two-dimensional navigation; local report invariants.
- The existing physical new-game-to-finale Q3 driver is shared with a new 50-world × 3-starter matrix (150 journeys, 450 chapter reloads). Half the seeds use an offensive no-relic policy; half use the tactical policy with only Mara's legitimately claimed ward. No XP, money, wins, captures or story flags are injected. Policies activate only legitimately learned techniques, can buy seals with earned Echoes, and can recruit replacement witnesses after crypt casualties. Budgets are fixed at at most 18 tonics, 180 player commands and two recoverable optional-preparation defeats per complete journey. Defeats are reported, not hidden; mandatory route/boss failures cannot be bypassed because actual physical progression and earned flags are asserted. A recoverable defeat is not a campaign softlock or a player-quality approval. Isolated unit/browser fixtures are reported separately.
- Real Chromium: actual shop/gift/equip/unequip, stat ranges, four active slots, command/submenu grid, real pending enemy turn killing a crypt companion and post-loss reload, alongside all previous backend/mode, save, world and accessibility acceptance.
- TypeScript, standalone, offline dependency audit, main CI and Pages exact source provenance must pass. Public HTTP smoke and physical Android remain separate evidence.

Results and publication evidence are appended to `docs/AI_EVOLUTION_STATE.md` only after observed execution. Existing 32 fixed milestone definitions and weights remain unchanged; these implementations alone do not certify independent human C4/P4, U4 or physical-device gates.


## Observed final code acceptance — 2026-10-24

| Gate | Observed result |
|---|---|
| Complete main TypeScript/Node/standalone/offline/release suite | **346/346 PASS**, 51 reachable JS modules / 54 cached assets |
| New physical campaign matrix | **150/150 complete journeys**, 50 distinct saved worlds × three starters, 450 chapter reloads |
| Existing C3 and four-ending Q3 regressions | PASS, actual captures/experience/turns and crypt movement |
| Real Chromium source acceptance | PASS, ASCII/Pixel × WebGL2/Canvas2D, 32 biome/combat canvas captures, plus relic/stat/command/permadeath DOM checks |
| Main quality and gated distribution publication | SUCCESS, run `40080264568`, source `ea85f86a71d0a83b029a05021df8e060e843adc6` |
| Exact distribution provenance | `fb673242c9fb81184b9e8b8f17fd6d1cdab4ef5e` names the exact verified source above |

### Campaign policy results

These are deterministic simulated-player runs, not human approval. Each row uses 25 worlds. Only the tactical policy uses the introductory ward. Both policies use legitimately learned techniques and actual player commands; no rewards/wins/resources are injected.

| Starter | Policy | Completions | Preparation defeats, total | Maximum tonics used | Final level range |
|---|---|---:|---:|---:|---|
| Cindrel | Offense | 25/25 | 2 | 12 | 15–17 |
| Cindrel | Tactical + ward | 25/25 | 0 | 4 | 16–18 |
| Velaria | Offense | 25/25 | 0 | 12 | 16–18 |
| Velaria | Tactical + ward | 25/25 | 0 | 5 | 16–18 |
| Thorne | Offense | 25/25 | 0 | 12 | 14–16 |
| Thorne | Tactical + ward | 25/25 | 0 | 1 | 15–17 |

Two policies are assigned to different seed cohorts, so their consumable totals are not a controlled causal estimate of the ward or strategy benefit. No human-balance score is inferred. The fixed roadmap remains 67.50% until its independent/hardware gates close.


### Observed publication

[Pages deployment 40080606243](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/40080606243) **SUCCESS**. Public cloud-browser boot on `https://akumanomi1988.github.io/ASCII_AZUR/` visibly loaded **WORLD ENGINE v0.52.0**, title controls and the campaign-slot summary after reload. Exact distribution source provenance was independently read through GitHub. This follow-up changes documentation only and intentionally skips a redundant CI build; the playable source remains `ea85f86a71d0a83b029a05021df8e060e843adc6`.
