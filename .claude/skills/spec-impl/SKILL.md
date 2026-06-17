---
name: spec-impl
description: Implementa un spec aprobado. Valida que el estado significa "Aprobado" (en cualquier idioma), crea una rama git con el nombre del spec, se cambia a ella e inicia la implementación paso a paso con pausas para revisar diffs.
disable-model-invocation: true
argument-hint: <NN-nombre-del-spec>
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl — Implementador de specs aprobados

## Contexto de sesión

Estado actual del repositorio:
!`git status --short`

Rama actual:
!`git branch --show-current`

Specs disponibles en esta carpeta:
!`ls specs/ 2>/dev/null || echo "La carpeta specs/ no existe"`

---

## Instrucciones

Sigue estas cuatro fases en orden estricto. **No avances a la siguiente fase si la anterior no se completó correctamente.**

---

### Fase 1 — Identificar el spec

El argumento recibido es: `$ARGUMENTS`

Si `$ARGUMENTS` está vacío:

- Lista los archivos disponibles en `specs/` (ya los tienes arriba).
- Pide al usuario que especifique el nombre exacto del spec.
- Detente y espera una respuesta. No continúes.

Si `$ARGUMENTS` tiene un valor:

- Busca el archivo en `specs/`. El usuario puede haber escrito el nombre completo (`01-mvp`), solo el número (`01`), o solo el slug (`mvp`). Intenta encontrar el archivo correcto en cualquiera de esos casos.
- Si no encuentras el archivo, muestra los specs disponibles y pide al usuario que corrija el nombre.
- Si lo encuentras, continúa a la Fase 2.

---

### Fase 2 — Validar el estado del spec

Lee el archivo del spec que localizaste en la Fase 1 usando la herramienta Read o `cat`.

En el contenido del archivo, busca la línea que contiene el estado del spec. La etiqueta del header normalmente es `**Estado:**` (español) o `**Status:**` (inglés), pero puede usar cualquier idioma. Identifícala por posición (la línea de estado cerca del inicio del spec) y por la state machine que la rodea, no por la etiqueta exacta.

La línea lista las cinco opciones, cada una con una casilla, y la opción activa está marcada con `[x]` (las demás con `[ ]`). **El estado del spec es la opción que tiene la `[x]`.** Ejemplo: `[ ] Borrador  [ ] En revisión  [x] Aprobado  [ ] Implementado  [ ] Obsoleto` significa estado `Aprobado`.

Si no hay ninguna casilla marcada, o hay más de una `[x]`, el header está mal formado: detente y pídele al usuario que deje exactamente una `[x]` antes de continuar.

**Regla absoluta:** Solo puedes continuar si el estado **significa "Aprobado"** — sin importar el idioma usado.

Trata cualquiera de los siguientes (y sus equivalentes en otros idiomas) como el estado **Aprobado** y continúa:

- Español: `Aprobado`
- Inglés: `Approved`
- Portugués: `Aprovado`
- Francés: `Approuvé`
- Alemán: `Genehmigt`
- Italiano: `Approvato`
- …o la palabra de cualquier otro idioma que claramente signifique "aprobado"

Cualquier otra cosa (Borrador / Draft, En revisión / In review, Implementado / Implemented, Obsoleto / Obsolete, o cualquier valor no reconocido) significa **detente** y muestra el mensaje de error de abajo.

| Categoría de estado                          | Ejemplos (cualquier idioma)                       | Acción                                                                       |
| -------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| Aprobado                                     | `Aprobado`, `Approved`, `Aprovado`, `Approuvé`, … | Continúa a la Fase 3.                                                        |
| Borrador                                     | `Borrador`, `Draft`, …                            | Detente. Muestra el mensaje de error de abajo.                              |
| En revisión                                  | `En revisión`, `In review`, …                     | Detente. Muestra el mensaje de error de abajo.                              |
| Implementado                                 | `Implementado`, `Implemented`, …                  | Detente. Muestra el mensaje de error de abajo.                              |
| Obsoleto                                     | `Obsoleto`, `Obsolete`, …                         | Detente. Muestra el mensaje de error de abajo.                              |
| Línea de estado no encontrada / valor no reconocido | —                                          | Detente. El archivo no sigue el formato esperado. Indícaselo al usuario.    |

Si no estás seguro de si un valor significa "aprobado", **no asumas**. Detente y pide al usuario que lo clarifique o que actualice el spec a la redacción canónica.

**Mensaje de error estándar cuando el estado no significa Aprobado:**

