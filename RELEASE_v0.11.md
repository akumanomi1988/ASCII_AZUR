# ASCII AZUR v0.11 — La Cripta de los Ecos

## Versión
- Basada en el código íntegro v0.10, sin cambiar la plataforma ni el esquema de guardado `version: 1`.
- Se conserva la aventura principal, expediciones por nodos, criaturas, misiones, música y controles.

## Implementado
1. Mazmorra física navegable con 8 salas y pasillos enlazados, con topología determinista por semilla.
2. El juego permite entrar desde el menú lateral de Velo de Arken (CRIPTA EXPLORABLE). Se utiliza el mismo joystick, teclado y mando.
3. Estructuras de mampostería, suelos, corredores, animación ambiental, niebla de exploración y nuevos elementos interactivos convertidos por el renderizador a glifos ASCII.
4. Dos guardianes menores, dos arcas, una lumbre, una inscripción, un portal de entrada y una puerta final. El cierre exige vencer los dos encuentros y leer la inscripción.
5. Recompensas únicas y protección contra reclamaciones repetidas, con mapa, posición, descubrimiento y estado de los encuentros persistentes.
6. Un atlas de la mazmorra accesible desde MAPA que solo muestra las celdas exploradas.
7. Compatibilidad con partidas antiguas: el campo `dungeon` es opcional.
8. Checkpoint integrado del combate en la cripta; escapar no rompe el estado del encuentro. En caso de derrota se sale al pueblo sin descartar el plano ya descubierto.
9. Caché PWA actualizada para los módulos nuevos y HTML autónomo generado.

## Pruebas realizadas
- TypeScript: PASS.
- 106/106 tests: PASS (reglas del mundo, guardados, combates, colisiones, 1.000 semillas, doble recompensa, integración de gameplay).
- Chromium Canvas2D, emulación horizontal 915×412 y vertical 412×915: entrada, mapa, cofre, enfrentamiento y salida del combate sin errores JavaScript.
- WebGL2 y rendimiento Android físico: **NO VERIFICADOS**.

## QA pendiente de un lanzamiento premium
- Dirección artística final y reconocimiento de siluetas de criaturas.
- Rendimiento real y estabilidad térmica en Android.
- Validación de persistencia HTTP en navegación real; reproducción de cortes de energía y fondo/reanudación.
- Mazmorras de múltiples pisos, puzzles espaciales, distintos patrones de bioma y generación versionada adicional.
- Campaña completa, más regiones, diálogos, NPC, cinemáticas, balance y ensayo con jugadores externos.
- QA completo de accesibilidad, controladores físicos y empaquetado Android.

## Decisiones arquitectónicas
- El algoritmo de generación `DungeonRun.version=1` queda congelado. Nunca debe modificarse en-place; crear `version=2` con migrador o mantener el generador v1 para preservar la topología de partidas existentes.
- La semilla no es el único guardado: el plano materializado y los estados de sus eventos forman parte del checkpoint.
- La simulación de mazmorra pertenece a `src/dungeons/labyrinth.ts`, la representación a `src/dungeons/draw-dungeon.ts`; la aplicación integra ambas.
- El nuevo contenido es un paso de desarrollo validable, **no una certificación de calidad AAA ni de precio comercial 60 €**.

## Siguiente iteración recomendada
1. Golden Slice artístico: protagonista, dos criaturas y una sala del bosque con anatomía, materiales y animaciones reconocibles.
2. Transformar la cripta en un sistema de pisos y puertas con condiciones de juego; mantener validación por miles de semillas.
3. Contrastar Canvas2D vs WebGL2 con dispositivos físicos; trabajar únicamente sobre perfiles medidos.
4. Mejorar el HUD de combate y los menús para horizontal y control por mando.
