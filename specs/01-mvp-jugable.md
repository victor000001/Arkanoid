# 01 — MVP jugable de Arkanoid

| Campo | Valor |
|---|---|
| **Estado** | Implementado |
| **Dependencias** | Ninguna (primer spec). Usa `assets/spritesheet.js`, `assets/spritesheet-breakout.png` y `assets/sounds/*.mp3` ya existentes. |
| **Fecha** | 2026-06-17 |
| **Objetivo (una frase)** | Un Arkanoid mínimo jugable en el navegador: paddle controlado por teclado, una pelota que rebota, una rejilla de bloques de un solo golpe, 3 vidas, y pantallas de victoria y game over con reinicio por tecla. |

---

## Scope

### Qué entra

- **Área de juego:** canvas de **800×600** dibujado con la API de `spritesheet.js` (sprites de paddle, pelota y bloques).
- **Paddle:** se mueve horizontalmente con las **flechas ←/→**, limitado a los bordes del canvas.
- **Pelota:** empieza **pegada al paddle**; se lanza con **Espacio**. Rebota en las tres paredes (superior, izquierda, derecha) y en el paddle. Cae por el borde inferior = pierde vida.
- **Bloques:** una **rejilla llena que ocupa el ancho**, con **un color por fila** (de entre `red, yellow, cyan, magenta, hotpink, green`). Cada bloque se rompe de **un solo golpe**.
- **Animación de explosión:** al romper un bloque se reproduce la animación `EXPLOSION_FRAMES` del color correspondiente (`drawFrame`, `EXPLOSION_DURATION`).
- **Vidas:** **3 vidas**. Al perder la pelota, vuelve a pegarse al paddle para el siguiente saque.
- **Condición de victoria:** destruir **todos** los bloques muestra pantalla de victoria.
- **Game over:** llegar a **0 vidas** muestra pantalla de game over.
- **Reinicio:** desde la pantalla de fin (victoria o game over), una **tecla reinicia** todo el estado y vuelve a empezar.
- **Sonido:** `ball-bounce.mp3` al rebotar y `break-sound.mp3` al romper un bloque.
- **Archivos nuevos:** `index.html`, `styles.css`, `game.js`.

### Qué NO entra (se difiere a otros specs)

- **Puntuación** y marcador en pantalla.
- **Múltiples niveles** y progresión entre ellos.
- **Power-ups** (multibola, paddle largo, etc.).
- **Bloques resistentes** (varios golpes) o indestructibles.
- **Control por ratón** y soporte táctil/móvil.
- **Persistencia** (high-scores, guardado entre sesiones).
- **Menú de inicio**, pausa, dificultad o ajustes.
- **Música de fondo.**

---

## Data model

Toda la lógica vive en `game.js` con `<script>` global (sin módulos ES). El estado del juego se mantiene en un único objeto `game` más estructuras de apoyo. Coordenadas en píxeles del canvas.

### Constantes de configuración

```js
const CANVAS_W = 800, CANVAS_H = 600;

const PADDLE_W = 100, PADDLE_H = 16;
const PADDLE_Y = CANVAS_H - 40;      // distancia fija al borde inferior
const PADDLE_SPEED = 7;              // px por frame

const BALL_SIZE = 14;
const BALL_SPEED = 5;                // magnitud de velocidad inicial

const BLOCK_W = 64, BLOCK_H = 24;    // tamaño dibujado (sprite nativo 32×16, escalado)
const BLOCK_COLS = 10;
const BLOCK_GAP = 4;                 // separación entre bloques
const BLOCK_TOP = 60;                // margen superior de la rejilla
const ROW_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'green'];  // 5 filas, color por fila

const LIVES_START = 3;
```

> Nota: con `BLOCK_COLS = 10`, `BLOCK_W = 64` y `BLOCK_GAP = 4` la rejilla ocupa 10×64 + 9×4 = 676 px, centrada en los 800 de ancho. Son valores propuestos; ajustables.

### Estado del paddle

```js
const paddle = { x, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H, dx: 0 };  // dx = -1, 0, +1 según teclas
```

### Estado de la pelota

```js
const ball = {
  x, y,            // posición (esquina superior izq.)
  vx, vy,          // velocidad
  size: BALL_SIZE,
  stuck: true      // true = pegada al paddle, esperando saque con Espacio
};
```

### Bloques

Array de objetos; los rotos se marcan con `alive = false` (no se eliminan del array, así el render y la detección de victoria son simples).

```js
const blocks = [
  { x, y, w: BLOCK_W, h: BLOCK_H, color: 'red', alive: true },
  // ...
];
```

### Explosiones activas

Animaciones temporizadas independientes del array de bloques. Cada una guarda cuándo empezó para elegir el frame según el tiempo transcurrido vs `EXPLOSION_DURATION`.

```js
const explosions = [
  { x, y, w: BLOCK_W, h: BLOCK_H, color: 'red', startedAt: <timestamp ms> }
];
```

### Estado global del juego

