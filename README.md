# ASCII AZUR v0.67.0 — The Unwritten

> **v0.67 — Field Hunt tactical preparation:** the old one-click Duel menu becomes an integrated research/capture loop: eligible fauna follows the same chapter-aware biome as natural encounters; earlier Marsh/Spire travel keeps viable Sanctuary transition battles without prematurely revealing late fauna; each live wild challenge provides a combat-derived tactical briefing, alternate starting-ally selection, saved Codex sighting, capture progress and research link. No new currencies, saves or online systems. See docs/RELEASE_v0.67.0.md.


> **v0.66 — Pilgrim's Field Trails:** seven authored three-act regional paths translate existing physical NPC/memory/rune/witness/guardian encounters into a visible optional route, fog-safe next-act tracking, permanent one-time relic equipment, and a region-specific story recognition claimed at a visited Lumbre. Progress is derived from existing save-v1 events; no new regions, currency, grind or required objectives. See docs/RELEASE_v0.66.0.md.


> **v0.65 — Living trilogy consequences:** each complete Marsh × Crown ending can be witnessed at Arken's physical Archivist as an optional, permanent story closure with four different tactical relic outcomes. A fog-safe diary lead, persistent Chronicle closure, live NPC scenes and CAS-safe one-time reward join the established save-v1 world. See docs/RELEASE_v0.65.0.md.


> **v0.64 — Collection with tactical purpose:** four finite collection tiers now reward equippable combat relics. The Codex recommends known uncaught creatures in accessible habitats and opens the field journal. Save-v1 compatibility and cache-safe offline updates are preserved. See docs/RELEASE_v0.64.0.md.


> **v0.53 — The connected pilgrimage:** regional field objectives and finite recognitions, persistent cross-region tracking, visited-Lumbre travel, completed-site Atlas markers, and full keeper-epilogue continuity after the main ending. Travel cannot bypass undiscovered destinations, story gates, crypts or expeditions, and commits storage before moving the party. See `docs/RELEASE_v0.53.0.md`.

> **v0.52 — Creature identity and classic turn commands:** persistent bounded individual stats, a permanent learned repertoire with four swappable active techniques, six one-slot relics from Mara/chests, permanent non-principal crypt casualties with a memorial, two-dimensional battle submenus, and exportable local journey metrics. The original starter remains protected even after changing leaders. See `docs/RELEASE_v0.52.0.md` and the five-block closure plan.

> **v0.51 — Continuous score:** bounded scene crossfades and voice allocation, music phrase continuity after combat, shared effect ducking, safe background/mute/resume lifecycle, and explicit audio graph cleanup. Automated acceptance is distinct from physical-device performance and independent listening approval. See `docs/RELEASE_v0.51.0.md`.

> **v0.49 candidate — Authored world landmarks:** six interactive pixel silhouettes, seven biome palettes, neighbor-connected stepped path edges and a punctuation-only Atmospheric ASCII micro-glyph ramp remove pseudo-text on terrain. Four renderer/backend checks and independent visual acceptance remain separate gates.

> **v0.45 released — Glyph Pixel Art fallback clarity:** Canvas2D now composites a contiguous semantic pixel scene at a bounded 192–480-pixel internal width, preserving full actor and landmark silhouettes rather than reducing each to oversized abstract glyph cells. Sparse foreground glyph accents appear only at meaningful high-contrast edges. This avoids a full output-sized software ImageData write each frame. The original Atmospheric ASCII path, world topology, gameplay and save format are untouched. Automated browser/Node CI and Pages provenance have passed; real minimum Android hardware evaluation remains outstanding.

> **v0.43 candidate — autonomous reliability and accessibility:** resilient backup confirmation before primary rotation, 9,000 fault-injected multi-slot save operations, legacy three-region snapshot upgrade checks, keyboard focus recovery across narrative screens and combat, semantic HP meters, spoken narrative updates, and correctly exposed mute/notification states. This advances implementation evidence only; external device/user acceptance is still required.

> **v0.42 candidate — Glyph Pixel Art clarity:** 90%+ fewer decorative route marks, neutral negative-space around important landmarks, quieter soil/water/grass, five-bit contiguous-cell pixel color, and reduced random glyphs on flat surfaces. Both WebGL2 and Canvas2D use matching material thresholds. Canvas2D first-run starts with adaptive glyph pacing while honoring saved preferences. Visual acceptance and real Android performance remain open.

