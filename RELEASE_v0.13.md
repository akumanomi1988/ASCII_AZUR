# ASCII AZUR v0.13 — Encuentros directos y laboratorio visual ASCII

Fecha: 2026-10-21. Construida sobre v0.12 sin modificar `SaveGame.version=1`.

## Cambios jugables

- Tres criaturas visibles e interactuables por región hostil (`forest`, `sanctuary`), distribuidas sobre rutas transitables y conectadas de forma reproducible con la semilla del mundo.
- Sus combates se activan mediante el botón de acción / teclado / mando. Al vencerlas o capturarlas, la instancia visible desaparece para esa partida; escapar no la elimina. No se modifica el terreno guardado.
- Nuevo acceso `MENÚ → COMBATE DIRECTO` con tres oponentes por región, incluida Arken como zona de entrenamiento. No se necesita depender de la aparición aleatoria.
- Continúan los encuentros aleatorios originales, la expedición roguelite y el combate de la cripta.

## Gráficos configurables

- Se mantienen los perfiles de densidad; nuevo perfil `Extrema`.
- Ajustes independientes de tamaño del glifo (0.65x–1.85x), contraste (0.65–1.8), definición de contornos (0.5–2.4), luminosidad (-0.25–0.25) y paleta cromática.
- Parámetros conectados a shader WebGL2 y compositor Canvas2D. Preferencias validadas, limitadas, persistidas en `ascii-azur-graphics-v1` y compatibles con ajustes antiguos.
- `OPCIONES GRÁFICAS` accesible desde el menú lateral en móvil horizontal, donde la barra superior no se muestra. Botón de restablecimiento.
- Se mantienen las opciones de audio, movimiento reducido, texto grande y distribución del joystick.

## Pruebas

- `npm run verify`: PASS, 116/116 pruebas de Node y TypeScript; 23 módulos incluidos en caché offline.
- Pruebas nuevas: 200 semillas de mundo, colocación e interacción de enemigos, validación de checkpoints, límites de preferencias, compatibilidad y cálculo de tamaño de glifo.
- Chromium Canvas2D headless: flujo de inicio, desafío directo, ajustes gráficos, enemigos visibles, combate, victoria y desaparición del enemigo. PASS en 915×412, 412×915 y 1200×720 sin excepciones de JavaScript en recorridos probados.
- Persistencia de preferencias: verificada bajo almacenamiento simulado en Chromium; el entorno de QA bloquea HTTP local, por lo que queda pendiente E2E de reinicio real bajo HTTPS.
- GPU WebGL2 físico, rendimiento y estabilidad térmica en Android: no verificados. En el perfil Ultra se observó menos de 30 FPS en compositor Canvas2D headless; se recomienda Equilibrada en dispositivos lentos.

## Limitaciones de alcance

Los encuentros visibles están fijos por semilla (sin movimiento autónomo ni IA de persecución). Solo hay tres regiones de campaña y doce criaturas. No se cumplen todavía los criterios de campaña completa, arte final ni pruebas externas de producto premium. La próxima fase debe incorporar animaciones de criaturas y una mejor separación visual figura/fondo, priorizando legibilidad y rendimiento real Android.
