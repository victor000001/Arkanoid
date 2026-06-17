# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Todo el contenido de este repo (specs, comentarios, commits, este archivo) se escribe en **español**.

## Qué es este proyecto

Juego de Arkanoid en **HTML, CSS y JavaScript con cero dependencias**, jugable en el navegador.
El **MVP ya está implementado** (spec `01-mvp-jugable`, estado `Implementado`): paddle controlado
por teclado, pelota con rebotes, rejilla de bloques de un golpe, explosiones, 3 vidas y pantallas
de victoria/game over con reinicio. No hay `package.json`, ni sistema de build, ni framework, y
así debe seguir: la restricción de cero dependencias es un requisito de diseño, no una
circunstancia temporal — no introduzcas npm, bundlers ni librerías externas.

## Cómo se ejecuta y se prueba

- No hay paso de build ni de bundling. El juego corre abriendo `index.html` directamente en el
  navegador (o sirviéndolo con un servidor estático cualquiera; los assets se cargan por ruta
  relativa `assets/...`, así que `file://` puede fallar al cargar la imagen o los sonidos —
  prefiere un servidor estático local para probar).
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

La carpeta `specs/` ya existe. Specs actuales:

- `specs/01-mvp-jugable.md` — MVP jugable de Arkanoid. Estado: `Implementado`.

Además del ciclo spec-driven, el skill **`/actualizar-docs`** mantiene `CLAUDE.md` y `README.md`
sincronizados con el estado real del repo (no toca código de la aplicación).

## Estructura del código

Tres archivos en la raíz, sin módulos ES (todo con `<script>` global):

- `index.html` — canvas `800×600` y los dos `<script>`: primero `assets/spritesheet.js`, luego
  `game.js`.
- `styles.css` — centra el canvas en la página y le da fondo (`image-rendering: pixelated`).
- `game.js` — toda la lógica del juego. El estado vive en objetos globales (`game`, `paddle`,
  `ball`, `blocks`, `explosions`) con las constantes de configuración al inicio del archivo. El
  bucle es `update()` (física: movimiento, rebotes, colisiones, vidas/victoria) + `draw()`
  (render de sprites, HUD de vidas y overlays de fin), encadenados con `requestAnimationFrame`.
  El bucle arranca **dentro** del callback de `loadSpritesheet` para no dibujar antes de que
  cargue la hoja. Estados de `game.state`: `'ready'` | `'playing'` | `'won'` | `'gameover'`.

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