> **v0.41 candidate — three independent persistent campaigns:** choose any of three seed-isolated adventures from the title screen, view a live summary of each, safely return to journey selection, and import/export the selected adventure. Legacy localStorage keys and saves remain in slot I. All slots maintain independent backups and conflict protection.

> **v0.40 candidate — accessibility and adaptive score:** keyboard skip link, screen-reader game-state narration, persistent high-contrast theme, zoom support, adaptive battle-music mix and deterministic score tests. Human accessibility/audio acceptance and physical Android benchmarking remain open.

RPG de captura de criaturas y fantasía oscura, con mundo ASCII generado mediante WebGL2 (fallback Canvas2D), exploración procedural persistente y una cripta física de ocho cámaras. Android horizontal es la plataforma prioritaria; navegador web es el entorno de desarrollo y distribución actual.


> **v0.46 candidate — Atlas wayfinding and seven-region traversal QA:** Discovered landmarks can now be selected from the in-game Atlas as temporary destinations. The story compass gives collision-aware walking directions, and the map draws only already revealed route segments. A deterministic 200-saved-seed test checks paths to every authored landmark and roaming witness across all seven regions, with swept-movement samples. These gates do not replace human mobile acceptance.

## v0.47.0 — Investigación de vínculos

El Bestiario conserva los avistamientos obtenidos al entrar en combate y registra vínculos a través de capturas, criaturas del equipo y reserva, y evoluciones futuras. Cada criatura muestra pistas de los hábitats donde puede encontrarse; las especies no identificadas conservan su identidad oculta. Cuatro hitos de colección (3, 7, 12 y 17 especies distintas) ofrecen recursos y Ecos limitados, reclamables exactamente una vez por campaña y sin modificar las reglas base de combate ni el formato de guardado v1. Los guardianes no cuentan como capturables. El progreso se mantiene al reanudar una partida, con pruebas de idempotencia, capacidad y Chromium. **La validación humana de ritmo y economía continúa pendiente.**

## v0.39.0 — Protección de partidas

La escritura de partidas ahora rechaza sesiones obsoletas de otra pestaña y conserva el respaldo antes de sustituir la partida principal. Los errores de cuota o escritura se muestran en el HUD y permiten exportar el progreso actual. La importación valida y confirma el almacenamiento antes de cambiar el mundo activo. Las partidas versión 1 siguen siendo compatibles. La prevención entre pestañas es optimista: no equivale a un bloqueo transaccional entre procesos.

## Desarrollo

- Requiere Node.js 22 y TypeScript 5.8.3 (`npm install` cuando hay acceso al registro).
- `npm run build`: compila `src/` a `dist/`.
- `npm test`: pruebas Node.js sobre `dist/`; ejecuta `build` tras editar TypeScript.
- `npm run verify`: build + genera HTML autónomo + tests (incluye arranque del bundle) + auditoría de imports PWA.
- `npm run release`: verify + HTML autónomo + ZIP de fuentes bajo `release/`.
- `npm run serve`: servidor HTTP en puerto 8080; abre `http://localhost:8080` para probar guardados y PWA.

`play.html` es un **artefacto generado, no versionado**. No debes editarlo manualmente. GitHub Pages publica los módulos compilados directamente y CI genera el HTML autónomo descargable. Los archivos fuente de verdad están en `src/`. Los tests usan `node:test` sin frameworks innecesarios.

## v0.29.0 — La Marisma del Espejo Roto

Después de completar el primer arco de Arken, el portal oriental del Santuario abre **una cuarta región procedural persistente**: las Marismas del Espejo Roto, con paleta verde azulado, niebla, lluvia, música propia y caminos legibles.

**Capítulo II:**
1. Entra en la Marisma y habla con **Nael, la Cartógrafa del Olvido**.
2. Recupera las dos memorias únicas: la **Campana Sumergida** y el **Farol de las Orillas**.
3. Enfrenta o vincula a tres testigos errantes con especies, rutas y niveles determinados por la semilla.
4. En el Tribunal del Reflejo, elige **PRESERVAR** los nombres imposibles (180 Ecos, 4 Sellos) o **LIBERARLOS** (180 Ecos, 4 Tónicos); la decisión es única e irreversible en esa partida.
5. Regresa a Nael para un epílogo específico y 80 Ecos únicos. El capítulo y la región siguen accesibles después del desenlace.