```js
const game = {
  state: 'ready',   // 'ready' | 'playing' | 'won' | 'gameover'
  lives: LIVES_START
};
```

- `'ready'` — pelota pegada, esperando saque (al inicio y tras perder una vida).
- `'playing'` — pelota en movimiento.
- `'won'` — todos los bloques destruidos; pantalla de victoria.
- `'gameover'` — 0 vidas; pantalla de game over.

### Input

```js
const keys = { left: false, right: false };  // estado de flechas, actualizado en keydown/keyup
```

### Audio

```js
const sndBounce = new Audio('assets/sounds/ball-bounce.mp3');
const sndBreak  = new Audio('assets/sounds/break-sound.mp3');
```

---

## Plan de implementación

Cada paso deja el sistema en un estado **funcional y verificable abriendo `index.html`**, y es **commiteable de forma individual**.

**Paso 1 — Andamiaje y carga del spritesheet.**
Crear `index.html` (canvas 800×600, `<script>` de `assets/spritesheet.js` y de `game.js`), `styles.css` (centrar el canvas, fondo) y `game.js` con el bucle de render vacío. Llamar a `loadSpritesheet(cb)` y arrancar el `requestAnimationFrame` **dentro del callback** (no dibujar antes de que cargue).
*Verificable:* la página abre, se ve el canvas vacío sin errores en consola.

**Paso 2 — Paddle dibujado y movible.**
Definir constantes y el objeto `paddle`. Dibujarlo con `drawSprite(ctx, 'paddle', ...)`. Capturar `keydown`/`keyup` de flechas en `keys` y mover el paddle en el bucle, limitándolo a los bordes.
*Verificable:* el paddle aparece y se mueve con ←/→ sin salirse del canvas.

**Paso 3 — Pelota pegada y saque.**
Añadir el objeto `ball` con `stuck: true`, dibujarla con `drawSprite(ctx, 'ball', ...)` siguiendo al paddle mientras está pegada. Al pulsar Espacio, `stuck = false`, asignar `vx/vy` iniciales y pasar `game.state` a `'playing'`.
*Verificable:* la pelota descansa sobre el paddle, lo sigue, y sale disparada al pulsar Espacio.

**Paso 4 — Rebotes en paredes y paddle.**
Integrar movimiento de la pelota (`x += vx`, `y += vy`). Rebote en paredes superior, izquierda y derecha (invertir componente). Rebote en el paddle, con dirección dependiente del punto de impacto (centro = recto, extremos = más angulado). Reproducir `sndBounce` en cada rebote.
*Verificable:* la pelota rebota correctamente en las tres paredes y en el paddle; el ángulo varía según dónde golpea.

**Paso 5 — Rejilla de bloques y colisión/destrucción.**
Generar el array `blocks` (5 filas × 10 columnas, color por fila, centrada). Dibujarlos con `drawSprite(ctx, 'block_' + color, ...)`. Detectar colisión pelota-bloque: marcar `alive = false`, invertir la velocidad de la pelota según el lado golpeado, reproducir `sndBreak`.
*Verificable:* los bloques se dibujan; la pelota los destruye al golpearlos y rebota; suena el efecto de romper.

**Paso 6 — Animación de explosión.**
Al romper un bloque, empujar una entrada a `explosions` con `startedAt`. En el render, dibujar cada explosión con `drawFrame` seleccionando el frame según el tiempo transcurrido; eliminarla al superar `EXPLOSION_DURATION`.
*Verificable:* al romper un bloque se ve la animación de explosión de su color y luego desaparece.

**Paso 7 — Vidas y pérdida de pelota.**
Cuando la pelota cae por debajo del borde inferior, decrementar `game.lives`. Si quedan vidas, volver a pegar la pelota (`stuck = true`, estado `'ready'`); si llega a 0, estado `'gameover'`. Mostrar las vidas restantes en pantalla (texto simple).
*Verificable:* perder la pelota resta una vida y la repega; a las 3 caídas el juego entra en game over.

**Paso 8 — Pantallas de fin, victoria y reinicio.**
Detectar victoria cuando no queda ningún bloque `alive` → estado `'won'`. Dibujar overlay de texto para `'won'` y `'gameover'` ("Pulsa Espacio para jugar de nuevo"). Implementar `resetGame()` que reconstruye paddle, pelota, bloques, vidas y estado, invocado con la tecla de reinicio.
*Verificable:* destruir todos los bloques muestra victoria; 0 vidas muestra game over; la tecla reinicia una partida completa desde cero.

---

## Acceptance criteria

Checklist booleano, verificable jugando con `index.html` abierto en el navegador (servido desde un servidor estático local):

