<div align="center">

  <a href="https://akumanomi1988.github.io/ASCII_AZUR/" title="Play ASCII AZUR">
    <img src="assets/icon.svg" width="96" height="96" alt="ASCII AZUR emblem" />
  </a>

  <p><strong>✦ A WORLD WRITTEN IN ASH ✦</strong></p>

  # ASCII AZUR
  ### THE UNWRITTEN

  **A dark-fantasy creature-bonding RPG, built from light, shadow, and glyphs.**

  Walk a world that remembers your choices. Bond with creatures. Uncover forgotten names.  
  Shape the final story—and keep exploring after the ending.

  <p>
    <a href="https://akumanomi1988.github.io/ASCII_AZUR/"><strong>▶ PLAY THE LIVE WEB BUILD</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#the-journey"><strong>DISCOVER THE GAME</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#run-locally"><strong>RUN LOCALLY</strong></a>
  </p>

  <p>
    <a href="https://github.com/akumanomi1988/ASCII_AZUR/actions/workflows/verify.yml"><img alt="GitHub Actions quality gates" src="https://github.com/akumanomi1988/ASCII_AZUR/actions/workflows/verify.yml/badge.svg?branch=main" /></a>
    <img alt="Current source version 0.67.0" src="https://img.shields.io/badge/version-v0.67.0-597a90?style=flat-square" />
    <img alt="Platform: web PWA and Android debug candidate" src="https://img.shields.io/badge/platform-Web%20PWA%20%7C%20Android%20candidate-314654?style=flat-square" />
    <img alt="Source: TypeScript" src="https://img.shields.io/badge/source-TypeScript-3178C6?style=flat-square" />
  </p>

  <sub>Playable web distribution · Native Android engineering candidate · Not a commercial/AAA release</sub>

</div>

---

## The journey

ASCII AZUR is a **single-player, offline-capable RPG** with persistent seeded exploration, original programmatic artwork and audio, a creature collection, and tactical turn-based combat.

| **Explore what remains** | **Decide what survives** |
|:--|:--|
| **Seven connected regions** with distinct atmospheric palettes, paths, landmarks, wandering witnesses and story gates. | **Three connected story chapters** with permanent decisions, four main-ending combinations and post-ending consequences. |
| **Visible and wild encounters**, recruitable creatures, a persistent Bestiary, field research and biome-aware hunts. | **Turn-based tactical combat** with elemental matchups, readable threat cues, technique loadouts, equipment and team preparation. |
| **Worlds worth returning to:** discovered sites, events, rewards and travel survive reloads. | **Three independent journeys** with separate seeds, local backups, controlled import/export and compatible version-1 saves. |

### From first spark to the unwritten ending

1. **Choose a world seed and a starting bond.** Each journey preserves its own explored world.
2. **Follow the Archivist's trail.** Travel through Arken and beyond, navigating physical landmarks, paths and encounters.
3. **Build a company.** Discover, capture, train and equip creatures; plan encounters rather than relying on endless grinding.
4. **Confront the guardians and the crypt.** Commit to irreversible story choices across the Marsh and Crown chapters.
5. **Return to the world.** Continue optional trails, field research, collection tiers and aftermath stories.

<details>
<summary><strong>What's new in v0.67 — field hunts and tactical recruitment</strong></summary>

The direct-duel board now draws its creature candidates from the currently accessible biome and chapter. It shows elemental roles, research status, party advice and capture capacity before entering the **existing** battle system. Locked future fauna stay hidden; Codex research can prepare a valid direct encounter. No separate currency, online requirement or save migration was introduced.

[Read the exact v0.67 release notes](docs/RELEASE_v0.67.0.md).

</details>

## See the world for yourself

<div align="center">
  <a href="https://akumanomi1988.github.io/ASCII_AZUR/">
    <img src="assets/icon.svg" width="54" height="54" alt="Play the current ASCII AZUR build" />
  </a>
  <p><strong>The authentic interactive preview is the game itself.</strong></p>
  <p><a href="https://akumanomi1988.github.io/ASCII_AZUR/">Launch the playable GitHub Pages build</a></p>
</div>

The renderer offers **Atmospheric ASCII** and **Glyph Pixel Art**, with **WebGL2** and a **Canvas2D fallback**. New players receive the glyph-based pixel presentation by default; returning players retain their saved graphics profile.