El diario y la brújula siguen cada objetivo. La nueva región conserva exploración, posición de monumentos, cofres, capturas, recompensas y desenlace al recargar. Los guardados v1 previos mantienen sus tres mapas congelados sin cambiar ninguna posición: se genera únicamente la cuarta región al restaurar, y después se incluye en el mismo formato v1. Las ilustraciones y sonidos son originales/programáticos.

**QA:** 200 semillas de conectividad y tres testigos; compatibilidad de snapshots anteriores; 18 sesiones aisladas del Capítulo II con ataques, defensas, curas, dos decisiones y reanudación. Estas son pruebas automatizadas de la secuela con el Arken ya completado como fixture; no equivalen a 18 sesiones humanas ni a una campaña global terminada. El tercer capítulo y el final definitivo siguen pendientes.

## v0.28.0 — Las tres lecciones y el Eclipse

La preparación de Hollowhart ya no depende de combates idénticos repetidos. En Arken, **Menú → Combate directo** ofrece tres lecciones elementales distintas: vencer por primera vez a Cindrel, Briarling y Mireling concede 55 EXP adicional por especie (con experiencia compartida normal). Cuando completes las tres, habla con Iria para reclamar **2 Tónicos una sola vez**; repetir rivales no repite las recompensas. La experiencia de entrenamiento no sustituye los premios únicos de los encuentros visibles del Bosque y Santuario.

Hollowhart ahora reserva su ataque de Éter **Eclipse** para la carga claramente anunciada: la **GUARDIA** responde al peligro telegráfico. En la preparación previa puedes elegir qué miembro consciente inicia el combate; por defecto se recomienda quien tenga mayor daño estimado con sus técnicas reales, sin reordenar el equipo guardado. Los guardados v1 mantienen compatibilidad.

La batería de QA de esta versión cubre 12 semillas deterministas × 3 iniciales, con capturas reales, lecciones, encuentros visibles, guardado/reanudación, Guardián y recorrido físico de la Cripta. Este recorrido automatizado no sustituye el playtesting humano, ni prueba la navegación exterior completa, ni permite declarar el juego premium.

## Estado de calidad

v0.22 muestra la probabilidad real de VÍNCULO durante el combate, con una bonificación moderada por estados activos. Consume un sello tanto si captura como si falla.

v0.21 añade previsiones tácticas visibles antes de atacar: daño estimado, afinidades, probabilidades de estado y curación, accesibles en móvil sin depender del cursor.

v0.20 introduce un modo voluntario de FPS estables: reduce gradualmente el coste de dibujar glifos solo si el rendimiento sostenido cae, y recupera detalle cuando mejora; la densidad microscópica manual sigue intacta por defecto y la opción no altera partidas. v0.19 añade orientación con rutas transitables, en lugar de flechas que atraviesan obstáculos; v0.18 añade brújula contextual de misión —dirección, distancia y acción del siguiente hito incluso en móvil— sin alterar el guardado; v0.17 integra el arco narrativo de Arken con seis objetivos enlazados, desenlace con el Archivista y recompensa persistente única; v0.16 incorpora coreografías de combate por familia (9 gestos, impactos y siluetas), manteniendo intactas las reglas de daño y los guardados; v0.15 restaura la trama ASCII continua con glifos microscópicos, opciones visuales detalladas y un compositor Canvas2D acelerado; v0.14 agregó siluetas direccionales y v0.13 añadió encuentros visibles; v0.12 mejoró la dirección de arte de las ocho cámaras mediante materiales diferenciados, grabados, antorchas, iluminación y subtítulos de cámara; conserva topología y partidas antiguas. **No** constituye un juego AAA completo. Pendientes: arte final, campaña completa, rendimiento y batería real Android, música de producción, pruebas con jugadores, economía y balance extensivos. Documentación: `docs/ARCHITECTURE.md`, `RELEASE_v0.24.md`.

## v0.26.2 — Economía de Lumbres

Cada Lumbre cura al equipo tantas veces como sea necesario. Solo entrega **un Sello de Vínculo en la primera visita** a esa región (hasta 9 sellos en la mochila); las visitas posteriores siguen curando, pero no generan recursos. Los sellos siguen disponibles mediante la tienda de Mara, recompensas y combates. Las partidas `version:1` anteriores reutilizan la marca `altar-<zona>` sin migración.

