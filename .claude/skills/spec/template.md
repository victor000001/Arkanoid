# Template para un spec útil

Este archivo es la referencia que el skill `/spec` consulta al generar specs. Cada sección incluye su propósito y un ejemplo mínimo. **No es texto para copiar literalmente** — es la forma que el skill debe respetar.

---

## Header

Cada spec empieza con metadata en formato blockquote (sin tablas, sin bloques, simple como se muestra abajo):

```markdown
# SPEC NN — Título corto y descriptivo

> **Estado:** Borrador · **Depende de:** SPEC 01, SPEC 02 · **Fecha:** YYYY-MM-DD
> **Objetivo:** Una sola frase. Si necesitas dos frases, la feature es demasiado grande.
```

**Estados válidos:** `Borrador`, `En revisión`, `Aprobado`, `Implementado`, `Obsoleto`.

> Las etiquetas de arriba son las de este repo (en español). Los skills también aceptan equivalentes en otro idioma (ej. inglés `Draft` / `In review` / `Approved` / `Implemented` / `Obsolete`). Elige un set por repo y mantén la consistencia.

**Regla del objetivo:** una frase que un humano lee en 5 segundos y entiende qué se va a construir. Si no cabe en una frase, divide la feature.

---

## Sección 1 — Por qué existe este spec (opcional)

Para specs que toman decisiones no obvias o rompen patrones del proyecto, una sección breve que explique el **por qué** del trabajo. No el qué — el qué viene después.

Para specs simples, omítela.

---

## Sección 2 — Scope

Dos sub-bloques explícitos. **Ambos son obligatorios.**

```markdown
## Scope

**Entra:**

- Cosa concreta uno.
- Cosa concreta dos.

**Fuera de scope (para specs futuros):**

- Algo que podría hacerse pero no ahora.
- Algo que surgió en la conversación pero no entra.
```

**Por qué importa el "fuera":** captura las cosas que el usuario mencionó durante la fase de preguntas pero que se decidió diferir. Sin ese registro, durante la implementación habrá la tentación de colarlas "ya que estamos".

---

## Sección 3 — Data model

Las estructuras concretas que aparecen o cambian. Usa código real, no pseudocódigo abstracto.

```markdown
## Data model

\`\`\`js
// Game state
const state = {
level: 1,
score: 0,
highScores: [/* { score, level, date } */],
};
\`\`\`

Convenciones:

- Coordenadas: origen arriba-izquierda.
- Velocidades en píxeles/frame.
```

Si la feature no introduce datos nuevos, escríbelo explícitamente: _"Esta feature no introduce nuevas estructuras de datos. Reutiliza el modelo del SPEC 01."_

---

## Sección 4 — Plan de implementación

Pasos numerados. Cada paso debe dejar el sistema en un estado **funcional y ejecutable**. Nada de "implementar la mitad y continuar mañana".

```markdown
## Plan de implementación

1. Crear el archivo X con un skeleton vacío.
2. Implementar la función A en X. Test manual: ejecutar Y, ver Z.
3. Conectar X con el módulo existente W.
4. ...
```

**Reglas:**

- Cada paso debe ser commiteable por sí solo.
- Si un paso requiere más de 30–50 líneas de código, divídelo.
- El último paso del plan **no** es "probar todo" — eso son los acceptance criteria.

---

## Sección 5 — Acceptance criteria

Checklist booleano. Cada ítem se puede verificar con sí o no.

```markdown
## Acceptance criteria

- [ ] El juego carga sin errores en la consola.
- [ ] Romper un brick suma exactamente 10 puntos.
- [ ] Recargar la página preserva los high-scores.
```

**Anti-patrones a evitar:**

- ❌ "Que funcione bien." → no verificable.
- ❌ "Buena UX." → subjetivo.
- ❌ "Sin bugs." → no operacional.
- ✅ "Pulsar Esc pausa el juego y muestra el menú." → verificable, booleano.

---

## Sección 6 — Decisiones tomadas y descartadas

La sección que más valor tiene dentro de 3 meses. Captura **qué consideraste**, no solo qué elegiste.

```markdown
## Decisiones

- **Sí:** localStorage para persistencia. Cabe en <5MB y no necesitamos queries.
- **No:** IndexedDB. Overengineering para este caso.
- **Sí:** key versionada (`save:v1`). Permite migrar el schema después sin romper.
- **No:** sync en la nube. Va en otro spec si algún día llega.
```

Cada decisión idealmente tiene una razón breve. Las decisiones sin razón son las primeras en ser cuestionadas después.

---

## Sección 7 — Riesgos identificados (opcional)

Solo cuando hay riesgos no obvios. Tabla simple:

```markdown
## Riesgos

| Riesgo                                | Mitigación                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------- |
| localStorage deshabilitado en modo privado | Fallback a objeto en memoria. El juego sigue corriendo, solo que no persiste. |
| Schema futuro incompatible            | La key incluye `:v1`. Migración documentada en `persistence.js`.            |
```

Para specs pequeños o features muy contenidas, omítela.

---

## Sección final — Qué NO entra (refuerzo)

Repite explícitamente al final qué **no** se hará en este spec. Esta repetición es deliberada — la sección de Scope ya lo dice, pero al final del documento sirve como recordatorio para quien lee solo las últimas líneas.

```markdown
## Qué **no** entra en este spec

- Editor visual (otro spec si algún día llega).
- Multijugador.
- Versión móvil.

Cada una de esas, si llega, va en su propio spec.
```

---

## Reglas globales sobre todo el documento

- **Una frase por idea.** Si una frase tiene dos comas y un punto y coma, divídela.
- **Nombres concretos.** Si dices "el módulo de niveles", di `src/levels.js`. Si dices "una key", da el string exacto.
- **Sin TODOs.** Un TODO en un spec significa que la decisión no se tomó. Tómala o anótala como decisión pendiente con una razón.
- **Sin código ejecutable largo.** El spec describe; el código se escribe después. Snippets cortos para ilustrar estructuras de datos están bien; funciones completas no.
- **Markdown estándar.** Sin extensiones raras. Debe renderizar en GitHub sin sorpresas.
