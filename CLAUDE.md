# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Todo el contenido de este repo (specs, comentarios, commits, este archivo) se escribe en **español**.

## Qué es este proyecto

Juego de Arkanoid en **HTML, CSS y JavaScript con cero dependencias**, jugable en el navegador.
El juego **todavía no está implementado**: por ahora el repo solo contiene los assets y el
andamiaje del flujo de trabajo spec-driven. No hay `index.html`, ni `package.json`, ni
sistema de build, ni framework. La restricción de cero dependencias es un requisito de diseño,
no una circunstancia temporal — no introduzcas npm, bundlers ni librerías externas.

## Cómo se ejecuta y se prueba

- No hay paso de build ni de bundling. Una vez exista `index.html`, el juego corre abriéndolo
  directamente en el navegador (o sirviéndolo con un servidor estático cualquiera; los assets
  se cargan por ruta relativa `assets/...`, así que `file://` puede fallar al cargar la imagen
  o los sonidos — prefiere un servidor estático local para probar).
- No hay framework de tests configurado. La verificación es manual y se define en los
  *acceptance criteria* de cada spec (checklist booleano que se valida jugando).

## Flujo de trabajo spec-driven (importante)

El trabajo grande NO se improvisa en código. Se sigue un ciclo de dos fases con skills
personalizados que viven en `.claude/skills/`:

1. **`/spec <descripción>`** — Diseña un spec sección por sección haciendo preguntas de
   clarificación primero. **No escribe código.** Guarda el resultado en `specs/NN-slug.md`
   (numeración secuencial) en estado `Borrador`. La plantilla canónica está en
   `.claude/skills/spec/template.md`.
2. **Revisión humana** — El usuario relee el spec y cambia manualmente el estado a `Aprobado`.
   Un agente nunca marca un spec como aprobado.
3. **`/spec-impl <NN-slug>`** — Implementa un spec. **Bloqueo intencional:** solo procede si el
   estado significa "Aprobado". Crea y se cambia a la rama `spec-NN-slug`, luego implementa
   paso a paso pausando tras cada paso para revisar el diff.

Estados válidos del header de un spec: `Borrador`, `En revisión`, `Aprobado`, `Implementado`,
`Obsoleto`. Cada spec deja el sistema funcional en cada paso del plan; los pasos son
commiteables de forma individual.

La carpeta `specs/` aún no existe — la crea el primer `/spec` que se ejecute.

## Assets y API de sprites

- `assets/spritesheet-breakout.png` — spritesheet único con paddle, pelota, bloques de colores
  y frames de explosión.
- `assets/spritesheet.js` — define las coordenadas de recorte y la API de render. Es vanilla JS
  con `<script>` global (sin módulos ES): expone funciones globales, no exports.
  - `loadSpritesheet(cb)` — carga la imagen de forma asíncrona y la copia a un canvas offscreen;
    invoca `cb` cuando está lista (encola callbacks si aún no cargó). **Hay que esperar a este
    callback antes de dibujar** — `drawSprite`/`drawFrame` no hacen nada (`return` silencioso)
    si la hoja no terminó de cargar.
  - `drawSprite(ctx, name, x, y, w, h)` — dibuja un sprite con nombre. Los bloques usan el
    prefijo `block_` (p.ej. `block_red`, `block_cyan`); el resto son nombres directos
    (`paddle`, `ball`).
  - `drawFrame(ctx, frame, x, y, w, h)` — dibuja un frame arbitrario `{sx, sy, sw, sh}`, usado
    para la animación de explosiones (`EXPLOSION_FRAMES` por color, `EXPLOSION_DURATION` en ms).
- `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3` — efectos de sonido.

Nota: `assets/` es un working directory adicional del proyecto.