## Combates y ajustes

En Arken, Bosque de Ceniza y Santuario abre **Menú → Combate directo** para un desafío inmediato. En las regiones hostiles también hay tres criaturas visibles por semilla que puedes desafiar con el botón de acción, y sus derrotas se guardan. **Menú → Opciones gráficas** permite cambiar densidad, tamaño del carácter, contraste, contornos y brillo en tiempo real.

## Arco de Arken

Tras elegir criatura, abre **Menú → Misiones** para seguir seis etapas: hablar con el Archivista, atravesar el bosque, alcanzar el santuario, vencer a Hollowhart, completar la cripta y regresar a Arken. El final se conserva en partidas v1 y su recompensa solo se entrega una vez. El arco es una historia local cerrada, no la campaña comercial completa.

## Brújula narrativa

Tras iniciar una partida aparece, bajo el nombre de la región, una guía compacta hacia el objetivo activo: Archivista, portales oeste/este o Hollowhart. Marca distancia aproximada en casillas; cerca de un personaje o portal indica ACCIÓN. La cripta utiliza su menú y el objetivo muestra instrucciones en lugar de inventar una coordenada del mundo. La flecha señala la dirección general; sigue los senderos para rodear obstáculos. Funciona con la semilla generada y guardados anteriores sin nuevos campos.

## v0.24 — Guardian combat readiness and genuine battle walkthrough

Hollowhart now opens a non-blocking tactical preparation panel. It recommends a party of two or more creatures, at least one level 8 bond, healing at Lumbres, and guarding the charged strike. Players can ignore the guidance and fight immediately. An automated Arken walkthrough now trains and captures using standard gameplay, defeats Hollowhart and the two dungeon sentinels exclusively through real battle actions, traverses the crypt, and claims the finale. It tests a deterministic scenario rather than a human-quality judgement.

## v0.25 — Experiencia compartida en el equipo

Las victorias conceden el 100 % de experiencia al combatiente activo y el 50 % a cada compañero consciente del equipo (redondeo hacia abajo). Las criaturas debilitadas y las almacenadas no reciben experiencia. Las evoluciones de compañeros se aplican y se anuncian mediante la animación de evolución; el combate informa de cuántos aliados han progresado. No cambia la experiencia del combatiente ni los guardados v1. La mejora reduce la necesidad de entrenar por separado a cada criatura, sin asegurar que Hollowhart pueda derrotarse sin estrategia.

## v0.26 — Las sendas recuerdan

La primera victoria sobre cada criatura visible de los senderos en Bosque de Ceniza o Santuario otorga **+48 EXP** además de la experiencia normal, distribuida con la misma regla de equipo (titular al 100 %, acompañantes conscientes al 50 %). Los rastros derrotados desaparecen persistentemente, así que esta recompensa no se puede repetir al recargar; capturarlos concede la criatura, no el bonus de victoria. Los combates aleatorios, guardianes y expediciones no cambian. Los tres rastros del bosque aportan suficiente EXP teórica para pasar de nivel inicial 5 a nivel 8 si el titular vence los tres sin cambiarlo; esto **no demuestra** que todas las configuraciones puedan superar los combates sin más preparación.

## v0.26.1 — El reposo del sendero

Vencer **por primera vez** a un encuentro visible del Bosque o del Santuario recupera el 25 % de la salud máxima de cada criatura consciente (sin superar su máximo ni revivir debilitadas). Esta recuperación ocurre después de la experiencia y acompaña la bonificación única de +48 EXP. Las capturas, rematches, combates aleatorios, centinelas y jefes no recuperan salud por esta mecánica. Se mantiene el guardado v1. El objetivo es reducir los viajes obligatorios a las lumbres durante la ruta inicial; el equilibrio completo requiere pruebas con jugadores.

## v0.30.0 — Crown of the Unwritten: Chapter III and campaign finale

The concluding chapter is now reachable through the newly unlocked eastern Marsh gate once the chapter with Nael has genuinely concluded. The fifth seeded world, **Corona de lo No Escrito**, introduces Oriel, the Flame and Archive relics, three persistent witnesses, the original levitating Nullscribe boss, and a final choice: **REMEMBER** or **RENEW**. That choice resolves the earlier **KEEP/RELEASE** Marsh outcome in one of four coherent, distinct epilogues. Both the final choice and concluding reward are permanent and idempotent; the wider world remains explorable after the authored main story ends.

