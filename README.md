# ASCII AZUR v0.21 — The Unwritten

RPG de captura de criaturas y fantasía oscura, con mundo ASCII generado mediante WebGL2 (fallback Canvas2D), exploración procedural persistente y una cripta física de ocho cámaras. Android horizontal es la plataforma prioritaria; navegador web es el entorno de desarrollo y distribución actual.

## Desarrollo

- Requiere Node.js 22 y TypeScript 5.8.3 (`npm install` cuando hay acceso al registro).
- `npm run build`: compila `src/` a `dist/`.
- `npm test`: pruebas Node.js sobre `dist/`; ejecuta `build` tras editar TypeScript.
- `npm run verify`: build + genera HTML autónomo + tests (incluye arranque del bundle) + auditoría de imports PWA.
- `npm run release`: verify + HTML autónomo + ZIP de fuentes bajo `release/`.
- `npm run serve`: servidor HTTP en puerto 8080; abre `http://localhost:8080` para probar guardados y PWA.

`play.html` es un **artefacto generado, no versionado**. No debes editarlo manualmente. GitHub Pages publica los módulos compilados directamente y CI genera el HTML autónomo descargable. Los archivos fuente de verdad están en `src/`. Los tests usan `node:test` sin frameworks innecesarios.

## Estado de calidad

v0.21 añade previsiones tácticas visibles antes de atacar: daño estimado, afinidades, probabilidades de estado y curación, accesibles en móvil sin depender del cursor.

v0.19 calcula rutas transitables y evita flechas a través de árboles, muros y rocas; v0.18 añade brújula contextual de misión —dirección, distancia y acción del siguiente hito incluso en móvil— sin alterar el guardado; v0.17 integra el arco narrativo de Arken con seis objetivos enlazados, desenlace con el Archivista y recompensa persistente única; v0.16 incorpora coreografías de combate por familia (9 gestos, impactos y siluetas), manteniendo intactas las reglas de daño y los guardados; v0.15 restaura la trama ASCII continua con glifos microscópicos, opciones visuales detalladas y un compositor Canvas2D acelerado; v0.14 agregó siluetas direccionales y v0.13 añadió encuentros visibles; v0.12 mejoró la dirección de arte de las ocho cámaras mediante materiales diferenciados, grabados, antorchas, iluminación y subtítulos de cámara; conserva topología y partidas antiguas. **No** constituye un juego AAA completo. Pendientes: arte final, campaña completa, rendimiento y batería real Android, música de producción, pruebas con jugadores, economía y balance extensivos. Documentación: `docs/ARCHITECTURE.md`, `RELEASE_v0.21.md`.

## Combates y ajustes

En Arken, Bosque de Ceniza y Santuario abre **Menú → Combate directo** para un desafío inmediato. En las regiones hostiles también hay tres criaturas visibles por semilla que puedes desafiar con el botón de acción, y sus derrotas se guardan. **Menú → Opciones gráficas** permite cambiar densidad, tamaño del carácter, contraste, contornos y brillo en tiempo real.

## Arco de Arken

Tras elegir criatura, abre **Menú → Misiones** para seguir seis etapas: hablar con el Archivista, atravesar el bosque, alcanzar el santuario, vencer a Hollowhart, completar la cripta y regresar a Arken. El final se conserva en partidas v1 y su recompensa solo se entrega una vez. El arco es una historia local cerrada, no la campaña comercial completa.

## Brújula narrativa

Tras iniciar una partida aparece, bajo el nombre de la región, una guía compacta hacia el objetivo activo: Archivista, portales oeste/este o Hollowhart. Marca distancia aproximada en casillas; cerca de un personaje o portal indica ACCIÓN. La cripta utiliza su menú y el objetivo muestra instrucciones en lugar de inventar una coordenada del mundo. La flecha señala la dirección general; sigue los senderos para rodear obstáculos. Funciona con la semilla generada y guardados anteriores sin nuevos campos.
