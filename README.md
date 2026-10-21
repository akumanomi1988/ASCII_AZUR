# ASCII AZUR v0.13 — The Unwritten

RPG de captura de criaturas y fantasía oscura, con mundo ASCII generado mediante WebGL2 (fallback Canvas2D), exploración procedural persistente y una cripta física de ocho cámaras. Android horizontal es la plataforma prioritaria; navegador web es el entorno de desarrollo y distribución actual.

## Desarrollo

- Requiere Node.js 22 y TypeScript 5.8.3 (`npm install` cuando hay acceso al registro).
- `npm run build`: compila `src/` a `dist/`.
- `npm test`: pruebas Node.js sobre `dist/`; ejecuta `build` tras editar TypeScript.
- `npm run verify`: build + tests + auditoría de imports PWA.
- `npm run release`: verify + HTML autónomo + ZIP de fuentes bajo `release/`.
- `npm run serve`: servidor HTTP en puerto 8080; abre `http://localhost:8080` para probar guardados y PWA.

`play.html` es un **artefacto generado**. No debes editarlo manualmente. Los archivos fuente de verdad están en `src/`. Los tests usan `node:test` sin frameworks innecesarios.

## Estado de calidad

v0.13 agrega encuentros directos visibles y preferencias avanzadas de glifos; v0.12 mejoró la dirección de arte de las ocho cámaras mediante materiales diferenciados, grabados, antorchas, iluminación y subtítulos de cámara; conserva topología y partidas antiguas. **No** constituye un juego AAA completo. Pendientes: arte final, campaña completa, rendimiento y batería real Android, música de producción, pruebas con jugadores, economía y balance extensivos. Documentación: `docs/ARCHITECTURE.md`, `RELEASE_v0.13.md`.

## Combates y ajustes

En Arken, Bosque de Ceniza y Santuario abre **Menú → Combate directo** para un desafío inmediato. En las regiones hostiles también hay tres criaturas visibles por semilla que puedes desafiar con el botón de acción, y sus derrotas se guardan. **Menú → Opciones gráficas** permite cambiar densidad, tamaño del carácter, contraste, contornos y brillo en tiempo real.
