// Arkanoid — MVP jugable
// Toda la lógica vive aquí con <script> global (sin módulos ES).

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

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// --- Audio ---
const sndBounce = new Audio('assets/sounds/ball-bounce.mp3');
const sndBreak = new Audio('assets/sounds/break-sound.mp3');

// Reproduce un efecto desde el inicio (evita cortes en rebotes seguidos).
function playSound(snd) {
  snd.currentTime = 0;
  snd.play().catch(() => {});
}

// --- Estado global del juego ---
const game = {
  state: 'ready',   // 'ready' | 'playing' | 'won' | 'gameover'
  lives: LIVES_START
};

// --- Estado del paddle ---
const paddle = {
  x: (CANVAS_W - PADDLE_W) / 2,
  y: PADDLE_Y,
  w: PADDLE_W,
  h: PADDLE_H,
  dx: 0   // -1, 0, +1 según teclas
};

// --- Estado de la pelota ---
const ball = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  size: BALL_SIZE,
  stuck: true   // true = pegada al paddle, esperando saque con Espacio
};

// --- Bloques ---
// Array de objetos; los rotos se marcan con alive = false (no se eliminan).
const blocks = [];

function buildBlocks() {
  blocks.length = 0;
  const gridW = BLOCK_COLS * BLOCK_W + (BLOCK_COLS - 1) * BLOCK_GAP;
  const offsetX = (CANVAS_W - gridW) / 2;  // centrar la rejilla
  for (let row = 0; row < ROW_COLORS.length; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      blocks.push({
        x: offsetX + col * (BLOCK_W + BLOCK_GAP),
        y: BLOCK_TOP + row * (BLOCK_H + BLOCK_GAP),
        w: BLOCK_W,
        h: BLOCK_H,
        color: ROW_COLORS[row],
        alive: true
      });
    }
  }
}
buildBlocks();

// --- Explosiones activas ---
// Animaciones temporizadas independientes del array de bloques.
const explosions = [];

// Coloca la pelota centrada sobre el paddle (mientras está pegada).
function stickBallToPaddle() {
  ball.x = paddle.x + paddle.w / 2 - ball.size / 2;
  ball.y = paddle.y - ball.size;
}

// Lanza la pelota hacia arriba con las velocidades iniciales.
function launchBall() {
  ball.stuck = false;
  ball.vx = 0;
  ball.vy = -BALL_SPEED;
  game.state = 'playing';
}

// La pelota cayó: descuenta una vida y repega, o entra en game over.
function loseLife() {
  game.lives--;
  if (game.lives <= 0) {
    game.state = 'gameover';
  } else {
    ball.stuck = true;
    ball.vx = 0;
    ball.vy = 0;
    game.state = 'ready';
    stickBallToPaddle();
  }
}

// Reconstruye todo el estado y vuelve a empezar desde cero.
function resetGame() {
  game.state = 'ready';
  game.lives = LIVES_START;

  paddle.x = (CANVAS_W - PADDLE_W) / 2;
  paddle.dx = 0;

  ball.stuck = true;
  ball.vx = 0;
  ball.vy = 0;
  stickBallToPaddle();

  buildBlocks();
  explosions.length = 0;
}

