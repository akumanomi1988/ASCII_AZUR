# Historial original de ASCII AZUR v0.11–v0.12

El repositorio se importó mediante la integración de GitHub de ChatGPT el 21 de octubre de 2026. Como el entorno de importación no permite ejecutar `git push` directamente contra GitHub, los commits originales de desarrollo **no son ancestros** de la nueva rama `main`.

Para evitar la pérdida de ese historial, este repositorio conserva el **Git bundle original**:

`archive/ASCII_AZUR_v0.12_original_history.bundle`

- SHA-256: `b9fd1810fb159620a8ac0a1f994c9fca738dcfa7aed2b8580acb69cb54ab1678`
- Tamaño: 279.298 bytes
- Rama histórica: `main`, commit `adeb416ebecab3120c9086d5c3a4ce9c9324dd83`
- Otras referencias: `feature/quality-pipeline-v012`, `v0.11.0`, `v0.12.0`.
- Autor original de los commits: `akumanomi1988 <akumanomi1988@gmail.com>`.

## Recuperar commits y etiquetas anteriores

Desde un clon normal del repositorio:

```bash
git bundle verify archive/ASCII_AZUR_v0.12_original_history.bundle
git fetch archive/ASCII_AZUR_v0.12_original_history.bundle 'refs/heads/main:refs/heads/legacy-v012'
git fetch archive/ASCII_AZUR_v0.12_original_history.bundle 'refs/tags/*:refs/tags/*'
git log --format=fuller legacy-v012
```

Esto restaura el historial en una rama separada y preserva las etiquetas originales sin reescribir la nueva rama principal. **No usar `git push --force` sobre `main`** para fusionar los dos historiales. Para trabajo futuro, `main` del repositorio remoto es la fuente de verdad.

La compilación y las pruebas se ejecutan con `npm run verify`. El HTML autónomo `play.html` es un artefacto generado, y el código editable vive en `src/`.