```
❌ No puedo implementar este spec.

Estado actual: [ESTADO ENCONTRADO]
Solo trabajo con specs cuyo estado significa "Aprobado" (ej. `Aprobado`, `Approved`,
o el equivalente en otro idioma).

Para continuar tienes dos opciones:
  1. Si el spec está listo para implementarse, ábrelo y cambia el estado
     a "Aprobado" (o el término equivalente que use tu equipo) manualmente.
     Ese cambio lo hace el humano, no el agente.
  2. Si el spec todavía necesita trabajo, usa /spec [nombre] para retomarlo.
```

No ofrezcas alternativas, no sugieras "igual puedo empezar si quieres". El bloqueo es intencional.

---

### Fase 3 — Crear la rama git y cambiarse a ella

Una vez que hayas confirmado que el estado significa `Aprobado`:

1. Deriva el nombre de la rama del nombre completo del archivo del spec, sin la extensión. Formato: `spec-NN-slug`. Ejemplos:

   - `01-mvp.md` → rama `spec-01-mvp`
   - `02-exportar-datos.md` → rama `spec-02-exportar-datos`

2. Comprueba si la rama ya existe:

   - Si **no existe**: créala con `git checkout -b spec-NN-slug`.
   - Si **ya existe**: informa al usuario de que la rama ya existía (puede significar que se está retomando trabajo previo).
   - En ambos casos: cámbiate a la rama con `git checkout spec-NN-slug` y confirma que el cambio fue exitoso antes de continuar.

3. Confirma visualmente al usuario que la rama se creó y que estás en ella:

   ```
   ✅ Listo para implementar.

   Spec:   specs/NN-slug.md
   Rama:   spec-NN-slug  (activa)
   Estado: Aprobado   (← repite el valor real encontrado en el spec)
   ```

4. **No empieces a implementar todavía.** Primero muestra el resumen del spec al usuario para que lo tenga fresco. Extrae y muestra:
   - El **objetivo** (la línea después de `**Objetivo:**` / `**Objective:**` / etiqueta equivalente).
   - El **scope** (la sección `## Scope` / `## Alcance` / equivalente).
   - El **plan de implementación** (la sección con los pasos numerados — `## Plan de implementación` / `## Implementation plan` / equivalente).
   - Los **acceptance criteria** (el checklist — `## Acceptance criteria` / `## Criterios de aceptación` / equivalente).

Identifica los títulos de sección por significado, no por la redacción exacta — el spec puede estar escrito en cualquier idioma.

---

### Fase 4 — Implementar paso a paso

Después de mostrar el resumen del spec, dile al usuario:

```
Voy a implementar el spec siguiendo el plan de implementación exactamente.
Pausaré después de cada paso para que puedas revisar el diff.

¿Empezamos con el Paso 1?
```

Espera confirmación explícita ("sí", "adelante", "dale", o equivalente). No empieces sin ella.

Una vez confirmado, sigue estas reglas durante toda la implementación:

**Una regla por encima de todas:** implementa lo que el spec dice. Si algo en el spec te parece subóptimo, menciónalo como observación pero implementa lo acordado. Los cambios al spec van al spec, no al código por sorpresa.

**Ritmo de trabajo:**

- Implementa un paso del plan.
- Muestra un resumen de qué archivos tocaste y qué hiciste.
- Di: `Paso N completado. ¿Puedes revisar el diff y decirme si continúo con el Paso N+1?`
- Espera confirmación antes de continuar.

**Si durante la implementación encuentras una ambigüedad** que el spec no resuelve:

- Detente.
- Describe la ambigüedad exactamente.
- Presenta dos o tres opciones concretas.
- Espera la decisión del usuario.
- No improvises.

**Si el usuario pide algo que está fuera del scope del spec:**

- Recuérdale que está fuera del scope de este spec.
- Sugiere anotarlo para el siguiente spec.
- No lo implementes en esta rama.

**Al terminar el último paso:**

```
✅ Todos los pasos del plan están implementados.

Siguiente paso: verificar los acceptance criteria del spec uno por uno.
Si todos pasan, mueve la `x` del estado a `[x] Implementado` (o el equivalente
en el idioma de tu repo) y haz el commit final antes de mergear esta rama.
```

---

## Resumen del comportamiento esperado

```
/spec-impl 01-mvp

  Fase 1  →  Encuentra specs/01-mvp.md
  Fase 2  →  Lee el estado → "Aprobado" (o "Approved", etc.) → ✅ continúa
  Fase 3  →  git checkout -b spec-01-mvp → git checkout spec-01-mvp
             Muestra objetivo, scope, plan y criterios
  Fase 4  →  Implementa paso a paso con pausas
             Termina recordando verificar los acceptance criteria

/spec-impl 02-exportar-datos  (estado: Borrador / Draft)

  Fase 1  →  Encuentra specs/02-exportar-datos.md
  Fase 2  →  Lee el estado → "Borrador" → ❌ se detiene
             Muestra el mensaje de error estándar
             No crea rama, no toca código
```
