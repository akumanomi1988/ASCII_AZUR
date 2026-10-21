# ASCII AZUR v0.17 — El juramento de Arken

## Vertical slice
- El diario conecta seis objetivos previamente fragmentados: Archivista → Bosque → Santuario → Hollowhart → Cripta → Archivista.
- Hitos e indicaciones actualizados en HUD, barra de progreso y menú de misiones con distinción entre principales y secundarios.
- Desenlace original de tres escenas y reconocimiento permanente `arken-vow-restored` con 200 Ecos y 4 Sellos, entregados solo una vez.
- Diálogos posteriores al Guardián y a la cripta orientan hacia el siguiente objetivo.
- Compatibilidad con guardados `version:1`: los hitos se derivan de flags, derrota del Guardián y cripta terminada.
- `src/story-campaign.ts`: lógica pura, sin navegación ni efectos secundarios; pruebas de idempotencia y compatibilidad con orden de eventos.

## QA
- `npm run verify`: 137/137 Node tests, TypeScript y auditoría offline PASS.
- Chromium con HTML autónomo montado mediante `set_content`: inicio, selector, diálogos y seis etapas visibles en diario; escritorio 1250x780 y móvil horizontal 844x390, sin errores JS.
- Integración de historia: secuencia hasta conclusión, recompensa una sola vez, persistencia y bloqueo del cierre prematuro.
- Limitaciones: no se ha realizado un recorrido manual natural completo, benchmark WebGL2 en Android físico ni smoke HTTP independiente de `github.io`.

## No es final de campaña
Cierra el arco de Arken, pero faltan más regiones, historia global, balance, producción de arte y audio, accesibilidad y test con jugadores.
