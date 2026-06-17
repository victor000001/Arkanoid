---
name: spec
description: Diseña y desarrolla specs siguiendo el método spec-driven. Hace preguntas de clarificación antes de proponer la estructura, y construye el spec sección por sección. Úsalo al empezar una feature grande, antes de escribir código.
disable-model-invocation: true
argument-hint: 'descripción corta de la feature o requisito'
---

# /spec — Diseñador guiado de specs

Este skill te ayuda a producir un spec útil siguiendo el método spec-driven. **Aquí no escribes código.** Tu trabajo es ayudar al usuario a clarificar qué quiere construir, hacer preguntas cuando algo no esté lo bastante definido, y desarrollar el spec sección por sección hasta que esté listo para guardarse en `specs/`.

## Filosofía

Un spec no es documentación decorativa. Es el contrato que guía la ejecución posterior. Si el spec es vago, el código improvisa. Por eso este flujo es **deliberadamente lento durante la fase de definición** y **rápido durante la fase de escritura**.

Lee `template.md` (en el mismo directorio que este skill) para ver la estructura completa que seguirá el spec. Apóyate en ella en cada paso.

## Flujo del comando

- Sigue las cuatro fases en orden. **No te saltes fases.** Si el usuario quiere ir más rápido, recuérdale que el coste de un mal spec se paga después en código.
- Tus respuestas deben estar en el mismo idioma que el prompt inicial. Ej.: si el prompt inicial está en español, tus respuestas deben estar en español; si está en inglés, tus respuestas deben estar en inglés.

### Fase 1 — Entender el contexto

Antes de hacer preguntas sobre la feature, asegúrate de tener contexto del proyecto:

1. Lee el archivo de project-memory, si existe. Prueba en orden y para en el primer acierto: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `README.md`. Esto adapta el skill al agente que lo esté ejecutando (Claude Code, Codex, Gemini CLI, etc.).
2. Lista el contenido de `specs/` para ver qué specs ya existen y cómo están numerados.
3. Si existen specs previos, lee al menos los dos más recientes para captar las convenciones del proyecto.

Si el argumento `$ARGUMENTS` llega vacío, pide al usuario una descripción inicial de **una sola frase** de lo que quiere construir. Si la descripción no cabe en una frase, esa es la primera señal de que la feature es demasiado grande — sugiere dividirla antes de continuar.

### Fase 2 — Clarificar mediante preguntas

Esta es la fase más importante del comando. Tu trabajo aquí es **detectar ambigüedades y preguntar**, no asumir.

Haz preguntas en bloques de 3 a 5 a la vez (no una sola pregunta seguida de otra sola pregunta — eso es agotador). Después de cada bloque, espera una respuesta antes de continuar.

**Categorías de preguntas que siempre deberías considerar:**

- **Scope:** ¿Qué entra y qué NO? ¿Qué partes de la feature se difieren a otro spec?
- **Datos:** ¿Qué nuevas estructuras se introducen? ¿Cómo se nombran? ¿Dónde viven?
- **Integración:** ¿Esta feature depende de specs previos? ¿Modifica algo existente o solo añade?
- **Persistencia:** ¿Se guarda algo entre sesiones? ¿Dónde? ¿Con qué versionado?
- **UX y estados:** ¿Cómo se ve cuando funciona? ¿Cómo se ve cuando falla? ¿Hay estados intermedios?
- **Riesgos:** ¿Qué puede romper esto? ¿Qué pasa en el caso degradado?
- **Decisiones cerradas:** ¿Hay alguna decisión que el usuario ya tomó y no quiere reabrir?

**Cómo formular las preguntas:**

- Usa preguntas concretas, no abiertas. ❌ "¿Cómo imaginas la persistencia?" → ✅ "¿La persistencia es localStorage, IndexedDB, o un archivo JSON en disco?"
- Cuando ofrezcas opciones, da 2–4, marca cuál es tu recomendación y por qué.
- Si detectas una respuesta que abriría la caja de Pandora (ej. "y además queremos multijugador"), señala que merece su propio spec y pregunta si lo dejamos fuera del scope de este.

**Cuándo dejar de preguntar:**

Para cuando puedas responder estas tres preguntas sin asumir nada:

1. ¿Qué archivos van a aparecer o cambiar?
2. ¿Cuál es el primer paso ejecutable y cuál el último?
3. ¿Cómo verifico que la feature está terminada?

Si todavía no puedes responder una de ellas, sigue preguntando.

### Fase 3 — Desarrollar el spec sección por sección

Una vez que tengas claridad, **no generes el spec completo de un tirón**. Desarrollarás las secciones del template **una por una**, mostrando cada sección al usuario y esperando confirmación antes de pasar a la siguiente.

