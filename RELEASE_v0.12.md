# ASCII AZUR — Release v0.12.0

## Implementado
- Git local inicializado con historia v0.11.0 recuperable y autor/committer `akumanomi1988`.
- Pipeline reproducible con comprobación de imports, HTML autónomo y ZIP de fuentes.
- Configuración de GitHub Actions preparada para futuro repositorio privado, pero todavía sin publicar.
- Cripta: las 8 cámaras tienen identidad visual, materiales, iluminación y grabados diferenciados.
- El HUD contextual muestra el nombre de la cámara y los sellos necesarios ya resueltos.
- Nuevo módulo puro `dungeons/room-art.ts`; diseño visual desacoplado de las colisiones.
- Caché PWA actualizada para incluir el módulo nuevo.
- Se conserva el formato `DungeonRun.version=1` y no cambia la topología de las semillas.

## Pendiente
- Subida a GitHub: el conector disponible no expone creación de repositorios. Falta disponer de `akumanomi1988/ASCII_AZUR` privado. No se ha creado ni modificado ningún repositorio ajeno.
- Medición del rendimiento WebGL2 y batería en teléfonos Android reales.
- Pruebas con jugadores, campaña completa, contenido, arte/sonido final y criterios comerciales.

## Verificación en el entorno de desarrollo
- Compilación TypeScript: PASS.
- Tests Node: ejecutados; recuento final en el registro de la build.
- PWA: auditoría estática de las dependencias ES importadas y cacheadas.
- Chromium Canvas2D: flujos de cripta en móvil horizontal (915×412) y vertical (412×915) sin errores JavaScript.
- HTTP E2E / reload: **BLOQUEADO** por `ERR_BLOCKED_BY_ADMINISTRATOR` en el navegador de esta sesión; se entrega `tools/qa_http_smoke.py` para repetir la prueba fuera de ese entorno.
- Android real / GPU WebGL2: NO VERIFICADO.
- La instalación local de dependencias npm no pudo consultar el registro (EAI_AGAIN). La compilación usó TypeScript 5.8.3 disponible globalmente; CI instalará esa misma versión cuando tenga red.