// --- Input ---
const keys = { left: false, right: false };

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
  if (e.key === ' ') {
    if (game.state === 'won' || game.state === 'gameover') {
      resetGame();
    } else if (ball.stuck) {
      launchBall();
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

// --- Lógica ---
function update() {
  // En pantallas de fin, el juego no simula nada.
  if (game.state === 'gameover' || game.state === 'won') return;

  // Dirección del paddle según teclas
  paddle.dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  paddle.x += paddle.dx * PADDLE_SPEED;

  // Limitar a los bordes del canvas
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.w > CANVAS_W) paddle.x = CANVAS_W - paddle.w;

  // Mientras está pegada, la pelota sigue al paddle
  if (ball.stuck) {
    stickBallToPaddle();
    return;
  }

  // Integrar movimiento de la pelota
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Caída por el borde inferior: pierde una vida
  if (ball.y >= CANVAS_H) {
    loseLife();
    return;
  }

  // Rebote en pared izquierda
  if (ball.x <= 0) {
    ball.x = 0;
    ball.vx = -ball.vx;
    playSound(sndBounce);
  }
  // Rebote en pared derecha
  if (ball.x + ball.size >= CANVAS_W) {
    ball.x = CANVAS_W - ball.size;
    ball.vx = -ball.vx;
    playSound(sndBounce);
  }
  // Rebote en pared superior
  if (ball.y <= 0) {
    ball.y = 0;
    ball.vy = -ball.vy;
    playSound(sndBounce);
  }

  // Rebote en el paddle (solo si baja hacia él y solapa)
  if (ball.vy > 0 &&
      ball.y + ball.size >= paddle.y &&
      ball.y + ball.size <= paddle.y + paddle.h &&
      ball.x + ball.size >= paddle.x &&
      ball.x <= paddle.x + paddle.w) {
    bouncePaddle();
  }

  // Colisión con bloques: máximo una por frame (evita doble rebote).
  for (const b of blocks) {
    if (!b.alive) continue;
    if (ball.x + ball.size <= b.x || ball.x >= b.x + b.w ||
        ball.y + ball.size <= b.y || ball.y >= b.y + b.h) {
      continue;  // sin solape
    }
    hitBlock(b);
    break;
  }

  // Victoria: no queda ningún bloque vivo
  if (!blocks.some(b => b.alive)) {
    game.state = 'won';
  }
}

// Rompe un bloque e invierte la velocidad de la pelota según el lado golpeado.
function hitBlock(b) {
  b.alive = false;

  explosions.push({
    x: b.x, y: b.y, w: b.w, h: b.h,
    color: b.color,
    startedAt: performance.now()
  });

  // Solapamiento en cada eje para decidir si el golpe fue lateral o vertical.
  const overlapX = Math.min(ball.x + ball.size, b.x + b.w) - Math.max(ball.x, b.x);
  const overlapY = Math.min(ball.y + ball.size, b.y + b.h) - Math.max(ball.y, b.y);

  if (overlapX < overlapY) {
    ball.vx = -ball.vx;   // golpe por un lado → invertir horizontal
  } else {
    ball.vy = -ball.vy;   // golpe por arriba/abajo → invertir vertical
  }

  playSound(sndBreak);
}

// Rebote en el paddle: el ángulo de salida depende del punto de impacto.
// Centro = casi recto; extremos = más angulado.
function bouncePaddle() {
  ball.y = paddle.y - ball.size;

  // Posición relativa del impacto respecto al centro del paddle: [-1, +1]
  const ballCenter = ball.x + ball.size / 2;
  const paddleCenter = paddle.x + paddle.w / 2;
  let hit = (ballCenter - paddleCenter) / (paddle.w / 2);
  hit = Math.max(-1, Math.min(1, hit));

  const MAX_ANGLE = Math.PI / 3;   // 60° respecto a la vertical en los extremos
  const angle = hit * MAX_ANGLE;

  ball.vx = BALL_SPEED * Math.sin(angle);
  ball.vy = -BALL_SPEED * Math.cos(angle);

  playSound(sndBounce);
}

// --- Bucle de render ---
function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  for (const b of blocks) {
    if (b.alive) {
      drawSprite(ctx, 'block_' + b.color, b.x, b.y, b.w, b.h);
    }
  }

  drawExplosions();

  drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h);
  drawSprite(ctx, 'ball', ball.x, ball.y, ball.size, ball.size);

  // HUD: vidas restantes
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Vidas: ' + game.lives, 12, 12);

  // Overlays de fin de partida
  if (game.state === 'won' || game.state === 'gameover') {
    drawEndScreen(game.state === 'won' ? '¡Victoria!' : 'Game Over');
  }
}

// Overlay semitransparente con el mensaje de fin y la instrucción de reinicio.
function drawEndScreen(title) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '48px monospace';
  ctx.fillText(title, CANVAS_W / 2, CANVAS_H / 2 - 30);

  ctx.font = '20px monospace';
  ctx.fillText('Pulsa Espacio para jugar de nuevo', CANVAS_W / 2, CANVAS_H / 2 + 30);
}

// Dibuja las explosiones activas y descarta las que superaron su duración.
function drawExplosions() {
  const now = performance.now();
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    const elapsed = now - e.startedAt;
    if (elapsed >= EXPLOSION_DURATION) {
      explosions.splice(i, 1);
      continue;
    }
    const frames = EXPLOSION_FRAMES[e.color];
    const idx = Math.min(
      frames.length - 1,
      Math.floor((elapsed / EXPLOSION_DURATION) * frames.length)
    );
    drawFrame(ctx, frames[idx], e.x, e.y, e.w, e.h);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Arrancar el bucle SOLO cuando el spritesheet terminó de cargar:
// drawSprite/drawFrame hacen return silencioso si la hoja no está lista.
loadSpritesheet(() => {
  requestAnimationFrame(loop);
});
