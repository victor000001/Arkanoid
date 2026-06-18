# SPEC 02 — Pausar y reanudar el juego

> **Estado:** [x] Borrador  [ ] En revisión  [ ] Aprobado  [ ] Implementado  [ ] Obsoleto
> **Depende de:** SPEC 01 · **Fecha:** 2026-06-17
> **Objetivo:** Permitir pausar y reanudar la partida en curso con `P` o `Escape`, congelando la simulación y mostrando un overlay de pausa.

---

## Scope

**Entra:**

- **Nuevo estado `'paused'`** en `game.state`, alcanzable únicamente desde `'playing'`.
- **Toggle de pausa** con las teclas `P` y `Escape`: en `'playing'` → pausa; en `'paused'` → reanuda.
- **Congelar la simulación** mientras está pausado: el paddle no se mueve, la pelota no avanza, no hay colisiones ni cambios de estado.
- **Overlay de pausa** reutilizando el estilo de `drawEndScreen` (capa semitransparente + texto), con el mensaje "Pausa" y la instrucción para reanudar.
- **Reanudar** devuelve el juego a `'playing'` exactamente en el punto donde se pausó (misma posición de paddle, pelota y velocidades).

**Fuera de scope (para specs futuros):**

- Pausar desde `'ready'`, `'won'` o `'gameover'` (no aplica: no hay simulación activa que congelar).
- **Menú de pausa** con opciones (reiniciar, salir, ajustes de volumen, etc.).
- **Pausa automática** al perder el foco de la ventana (`blur`).
- **Corrección del tiempo de las explosiones** durante la pausa (se ignora el desfase, decisión confirmada).
- Cualquier botón en pantalla o control por ratón/táctil para pausar.

---

## Data model

Esta feature **no introduce nuevas estructuras de datos**. Reutiliza el objeto `game` del SPEC 01 y solo amplía los valores válidos de `game.state`:

```js
const game = {
  state: 'ready',   // 'ready' | 'playing' | 'paused' | 'won' | 'gameover'
  lives: LIVES_START
};
```

- **`'paused'`** (nuevo) — la simulación está congelada; solo se alcanza desde `'playing'` y solo vuelve a `'playing'`.

No hay constantes nuevas ni estado adicional. La transición es puramente un cambio de `game.state`.

---

## Plan de implementación

Cada paso deja el sistema funcional y verificable abriendo `index.html`, y es commiteable de forma individual.

**Paso 1 — Toggle de pausa en el input.**
En el handler de `keydown`, añadir la detección de `P`/`p` y `Escape`: si `game.state === 'playing'` → `game.state = 'paused'`; si `game.state === 'paused'` → `game.state = 'playing'`. Considerar también mayúscula/minúscula de la tecla (`e.key === 'p' || e.key === 'P'`).
*Verificable:* durante el juego, pulsar `P` o `Escape` cambia `game.state` a `'paused'` y de vuelta a `'playing'` (comprobable desde la consola o por el comportamiento de los pasos siguientes).

**Paso 2 — Congelar la simulación.**
En `update()`, añadir `game.state === 'paused'` a la guarda temprana de retorno (junto a `'gameover'` y `'won'`) para que no se simule nada mientras está pausado.
*Verificable:* al pausar, el paddle deja de responder a las flechas y la pelota se queda quieta; al reanudar, todo continúa desde el mismo punto.

**Paso 3 — Overlay de pausa.**
En `draw()`, cuando `game.state === 'paused'`, dibujar un overlay reutilizando el estilo de `drawEndScreen`. Para evitar duplicar el mensaje fijo ("Pulsa Espacio para jugar de nuevo") de `drawEndScreen`, parametrizar o crear una variante que muestre "Pausa" como título y "Pulsa P o Escape para continuar" como subtítulo.
*Verificable:* al pausar se ve la capa semitransparente con "Pausa"; al reanudar el overlay desaparece y el juego sigue.

---

## Acceptance criteria

Checklist booleano, verificable jugando con `index.html` abierto (servido desde un servidor estático local):

- [ ] Durante el juego (`'playing'`), pulsar `P` pausa la partida y aparece el overlay de pausa.
- [ ] Durante el juego, pulsar `Escape` también pausa la partida.
- [ ] Estando en pausa, pulsar `P` reanuda la partida y el overlay desaparece.
- [ ] Estando en pausa, pulsar `Escape` también reanuda la partida.
- [ ] Mientras está pausado, el paddle no se mueve aunque se pulsen las flechas.
- [ ] Mientras está pausado, la pelota no avanza ni rebota.
- [ ] Al reanudar, el paddle, la pelota y sus velocidades continúan exactamente desde donde se pausó.
- [ ] El overlay de pausa muestra el título "Pausa" y la instrucción para continuar, con el estilo semitransparente de `drawEndScreen`.
- [ ] Pulsar `P` o `Escape` en estado `'ready'`, `'won'` o `'gameover'` no activa la pausa.
- [ ] La tecla `Espacio` (saque/reinicio) sigue funcionando como antes y no se ve afectada por la pausa.

---

## Decisiones tomadas y descartadas

### Tomadas

- **Nuevo estado `'paused'`** en lugar de un flag booleano aparte (`game.paused`). Mantiene una única fuente de verdad (`game.state`) y encaja con las guardas existentes de `update()` y los overlays de `draw()`.
- **Pausa solo desde `'playing'`.** En `'ready'` no hay simulación que congelar y en `'won'`/`'gameover'` la partida ya terminó; restringirlo evita estados ambiguos.
- **Toggle con la misma tecla** (`P` y `Escape`). Menos teclas que recordar; el mismo gesto pausa y reanuda.
- **Dos teclas (`P` y `Escape`)** en vez de una. `P` es el estándar de "pause" y `Escape` es el reflejo natural de muchos jugadores; ambas son baratas de soportar.
- **Reutilizar el estilo de `drawEndScreen`** (parametrizándolo o con una variante) en vez de inventar un overlay nuevo. Coherencia visual y mínimo código.
- **Ignorar el desfase temporal de las explosiones** durante la pausa. Las explosiones duran <1s (`EXPLOSION_DURATION`); el coste visual es despreciable y corregirlo exigiría reescalar timestamps. Cambio mínimo.

### Descartadas

- **Flag `game.paused` separado** — duplicaría la fuente de verdad del estado y obligaría a comprobar dos campos en cada guarda.
- **Menú de pausa con opciones** (reiniciar/salir/volumen) — fuera del mínimo; va en su propio spec si llega.
- **Pausa automática al perder el foco (`blur`)** — comportamiento extra no pedido; se difiere.
- **Corregir el tiempo de las explosiones al reanudar** — overengineering para un efecto sub-segundo.
