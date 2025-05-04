import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true });
}

// ====== Canvas & Context ======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ====== Constants & Assets ======
const centerLineWidth = 6;
const enemyCar = new Image(); enemyCar.src = "enemycar.png";
const car = new Image(); car.src = "car.png";

// Asphalt pattern
const tile = document.createElement("canvas");
tile.width = tile.height = 30;
const tctx = tile.getContext("2d");
tctx.fillStyle = "#888"; tctx.fillRect(0,0,30,30);
tctx.fillStyle = "#aaa";
for (let i = 0; i < 50; i++) {
  tctx.fillRect(Math.random() * 30, Math.random() * 30, 1, 1);
}
tctx.strokeStyle = "#bbb"; tctx.lineWidth = 1;
for (let i = 0; i < 6; i++) {
  const sx = Math.random() * 30, sy = Math.random() * 30;
  tctx.beginPath(); tctx.moveTo(sx, sy);
  tctx.lineTo(sx + (Math.random() * 10 - 5), sy + (Math.random() * 10 - 5));
  tctx.stroke();
}
const asphaltPattern = ctx.createPattern(tile, "repeat");

// ====== Player & Game State ======
const player = {
  width: 50,
  height: 100,
  x: canvas.width / 2 - 25,
  y: canvas.height - 150,
  speed: 5
};
const speedNormal = 5, speedBoost = 12;
let score = 0, bestScore = 0, gameStarted = false, gameOver = false;
const enemies = [], keys = {};

// ====== Overlay Elements ======
const gameOverScreen    = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const bestScoreDisplay  = document.getElementById('bestScoreDisplay');
const restartBtn        = document.getElementById('restartBtn');
const shareBtn          = document.getElementById('shareBtn');
const leaderboardBtn    = document.getElementById('leaderboardBtn');

function showGameOverScreen() {
  finalScoreDisplay.textContent = score;
  bestScoreDisplay.textContent  = bestScore;
  gameOverScreen.classList.remove('hidden');
}
function hideGameOverScreen() {
  gameOverScreen.classList.add('hidden');
}

restartBtn.addEventListener('click', () => {
  hideGameOverScreen();
  restartGame();
});
shareBtn.addEventListener('click', () => {
  const text = `I scored ${score} points on HTML5 RacingGame!\nracinggame-five.vercel.app`;
  const shareUrl =
    'https://x.com/intent/tweet?text=' + encodeURIComponent(text);
  window.open(shareUrl, '_blank', 'noopener');
});


leaderboardBtn.addEventListener('click', () => {
  window.location.href = `leaderboard.html?newScore=${score}`;
});

// ====== Input ======
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (!gameStarted && ["ArrowLeft","ArrowRight","ArrowUp"].includes(e.key)) {
    gameStarted = true;
  }
  if (gameOver && e.key === "r") {
    hideGameOverScreen();
    restartGame();
  }
});
window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

// ====== Enemy Spawn ======
function spawnEnemy() {
  const cx = canvas.width / 2, hl = centerLineWidth / 2;
  const lx = cx - hl - player.width, rx = cx + hl;
  const x = Math.random() < 0.5
    ? Math.random() * lx
    : rx + Math.random() * (canvas.width - player.width - rx);
  enemies.push({ x, y: -player.height, width: player.width, height: player.height });
}
setInterval(() => {
  if (gameStarted && !gameOver) spawnEnemy();
}, 1000);

// ====== Update ======
function update() {
  if (!gameStarted || gameOver) return;

  if (keys.ArrowLeft)  player.x -= player.speed;
  if (keys.ArrowRight) player.x += player.speed;
  player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));

  const mv = keys.ArrowUp ? speedBoost : speedNormal;
  enemies.forEach(e => e.y += mv);

  enemies.forEach(e => {
    if (
      player.x < e.x + e.width &&
      player.x + player.width > e.x &&
      player.y < e.y + e.height &&
      player.y + player.height > e.y
    ) {
      gameOver = true;
      bestScore = Math.max(bestScore, score);
    }
  });

  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].y > canvas.height) {
      enemies.splice(i, 1);
      score++;
    }
  }
}

// ====== Draw ======
function drawRoad() {
  ctx.fillStyle = asphaltPattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "rgba(255,255,255,0.15)");
  grad.addColorStop(0.7, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function draw() {
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawRoad();

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = centerLineWidth;
  ctx.setLineDash([30,20]);
  ctx.beginPath();
  ctx.moveTo(canvas.width/2,0);
  ctx.lineTo(canvas.width/2,canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.save();
  if (keys.ArrowUp) { ctx.shadowColor = "cyan"; ctx.shadowBlur = 20; }
  ctx.drawImage(car, player.x, player.y, player.width, player.height);
  ctx.restore();

  enemies.forEach(e => ctx.drawImage(enemyCar, e.x, e.y, e.width, e.height));

  ctx.setTransform(1,0,0,1,0,0);
  ctx.font = "bold 32px 'Press Start 2P'";
  ctx.fillStyle = "yellow";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 6;
  const txt = gameStarted && !gameOver ? score : 0;
  ctx.fillText(txt, canvas.width/2, 10);

  if (gameOver) {
    showGameOverScreen();
    return;
  }
}

// ====== Restart ======
function restartGame() {
  score = 0;
  enemies.length = 0;
  gameStarted = false;
  gameOver = false;
  player.x = canvas.width/2 - player.width/2;
  hideGameOverScreen();
}

// ====== Main Loop ======
(function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
})();
