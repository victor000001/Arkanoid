---
name: actualizar-docs
description: Sincroniza CLAUDE.md y README.md con el estado real del repo. Inspecciona la estructura de archivos, el código existente y el progreso del flujo spec-driven (specs/ y sus estados), detecta el desfase entre lo documentado y lo real, y propone los cambios antes de escribirlos. Úsalo después de implementar un spec o cuando los docs se hayan quedado atrás.
disable-model-invocation: true
argument-hint: '(opcional) claude | readme — limita qué archivo actualizar; vacío = ambos'
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(ls:*), Bash(cat:*), Bash(git branch:*)
---

# /actualizar-docs — Sincronizador de documentación

Este skill mantiene `CLAUDE.md` y `README.md` alineados con el **estado real** del proyecto:
la estructura de archivos, el código que ya existe y el progreso del flujo spec-driven. No
inventa documentación nueva ni reescribe por gusto: detecta el **desfase** entre lo que los
docs afirman y lo que el repo realmente contiene, y lo corrige.

**No escribes código de la aplicación aquí.** Solo tocas `CLAUDE.md` y/o `README.md`.

## Filosofía

La documentación que miente es peor que la ausente. Este skill existe para que esa mentira no sobreviva a un `/spec-impl`.

Dos reglas que gobiernan todo:

- **Documenta lo que es, no lo que debería ser.** Si el código contradice el spec, reporta la
  contradicción; no maquilles el doc para que cuadre.
- **Cambio mínimo y justificado.** No reescribas secciones que siguen siendo correctas. Cada
  edición propuesta debe responder a un desfase real que detectaste.

## Contexto de sesión

Estado del repositorio:
!`git status --short`

Rama actual:
!`git branch --show-current`

Estructura de la raíz:
!`ls -la`

Specs existentes:
!`ls specs/ 2>/dev/null || echo "La carpeta specs/ no existe todavía"`

Últimos commits:
!`git log --oneline -10`

---

## Flujo del comando

Sigue las cuatro fases en orden. **No escribas ningún archivo antes de la Fase 4.**

El argumento recibido es: `$ARGUMENTS`

- Si contiene `claude` → actualiza solo `CLAUDE.md`.
- Si contiene `readme` → actualiza solo `README.md`.
- Si está vacío o no reconoces el valor → considera ambos archivos.

### Fase 1 — Levantar el estado real del repo

Tu objetivo es construir una imagen fiel de qué es el proyecto **hoy**. No te fíes de lo que
digan los docs actuales: ve a la fuente.

1. **Estructura de archivos.** A partir del listado de la raíz (ya lo tienes arriba), identifica
   qué existe realmente.
2. **Código de la aplicación.** Lee los archivos fuente que existan. No necesitas memorizar cada
   línea.
3. **Estado del flujo spec-driven.** Lee cada archivo de `specs/`. Para cada spec anota: número,
   slug, **estado del header** (`Borrador`, `En revisión`, `Aprobado`, `Implementado`,
   `Obsoleto`) y su objetivo de una frase. Identifica el estado por significado, no por la
   etiqueta literal.
4. **Skills disponibles.** Lista `.claude/skills/` y anota qué skills existen. Si hay skills que
   los docs no mencionan (o mencionan skills que ya no existen), eso es desfase.
5. **Historial.** Usa los commits de arriba para entender qué se hizo recientemente.

Si algo es ambiguo (ej. un spec marcado `Aprobado` pero sin código correspondiente), **no lo
resuelvas inventando** — anótalo como hallazgo para la Fase 2.

### Fase 2 — Detectar el desfase

Lee `CLAUDE.md` y `README.md` (los que apliquen según el argumento). Compara, afirmación por
afirmación, lo que dicen contra lo que descubriste en la Fase 1. Construye una lista de
**hallazgos**. Tipos de desfase a buscar:

- **Afirmaciones falsas.** El doc dice "no existe el archivo X" pero sí existe. El doc dice "el
  proyecto todavía no está implementado" pero hay un spec `Implementado` y código funcional.
- **Omisiones.** Existe un módulo o componente con una arquitectura concreta que ningún doc
  describe. Hay un skill nuevo que `CLAUDE.md` no lista en su sección de flujo de trabajo.
