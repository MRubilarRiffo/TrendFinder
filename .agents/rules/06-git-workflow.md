---
trigger: always_on
description: Flujo estricto de versionado SemVer, verificación previa y commits estructurados para Git y GitHub.
---

# Regla: Flujo de Trabajo en Git y Publicación de Cambios

Esta regla describe el protocolo obligatorio para preparar, versionar y subir cambios al repositorio Git en TrendFinder, alineado con las directrices del skill global `git-commit-push`.

---

## 1. Verificación Previa Obligatoria

Antes de ejecutar cualquier comando `git commit` o `git push`:

1. **Ejecutar Pruebas Automatizadas**:
   ```bash
   cd api && npm test
   ```
   Las 124 pruebas de Jest distribuidas en 17 suites deben pasar al 100%. No se admiten commits con tests rotos.
2. **Validar Frontend**:
   ```bash
   cd web && npm run lint
   ```
   No deben existir errores de sintaxis o variables no utilizadas.
3. **Auditoría de Archivos en Staging (`git status`)**:
   - Verificar rigurosamente que archivos sensibles o volátiles (`.env`, `tokens.txt`, `proxies.txt`, `*.lock`, `bot_state.json`, `logs/`, `package-lock.json`) no hayan sido añadidos al índice (`git add`).

---

## 2. Versionado Semántico (SemVer)

Antes de hacer commit, incrementar la versión en el archivo `package.json` correspondiente (`api/package.json` y/o `web/package.json`):

- **MINOR** (ej. `1.0.0` → `1.1.0`): Nuevas funcionalidades compatibles hacia atrás (`feat:`).
- **PATCH** (ej. `1.0.0` → `1.0.1`): Correcciones de errores (`fix:`), refactorizaciones (`refactor:`), optimizaciones de rendimiento (`perf:`) o mejoras de documentación (`docs:`).
- **MAJOR** (ej. `1.0.0` → `2.0.0`): Cambios incompatibles o roturas de API pública (`BREAKING CHANGE:`).

---

## 3. Formato Estructurado del Mensaje de Commit

Los mensajes de commit deben seguir la especificación Conventional Commits con un formato de 4 bloques estructurados:

```
<tipo>(<ámbito>): <descripción corta en modo imperativo>

Por qué:
- Explicación del problema, contexto de negocio o motivación del cambio.

Qué se hizo:
- Lista de cambios técnicos puntuales realizados en el código.

Verificación:
- Detalle de pruebas ejecutadas (ej. npm test con 50 suites aprobadas).
```

### Tipos Permitidos:
- `feat`: Nueva funcionalidad para el usuario o la API.
- `fix`: Corrección de un fallo o error en cálculos.
- `refactor`: Cambio de código que no altera el comportamiento observable ni añade features.
- `perf`: Mejora de rendimiento (ej. consultas SQL o paginación).
- `test`: Añadir o corregir pruebas automatizadas.
- `docs`: Modificaciones en documentación (`docs/`, `AGENTS.md`).
- `chore`: Mantenimiento general o configuración.

---

## 4. Procedimiento de Push

1. Verificar el remoto y la rama activa (`git status`, `git branch`).
2. Realizar el push a la rama correspondiente:
   ```bash
   git push origin <rama>
   ```
3. Confirmar que el remoto haya recibido la actualización sin conflictos.