- [x] La página carga sin errores en consola y muestra un canvas de 800×600.
- [x] El paddle se dibuja con su sprite y se mueve con ←/→.
- [x] El paddle no se sale por los bordes izquierdo ni derecho.
- [x] Al inicio la pelota aparece pegada al paddle y lo sigue al moverse.
- [x] Pulsar Espacio lanza la pelota; deja de seguir al paddle.
- [x] La pelota rebota en las paredes superior, izquierda y derecha.
- [x] La pelota rebota en el paddle, y el ángulo de salida varía según el punto de impacto.
- [x] Suena `ball-bounce.mp3` en cada rebote.
- [x] Se dibuja una rejilla de 5 filas × 10 columnas, con un color distinto por fila.
- [x] La pelota destruye un bloque al golpearlo y rebota correctamente.
- [x] Suena `break-sound.mp3` al romper un bloque.
- [x] Al romper un bloque se reproduce la animación de explosión de su color y luego desaparece.
- [x] Empiezas con 3 vidas, indicadas en pantalla.
- [x] Si la pelota cae por abajo, se pierde una vida y la pelota vuelve a pegarse al paddle.
- [x] Al llegar a 0 vidas aparece la pantalla de game over.
- [x] Al destruir todos los bloques aparece la pantalla de victoria.
- [x] Desde cualquiera de las dos pantallas de fin, la tecla de reinicio empieza una partida nueva con 3 vidas y la rejilla completa.

---

## Decisiones tomadas y descartadas

### Tomadas

- **Sin puntuación en el MVP.** Se prioriza el bucle jugable (mover, rebotar, romper, ganar/perder). El marcador se añade después sin tocar el núcleo.
- **Un solo nivel fijo, rejilla llena con color por fila.** Disposición clásica, fácil de generar por código y de verificar visualmente. Los niveles múltiples y patrones personalizados van a otro spec.
- **Bloques de un solo golpe.** Evita introducir estado de "salud" por bloque; los bloques resistentes se difieren.
- **Control solo por teclado (flechas).** Determinista y fácil de probar manualmente. Ratón y táctil se difieren.
- **3 vidas, pelota pegada con saque por Espacio.** Da control al jugador sobre el momento del lanzamiento y un estado `'ready'` claro tras cada pérdida.
- **Animación de explosión incluida** (en lugar de desaparición simple). Aprovecha los assets `EXPLOSION_FRAMES` ya disponibles para mejorar el feel; el coste es una pequeña gestión de animaciones temporizadas (array `explosions`).
- **Reinicio in-game por tecla** (en vez de recargar la página). Mejor UX y obliga a una función `resetGame()` que centraliza la inicialización del estado.
- **Tres archivos separados** (`index.html`, `styles.css`, `game.js`). Más mantenible que todo inline, sin la complejidad de varios `<script>` globales que tendrían los "módulos".
- **Bloques rotos marcados con `alive = false`** en lugar de eliminarlos del array. Simplifica el render y la detección de victoria (no quedan bloques `alive`).

### Descartadas

- **localStorage / persistencia de high-scores** — no hay nada que persistir sin puntuación; se difiere junto con ella.
- **Menú de inicio y pausa** — fuera del mínimo jugable.
- **Música de fondo** — solo efectos de rebote y rotura.
- **Bundler / npm / framework** — restricción de diseño del proyecto: cero dependencias.

---

## Riesgos identificados

- **Carga por `file://` falla con assets.** Abrir `index.html` directamente puede impedir que el navegador cargue la imagen del spritesheet o los sonidos (política de origen para recursos locales). *Mitigación:* probar siempre con un servidor estático local; documentarlo en el spec y en el README cuando exista.

- **Dibujar antes de que cargue el spritesheet.** `drawSprite`/`drawFrame` hacen `return` silencioso si la hoja no terminó de cargar — se vería un canvas vacío sin error. *Mitigación:* arrancar el bucle de `requestAnimationFrame` **dentro** del callback de `loadSpritesheet` (ya recogido en el Paso 1).

- **Tunneling de la pelota a velocidad alta.** Si `BALL_SPEED` es grande respecto al tamaño de bloque/paddle, la pelota podría "atravesar" un bloque o el paddle entre frames sin detectar colisión. *Mitigación:* mantener la velocidad moderada (`BALL_SPEED = 5`) frente a `BLOCK_H/PADDLE_H`; si aparece, considerar submuestreo del movimiento. Aceptable para el MVP.

- **Múltiples colisiones de bloque en un mismo frame.** Si la pelota solapa dos bloques a la vez, romper ambos e invertir la velocidad dos veces puede producir un rebote incorrecto. *Mitigación:* procesar como máximo una colisión de bloque por frame (romper el primero detectado e invertir una sola vez).

- **Solape de audio en rebotes rápidos.** Reproducir el mismo objeto `Audio` en rebotes muy seguidos puede cortar el sonido anterior. *Mitigación:* reiniciar `currentTime = 0` antes de `play()`; aceptable para el MVP sin pool de audio.

- **Sensación de la pelota "pegada" si el rebote del paddle es puramente vertical.** Un rebote sin componente horizontal mínima puede hacer que la pelota quede rebotando en vertical de forma aburrida. *Mitigación:* el ángulo dependiente del punto de impacto (Paso 4) ya introduce variación; garantizar un `vx` mínimo si fuese necesario.