- **Referencias muertas.** El doc apunta a un archivo, carpeta o skill que ya no existe.
- **Estado del proyecto desactualizado.** El README describe el proyecto como aspiración futura
  cuando ya es realidad (o viceversa).
- **Tabla de specs / progreso.** Si el doc resume el avance del flujo spec-driven, ¿coincide con
  los estados reales en `specs/`?

Presenta los hallazgos al usuario en una lista numerada y concisa. Formato por hallazgo:

> **N. [archivo afectado] — [tipo de desfase]**
> Dice: "[cita textual del doc actual]"
> Realidad: [lo que encontraste en el repo]
> Propuesta: [qué cambiarías, en una frase]

Si **no encuentras ningún desfase**, dilo claramente, no inventes cambios para justificar la
ejecución, y termina ahí.

### Fase 3 — Proponer los cambios concretos

Para cada hallazgo que el usuario no haya descartado, muestra el **texto exacto** que propones
escribir. Trabaja sección por sección, no archivo entero de golpe:

- Muestra el bloque markdown nuevo o modificado.
- Si es una edición puntual, muestra el antes/después de esa porción.
- Agrupa por archivo (`CLAUDE.md` primero, luego `README.md`).

Respeta estas restricciones de estilo del repo:

- **Todo en español** (lo exige `CLAUDE.md` § Idioma).
- Conserva el tono y la estructura de secciones existentes. No reordenes ni renombres secciones
  que funcionan; edita su contenido.
- `CLAUDE.md` es la guía operativa para agentes: precisa, técnica, orientada a "cómo trabajar
  aquí" (cómo se ejecuta, cómo se prueba, flujo spec-driven, estructura del código).
- `README.md` es la cara del proyecto: qué es, cómo se instala/ejecuta, en lenguaje para humanos.
  No lo conviertas en una copia de `CLAUDE.md`.
- No introduzcas afirmaciones sobre el futuro como si fueran presente. Si algo está planeado
  pero no hecho, redáctalo como plan.

Pregunta: **"¿Aplico estos cambios tal cual, o ajustamos algo antes?"** Espera confirmación
explícita.

### Fase 4 — Escribir

Solo después del OK del usuario:

1. Aplica las ediciones aprobadas con la herramienta de edición de archivos.
2. **No toques** secciones que no estaban en la lista de cambios aprobados.
3. **No hagas commit ni cambies de rama.** Eso lo decide el usuario. Si quiere, te lo pedirá.
4. Confirma con un resumen final:
   - Qué archivos tocaste.
   - Qué hallazgos quedaron resueltos.
   - Cualquier hallazgo que el usuario pidió posponer (para que no se pierda).
   - Sugerencia: revisa el diff antes de commitear.

## Reglas duras

- **Nunca escribas archivos antes de la Fase 4.** Las fases 1–3 son solo lectura y propuesta.
- **Nunca cambies un estado de spec** en `specs/`. Este skill documenta el estado, no lo altera.
  El cambio de estado de un spec es siempre decisión humana (ver `/spec` y `/spec-impl`).
- **Nunca hagas commit automáticamente.** Dejas el árbol de trabajo modificado y listo para que
  el humano lo revise.
- **Nunca inventes desfase.** Si los docs están al día, repórtalo y termina.
- **Nunca toques código fuente ni assets del proyecto.** Solo editas `CLAUDE.md` y `README.md`.
- **Si un hallazgo nace de una contradicción real** (ej. spec `Aprobado` sin código), no la
  escondas en el doc: repórtala al usuario y pregúntale cómo quiere reflejarla.

## Resumen del comportamiento esperado

```
/actualizar-docs

  Fase 1  →  Inspecciona estructura, código, specs/ y skills reales
  Fase 2  →  Compara contra CLAUDE.md y README.md → lista de desfases
  Fase 3  →  Propone el texto exacto, sección por sección → espera OK
  Fase 4  →  Escribe solo lo aprobado, sin commit, y resume

/actualizar-docs readme

  Igual, pero limitado a README.md

/actualizar-docs   (docs ya al día)

  Fase 1–2  →  No detecta desfase → lo reporta y termina sin escribir nada
```