**Real screenshots, not invented mockups:** the browser acceptance workflow captures the shipped renderer into the <code>ascii-azur-renderer-evidence</code> artifact. Those CI screenshots are not yet checked into the repository, so this README does **not** mislabel a concept image as captured gameplay. [Open the workflow and its run artifacts](https://github.com/akumanomi1988/ASCII_AZUR/actions/workflows/verify.yml). Art-direction criteria and remaining visual sign-off are documented in [ART_DIRECTION.md](docs/ART_DIRECTION.md).

## Play the way you want

| | Web / installable PWA | Native Android candidate |
|:--|:--|:--|
| **Availability** | [Play in browser](https://akumanomi1988.github.io/ASCII_AZUR/) | Debug APK built from the same compiled TypeScript source |
| **Network** | Offline after a successful initial load / PWA install | Game assets bundled into the APK |
| **Controls** | Keyboard, mouse, mobile touch and virtual joystick | Android WebView and native touch |
| **Progress** | Local version-1 saves with three independent journeys | App-local storage; file import/export via Android picker |
| **Distribution** | GitHub Pages | **Engineering/QA only** — not release-signed or on Google Play |

**Controls:** WASD / arrows to move · **E** to interact · **T** for party · **B** for bag · Space / Enter for dialogue · on-screen joystick and action controls on mobile.

<details>
<summary><strong>Important: web and APK saves live in different storage origins</strong></summary>

A browser PWA save does not automatically appear in the Android WebView. Export the selected journey to JSON, then import it on the other platform. No cloud synchronization or account service is advertised. Android uninstalling may remove app-local progress. See [Android build and storage documentation](android/README.md).

</details>

## Under the hood

<div align="center">

**One gameplay codebase. Two delivery shells. No account or gameplay server.**

</div>

| System | Implementation |
|:--|:--|
| Game | TypeScript 5.8.3, compiled ES modules; local-first client-side rules |
| Rendering | WebGL2 with Canvas2D fallback; deterministic glyph / pixel composition |
| World and story | Seeded world generation, seven regions, chapter state and persistent story consequences |
| Combat and collection | Turn-based encounters, ability previews, persistent party, research and tactical relics |
| Sound | Original programmatic music/effects with dynamic scene transitions |
| Saves | Version-1 local persistence, backups, multi-journey slots and JSON import/export |
| Web | Static hosting, service worker, manifest and offline-capable PWA |
| Android | JDK 17 / Gradle 8.10.2 WebViewAssetLoader shell with bundled local assets and native file picker |
| QA | Node regression suite, Chromium integration, Android emulator API 30/35 and public-release provenance smoke |

Gameplay lives in <code>src/</code>. Compiled web modules live in <code>dist/</code>. The downloadable standalone <code>play.html</code> is **generated**, not edited or committed as source.

## Run locally

**Requirements:** Node.js 22, npm, Python 3 (CI uses Python 3.11). Install TypeScript through the repository's exact dependency specification.

~~~bash
git clone https://github.com/akumanomi1988/ASCII_AZUR.git
cd ASCII_AZUR
npm install --ignore-scripts --no-audit --no-fund
npm run verify
npm run serve
~~~

Open **http://localhost:8080/**. Use an HTTP origin rather than opening the game with <code>file://</code>, especially when testing the service worker and saved progress.

| Command | Outcome |
|:--|:--|
| <code>npm run build</code> | Compile <code>src/</code> into <code>dist/</code> |
| <code>npm test</code> | Run Node tests against compiled modules; build first after editing source |
| <code>npm run verify</code> | Build, master score, generate standalone HTML, run tests and audit release assets |
| <code>npm run serve</code> | Serve the project at port 8080 |
| <code>npm run release</code> | Produce verified standalone and source release bundles |

For an **installable Android debug APK**, follow [android/README.md](android/README.md); Android SDK 35 and the documented Gradle setup are required. This is not a signed production release.

## Quality is a gate, not a badge

The formal roadmap currently has **21 of 32 weighted milestones accepted (68.75%)**. That is a *project acceptance measure*, **not** a claim that the game is 68.75% of AAA quality. Successful automated CI and emulator tests do not prove physical-device performance or player satisfaction.

**Still open:** low-end physical Android FPS / thermal / battery measurements; independent touch and navigation playtests; creature-collection/balance acceptance; independent visual and audio review; distribution signing and commercial product acceptance.

Read the [full roadmap and milestone evidence](docs/AAA_ROADMAP.md), [physical Android acceptance protocol](docs/ANDROID_RELEASE_ACCEPTANCE.md), [public deployment verification](docs/PUBLIC_RELEASE_SMOKE.md) and [test tasks](docs/WORLD_PLAYTEST_TASKS.md).

## Documentation

| Explore | Engineering and delivery |
|:--|:--|
| [Art direction](docs/ART_DIRECTION.md) | [Architecture](docs/ARCHITECTURE.md) |
| [AAA roadmap and gates](docs/AAA_ROADMAP.md) | [Native Android APK](android/README.md) |
| [v0.67 release notes](docs/RELEASE_v0.67.0.md) | [Android emulator evidence](docs/ANDROID_EMULATOR_QA.md) |
| [World playtest tasks](docs/WORLD_PLAYTEST_TASKS.md) | [Public Pages smoke test](docs/PUBLIC_RELEASE_SMOKE.md) |
| [Story and gameplay evolution](docs/AI_EVOLUTION_STATE.md) | [Release acceptance evidence](docs/RELEASE_ACCEPTANCE_EVIDENCE.md) |

<details>
<summary><strong>Historical releases and detailed changelog</strong></summary>

The previous README accumulated feature-level notes from early versions through v0.67. That documentation has been preserved, unchanged, as the [historical README archive](docs/README_HISTORY_v0.67.0.md); the detailed release records remain in <code>docs/</code> and the repository's earlier <code>RELEASE_*.md</code> files.

</details>

---

<div align="center">
  <p><strong>ASCII AZUR — THE UNWRITTEN</strong></p>
  <p><em>When the world forgets its last name, who will remember yours?</em></p>
  <p><a href="https://akumanomi1988.github.io/ASCII_AZUR/">Enter Azur</a> · <a href="https://github.com/akumanomi1988/ASCII_AZUR/issues">Issues and feedback</a> · <a href="https://github.com/akumanomi1988/ASCII_AZUR/actions/workflows/verify.yml">Build evidence</a></p>
  <sub>© 2026 ASCII AZUR. An original independent project.</sub>
</div>