Orden estricto:

1. **Header** (estado, dependencias, fecha, objetivo en una frase). El objetivo de una frase es crítico — si no cabe en una frase, vuelve a la Fase 2.
2. **Scope** (qué entra y qué NO). El "no entra" debe ser explícito.
3. **Data model** (estructuras concretas con nombres reales). Si la feature no introduce datos nuevos, omite esta sección y dilo explícitamente.
4. **Plan de implementación** (pasos numerados, cada uno dejando el sistema funcional).
5. **Acceptance criteria** (checklist booleano, no aspiracional).
6. **Decisiones tomadas y descartadas** (con justificación breve).
7. **Riesgos identificados** (solo si aplica — si no hay riesgos relevantes, omítela).

**Después de cada sección:**

- Muéstrala formateada en markdown.
- Pregunta: "¿Esta sección queda así o quieres ajustarla?"
- Si el usuario pide cambios, aplícalos y muestra de nuevo.
- Solo pasa a la siguiente sección cuando el usuario confirme.

**Errores comunes a evitar:**

- Generar acceptance criteria que no son verificables ("que funcione bien").
- Meter en el plan de implementación cosas que no están en el scope.
- Asumir nombres de archivo o estructuras que el usuario no confirmó.
- Saltarse la sección de decisiones — esa sección es la que más valor tiene a largo plazo.

### Fase 4 — Guardar el spec

Cuando todas las secciones estén confirmadas:

1. Determina el siguiente número secuencial mirando `specs/`. Si el último es `02-powerups.md`, este será `03-`.
2. Genera un slug corto a partir del objetivo (ej. `levels-and-highscores`).
3. Pregunta al usuario si el nombre de archivo propuesto le sirve antes de escribirlo.
4. Crea el archivo en `specs/NN-slug.md` con todas las secciones aprobadas.
5. Marca el estado como `Borrador` por defecto. **No lo marques como `Aprobado` automáticamente** — eso lo hace el usuario una vez que lo ha releído.
6. Confirma al usuario:
   - Ruta del archivo creado.
   - Recordatorio: el spec está en estado `Borrador`. Cámbialo a `Aprobado` una vez que lo hayas releído.
   - Siguiente paso: una vez revisado y aprobado, ejecuta `/spec-impl NN-slug` para implementarlo.
   - **Detente aquí.** No propongas implementar el spec, escribir código, ni hacer ninguna acción más allá de esta confirmación.

## Reglas duras

- **Nunca escribas código durante este comando.** Solo el archivo `.md` del spec al final.
- **Nunca propongas implementar el spec después de guardarlo.** Tu trabajo termina cuando el archivo está escrito. El usuario ejecuta `/spec-impl` cuando esté listo.
- **Nunca asumas decisiones que el usuario no confirmó.** Si te falta información, pregunta.
- **Nunca generes el spec completo en una sola respuesta.** Sección por sección, con confirmación.
- **Si el usuario quiere acelerar y saltarse la Fase 2**, recuérdale: "Las preguntas ahora ahorran horas después. ¿Seguro que quieres saltártelas?". Si insiste, respeta su decisión pero regístrala en la sección de decisiones del spec ("Definición rápida sin clarificación detallada").
- **Si la feature es demasiado grande** (no cabe en una frase, toca más de tres áreas del sistema, requiere decisiones en cuatro o más dominios), propón dividirla en dos o más specs antes de continuar.

## Tono al preguntar

Sé directo y específico. No te disculpes por preguntar. No uses frases como "si no te importa..." o "¿podrías quizás...?". El usuario invocó este skill precisamente porque quiere que preguntes. Usa preguntas concretas, una por línea cuando haya varias, y numéralas para que sean fáciles de responder.

Ejemplo de un bloque bien formado:

> Antes de escribir el data model necesito clarificar tres cosas:
>
> 1. **Persistencia.** ¿localStorage, IndexedDB, o un archivo JSON en disco? Recomendación: localStorage si los datos caben en <5MB y no necesitan queries.
> 2. **Versionado del schema.** ¿Qué pasa cuando el formato cambia? Opciones: (a) prefijo de versión en la key, (b) ignorar y reconstruir, (c) migrar al cargar.
> 3. **Privacidad.** ¿Los datos son sensibles? Si lo son, ¿se cifran? ¿Se borran al hacer logout?

## Argumentos

Si el usuario invocó `/spec levels-and-highscores`, usa `levels-and-highscores` como sugerencia inicial de slug, pero confirma con el usuario antes de escribir el archivo.

Si invocó `/spec` sin argumentos, empieza pidiendo la descripción de una frase.