The physical region, visual effects, new boss silhouette, music score, story compass, journal, keyboard-operable modal and v1 save all share established systems. Existing three-/four-region frozen maps are not altered; the new region is generated deterministically on first load and persisted with the next save. The final boss is never capturable; 0.30 includes its own rig and scripted charged Ether move.

**Limitations:** Automated scenario fixtures for prior Arken/Marsh chapters do not substitute for human full-campaign playtesting. Player-perceived difficulty, physical Android performance, mastered audio, broader creature roster, accessibility and independent public HTTP smoke are release gates still pending. The game is not considered premium complete.

## v0.31.0 — The Unbroken Pilgrimage

The campaign journal includes a trilogy-wide, honest 19-step **Wayfarer's Roadbook** with first-party game-state chapter completion, current objective, actual living roster, seals, tonics, equipped elemental counters for each boss and health/level-based preparation advice. All projections are read-only, accessible through existing menus from keyboard, mouse and touch, without warps, resources or save-schema changes. Offline installation includes the compiled roadbook module.

The Q3 candidate now attempts a continuous from-new-game trilogy path on all three initial companions and four moral-endpoint combinations. Encounters, captures, guardian and final boss victories are resolved through ordinary player actions; the physical crypt is traversed tile-by-tile and saved/reloaded at major chapter boundaries. **Main-world portal handlers are still invoked directly by the automated harness**, so this does not independently prove navigability of every surface tile or uninterrupted human play. The release documentation must report that limitation accurately.


## v0.32.0 — Ecology of the Lost Names

The Marsh and Crown now have distinct optional wild populations and level-appropriate direct challenges. Higher-level random wildlife appears after each region's chapter concludes, protecting the first-time campaign difficulty curve; compulsory saved witness lineages remain unchanged. Four original, collectable identities enrich late-campaign team construction: **Bellroot** (Root guardian/fracture tank), **Mourveil** (Mist support/cleanser), **Ashglass** (Ash speed/scorch striker), and **Mnemoshade** (Ether drain/fracture skirmisher). Mourveil evolves from Velaria at level 12; Mnemoshade evolves from Wispawn at level 13. Their four unique glyph silhouettes, performance rigs and signature moves are integrated across battle, overworld encounters and the Codex.

The Codex now measures capture progress against capturable species only; Hollowhart and Nullscribe remain unique, uncapturable bosses. No save-schema migration is required: old version-1 saves remain valid and seeded visible-roamer identifiers, coordinates and one-time rewards remain stable. Species/role balance and visual quality still require human playtesting on real devices.


### v0.48 — Authored Pixel World

The world uses five authored voxel-like foliage families, stepped cottage silhouettes, low-noise continuous terrain, and faithful source colors in Glyph Pixel Art. Both rendering modes share the same deterministic world art. The pixel profile is the default for new players; saved settings and existing games remain compatible. Run `npm run verify` for TypeScript, standalone and Node gates, and the GitHub CI for WebGL2/Canvas2D screenshots.


### v0.48.1 — Clean microscopic ASCII floors

Path and bare soil no longer produce tiny disconnected source primitives that became stray letters in the microscopic ASCII compositor. Subtle edge rims and bounded natural motifs keep route readability with the authored pixel-art world unchanged.


### v0.50 ground performance architecture

Static world terrain now uses a bounded 24-entry, 8×8-tile LRU of offscreen Canvas2D chunks. Visible soil and path shapes are rasterized once per world revision, while moving characters, atmospheric effects and lighting continue to render live. Reconfiguring or loading a saved world invalidates the cache, preserving deterministic generated worlds and the existing v1 saves. The cache is presentation-only and does not change gameplay or imply physical-device FPS certification.


### v0.55 — Local release endurance laboratory (opt-in)

From **Settings → LABORATORIO DE ESTABILIDAD**, manually start a frame-cadence test, explore and fight, then stop and export `ascii-azur-endurance.json`. The report is local-only, constant-memory and separates exploration, battle, crypt and menus with viewport/orientation changes. It measures visible browser frame intervals, **not** GPU time, true phone power/heat or independent game-quality approval. Restarting a campaign or reloading clears the volatile measurement, never a saved journey. The exact real Android and external-player acceptance checklist lives in `docs/ANDROID_RELEASE_ACCEPTANCE.md`. All existing saves remain version 1.
