// ====== Canvas & Context ======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ====== Constants & Assets ======
const centerLineWidth = 6;
const enemyCar = new Image();
const car = new Image();
const roadImage = new Image();
let imagesLoaded = 0;
const totalImages = 3;

function loadImage(img, src) {
  return new Promise((resolve, reject) => {
    img.onload = () => {
      imagesLoaded++;
      resolve();
    };
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      imagesLoaded++;
      resolve(); // Continue even if image fails
    };
    img.src = src;
  });
}

// Load images
Promise.all([
  loadImage(enemyCar, "assets/images/enemycar.png"),
  loadImage(car, "assets/images/car.png"),
  loadImage(roadImage, "assets/images/road.png")
]).then(() => {
  console.log("All images loaded");
});

// Smooth asphalt pattern optimized for movement
const tile = document.createElement("canvas");
tile.width = tile.height = 40; // Optimal size for smooth scrolling
const tctx = tile.getContext("2d");

// Softer asphalt color palette with less contrast
const baseColor = "#5d5d5d";
const baseLight = "#656565";
const baseDark = "#555555";
const aggregate = "#505050";
const reflective = "#6d6d6d";

// Base layer with smooth gradient
const baseGrad = tctx.createLinearGradient(0, 0, 40, 40);
baseGrad.addColorStop(0, baseLight);
baseGrad.addColorStop(0.5, baseColor);
baseGrad.addColorStop(1, baseDark);
tctx.fillStyle = baseGrad;
tctx.fillRect(0, 0, 40, 40);

// Add smooth color variation (larger blocks for less flicker)
for (let y = 0; y < 40; y += 4) {
  for (let x = 0; x < 40; x += 4) {
    const noise = Math.random() * 0.15 - 0.075; // Reduced variation
    const brightness = 0.5 + noise;
    const r = Math.floor(93 + brightness * 12);
    const g = Math.floor(93 + brightness * 12);
    const b = Math.floor(93 + brightness * 12);
    tctx.fillStyle = `rgb(${r},${g},${b})`;
    tctx.fillRect(x, y, 4, 4);
  }
}

// Add smooth aggregate stones (fewer, larger, softer)
tctx.fillStyle = aggregate;
tctx.globalAlpha = 0.4; // Softer appearance
for (let i = 0; i < 12; i++) {
  const x = Math.random() * 40;
  const y = Math.random() * 40;
  const size = Math.random() * 3 + 2;
  // Draw soft rounded aggregate with blur effect
  const grad = tctx.createRadialGradient(x, y, 0, x, y, size);
  grad.addColorStop(0, aggregate);
  grad.addColorStop(1, "rgba(80,80,80,0)");
  tctx.fillStyle = grad;
  tctx.beginPath();
  tctx.arc(x, y, size, 0, Math.PI * 2);
  tctx.fill();
}
tctx.globalAlpha = 1.0;

// Add smooth reflective particles (softer, fewer)
tctx.fillStyle = reflective;
tctx.globalAlpha = 0.3;
for (let i = 0; i < 8; i++) {
  const x = Math.random() * 40;
  const y = Math.random() * 40;
  const size = Math.random() * 2 + 1;
  const grad = tctx.createRadialGradient(x, y, 0, x, y, size);
  grad.addColorStop(0, reflective);
  grad.addColorStop(1, "rgba(109,109,109,0)");
  tctx.fillStyle = grad;
  tctx.beginPath();
  tctx.arc(x, y, size, 0, Math.PI * 2);
  tctx.fill();
}
tctx.globalAlpha = 1.0;

// Add very subtle wear patterns (soft, low contrast)
tctx.fillStyle = "rgba(85,85,85,0.2)";
for (let i = 0; i < 4; i++) {
  const x = Math.random() * 40;
  const y = Math.random() * 40;
  const w = Math.random() * 6 + 4;
  const h = Math.random() * 6 + 4;
  // Soft edges
  const grad = tctx.createRadialGradient(x + w/2, y + h/2, 0, x + w/2, y + h/2, Math.max(w, h));
  grad.addColorStop(0, "rgba(85,85,85,0.3)");
  grad.addColorStop(1, "rgba(85,85,85,0)");
  tctx.fillStyle = grad;
  tctx.fillRect(x, y, w, h);
}

// Add subtle directional lighting (very soft)
const lightGrad = tctx.createLinearGradient(0, 0, 40, 40);
lightGrad.addColorStop(0, "rgba(110,110,110,0.08)");
lightGrad.addColorStop(0.5, "rgba(0,0,0,0)");
lightGrad.addColorStop(1, "rgba(0,0,0,0.05)");
tctx.fillStyle = lightGrad;
tctx.fillRect(0, 0, 40, 40);

const asphaltPattern = ctx.createPattern(tile, "repeat");

// ====== Player & Game State ======
const player = {
  width: 35,
  height: 70,
  x: canvas.width / 2 - 17.5,
  y: canvas.height - 150,
  speed: 5,
  velocity: 0, // Horizontal velocity for smooth movement
  maxSpeed: 8,
  acceleration: 0.5,
  friction: 0.85
};
const speedNormal = 5, speedBoost = 12;
let score = 0;
let bestScore = 0;
try {
  bestScore = parseInt(localStorage.getItem('bestScore') || '0', 10) || 0;
} catch (e) {
  console.warn('localStorage not available:', e);
  bestScore = 0;
}
let gameStarted = false, gameOver = false;
const enemies = [], keys = {};
let lastSpawnTime = 0;
let roadOffset = 0; // For road animation

// Road dimensions (defined here so they can be used in multiple functions)
const shoulderWidth = 40; // Brown shoulder on each side
const curbWidth = 15; // Gray curb between shoulder and road
const roadStartX = shoulderWidth + curbWidth;
const roadWidth = canvas.width - (roadStartX * 2);
const laneWidth = roadWidth / 4; // 4 lanes

// Road boundaries for image-based road (approximate - adjust based on your image)
// Assuming road image has ~15% shoulders/curbs on each side
const roadImageMargin = canvas.width * 0.15; // Margin for shoulders/curbs on each side
const roadImageStartX = roadImageMargin;
const roadImageWidth = canvas.width - (roadImageMargin * 2);

// ====== Overlay Elements ======
const gameOverBackdrop  = document.getElementById('gameOverBackdrop');
const gameOverScreen    = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const bestScoreDisplay  = document.getElementById('bestScoreDisplay');
const restartBtn        = document.getElementById('restartBtn');
const shareBtn          = document.getElementById('shareBtn');
const leaderboardBtn    = document.getElementById('leaderboardBtn');

// Initialize bestScore display on page load
if (bestScoreDisplay) {
  bestScoreDisplay.textContent = bestScore;
}

function showGameOverScreen() {
  if (finalScoreDisplay) finalScoreDisplay.textContent = score;
  if (bestScoreDisplay) bestScoreDisplay.textContent = bestScore;
  if (gameOverBackdrop) gameOverBackdrop.classList.remove('hidden');
  if (gameOverScreen) gameOverScreen.classList.remove('hidden');
}
function hideGameOverScreen() {
  if (gameOverBackdrop) gameOverBackdrop.classList.add('hidden');
  if (gameOverScreen) gameOverScreen.classList.add('hidden');
}

if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    hideGameOverScreen();
    restartGame();
  });
}
if (shareBtn) {
  shareBtn.addEventListener('click', () => {
    const text = `I scored ${score} points on HTML5 RacingGame!\nracinggame-five.vercel.app`;
    const shareUrl =
      'https://x.com/intent/tweet?text=' + encodeURIComponent(text);
    window.open(shareUrl, '_blank', 'noopener');
  });
}

if (leaderboardBtn) {
  leaderboardBtn.addEventListener('click', () => {
    window.location.href = `leaderboard.html?newScore=${score}`;
  });
}

// ====== Input ======
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (!gameStarted && ["ArrowLeft","ArrowRight","ArrowUp"].includes(e.key)) {
    gameStarted = true;
    lastSpawnTime = Date.now();
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
  // Spawn enemies within road bounds (not on shoulders/curbs)
  // If using road image, use road area only; otherwise use programmatic road bounds
  const minX = (roadImage.complete && roadImage.naturalWidth > 0) 
    ? roadImageStartX 
    : roadStartX;
  const maxX = (roadImage.complete && roadImage.naturalWidth > 0) 
    ? roadImageStartX + roadImageWidth - player.width 
    : roadStartX + roadWidth - player.width;
  
  // Try to spawn enemy in a safe position (not overlapping with existing enemies)
  let attempts = 0;
  let x, safePosition = false;
  
  while (!safePosition && attempts < 10) {
    x = minX + Math.random() * (maxX - minX);
    
    // Check if position overlaps with existing enemies
    safePosition = true;
    for (let enemy of enemies) {
      const distance = Math.abs(enemy.x - x);
      if (distance < player.width + 10) { // Minimum spacing
        safePosition = false;
        break;
      }
    }
    attempts++;
  }
  
  // Add some variety: different enemy speeds (10% chance of faster enemy)
  const enemySpeed = Math.random() < 0.1 ? 1.2 : 1.0;
  
  enemies.push({ 
    x, 
    y: -player.height, 
    width: player.width, 
    height: player.height,
    speedMultiplier: enemySpeed
  });
}

// Dynamic spawn rate based on score (gets faster as score increases)
function getSpawnInterval() {
  const baseInterval = 1000;
  const scoreReduction = Math.min(score * 5, 400); // Max 400ms reduction
  return Math.max(baseInterval - scoreReduction, 600); // Min 600ms
}

// ====== Update ======
function update() {
  if (!gameStarted || gameOver) return;

  // Smooth player movement with acceleration and friction
  if (keys.ArrowLeft) {
    player.velocity -= player.acceleration;
  } else if (keys.ArrowRight) {
    player.velocity += player.acceleration;
  } else {
    // Apply friction when no input
    player.velocity *= player.friction;
  }
  
  // Limit velocity
  player.velocity = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.velocity));
  
  // Update position
  player.x += player.velocity;
  
  // Keep player within road bounds (not on shoulders/curbs)
  // If using road image, use road area only; otherwise use programmatic road bounds
  const minX = (roadImage.complete && roadImage.naturalWidth > 0) 
    ? roadImageStartX 
    : roadStartX;
  const maxX = (roadImage.complete && roadImage.naturalWidth > 0) 
    ? roadImageStartX + roadImageWidth - player.width 
    : roadStartX + roadWidth - player.width;
  player.x = Math.max(minX, Math.min(player.x, maxX));

  // Enemy movement with speed multiplier
  const mv = keys.ArrowUp ? speedBoost : speedNormal;
  enemies.forEach(e => {
    e.y += mv * (e.speedMultiplier || 1.0);
  });
  
  // Animate road (move forward effect) - slower than enemy speed for smooth effect
  const roadSpeed = mv * 0.2; // 20% of movement speed for smoother, less blurry road animation
  roadOffset += roadSpeed;
  // Reset logic is handled in drawRoad() function based on image height or tile size
  
  // Dynamic enemy spawning
  const currentTime = Date.now();
  if (currentTime - lastSpawnTime >= getSpawnInterval()) {
    spawnEnemy();
    lastSpawnTime = currentTime;
  }

  // Check collisions - break early to avoid multiple collisions in one frame
  for (let e of enemies) {
    if (
      player.x < e.x + e.width &&
      player.x + player.width > e.x &&
      player.y < e.y + e.height &&
      player.y + player.height > e.y
    ) {
      gameOver = true;
      bestScore = Math.max(bestScore, score);
      try {
        localStorage.setItem('bestScore', bestScore.toString());
      } catch (e) {
        console.warn('Failed to save bestScore:', e);
      }
      break; // Exit loop after first collision
    }
  }

  // Calculate points based on speed boost
  const isBoosting = keys.ArrowUp;
  const pointsPerEnemy = isBoosting ? 2 : 1; // Double points when boosting
  
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].y > canvas.height) {
      enemies.splice(i, 1);
      score += pointsPerEnemy;
    }
  }
}

// ====== Draw ======
function drawRoad() {
  // Use road image if loaded, otherwise fallback to programmatic drawing
  if (roadImage.complete && roadImage.naturalWidth > 0) {
    // Draw animated road image with seamless scrolling
    ctx.save();
    ctx.translate(0, roadOffset);
    
    const roadImageHeight = roadImage.height;
    const roadImageWidth = roadImage.width;
    
    // Calculate how many times we need to repeat the image vertically
    // Add extra tiles above and below for seamless scrolling
    const tilesNeeded = Math.ceil((canvas.height + 120) / roadImageHeight) + 2;
    const startTile = Math.floor(-roadOffset / roadImageHeight) - 1;
    
    // Draw the road image repeatedly for seamless scrolling
    for (let i = startTile; i < startTile + tilesNeeded; i++) {
      const yPos = i * roadImageHeight;
      // Scale image to match canvas width while maintaining aspect ratio
      const scaledHeight = (canvas.width / roadImageWidth) * roadImageHeight;
      ctx.drawImage(
        roadImage,
        0,
        yPos,
        canvas.width,
        scaledHeight
      );
    }
    
    ctx.restore();
    
    // Reset roadOffset when it exceeds one image height for seamless loop
    // Use scaled height for proper reset
    const scaledHeight = (canvas.width / roadImageWidth) * roadImageHeight;
    if (roadOffset >= scaledHeight) {
      roadOffset = roadOffset - scaledHeight;
    }
  } else {
    // Fallback: Draw brown shoulders (outer edges)
    ctx.fillStyle = "#8b6f47"; // Brown dirt/gravel
    ctx.fillRect(0, 0, shoulderWidth, canvas.height);
    ctx.fillRect(canvas.width - shoulderWidth, 0, shoulderWidth, canvas.height);
    
    // Draw gray curbs
    ctx.fillStyle = "#a0a0a0"; // Light gray
    ctx.fillRect(shoulderWidth, 0, curbWidth, canvas.height);
    ctx.fillRect(canvas.width - shoulderWidth - curbWidth, 0, curbWidth, canvas.height);
    
    // Draw animated road texture with smooth movement
    ctx.save();
    ctx.translate(0, roadOffset);
    ctx.fillStyle = asphaltPattern;
    ctx.fillRect(roadStartX, -60, roadWidth, canvas.height + 60);
    ctx.restore();
    
    // Reset roadOffset for seamless loop
    if (roadOffset >= 30) {
      roadOffset = roadOffset - 30;
    }
  }
}
function draw() {
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawRoad();

  // Draw animated center line only if NOT using road image (image already has markings)
  if (!(roadImage.complete && roadImage.naturalWidth > 0)) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = centerLineWidth;
    ctx.setLineDash([30,20]);
    ctx.beginPath();
    // Use same offset as road texture for perfect synchronization
    // Draw line with offset matching road texture translate
    ctx.moveTo(canvas.width/2, -60 + roadOffset);
    ctx.lineTo(canvas.width/2, canvas.height + 60 + roadOffset);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.save();
  // Visual tilt effect based on movement direction
  const tiltAngle = player.velocity * 0.05; // Small tilt effect
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  ctx.rotate(tiltAngle);
  
  if (keys.ArrowUp) { 
    ctx.shadowColor = "cyan"; 
    ctx.shadowBlur = 20; 
  }
  
  // Only draw if image is loaded
  if (car.complete && car.naturalWidth > 0) {
    ctx.drawImage(car, -player.width / 2, -player.height / 2, player.width, player.height);
  } else {
    // Fallback rectangle if image not loaded
    ctx.fillStyle = "#00f";
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
  }
  ctx.restore();

  enemies.forEach(e => {
    ctx.save();
    // Visual indicator for faster enemies
    if (e.speedMultiplier > 1.0) {
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = "#ff0";
      ctx.shadowBlur = 5;
    }
    
    if (enemyCar.complete && enemyCar.naturalWidth > 0) {
      ctx.drawImage(enemyCar, e.x, e.y, e.width, e.height);
    } else {
      // Fallback rectangle if image not loaded
      ctx.fillStyle = e.speedMultiplier > 1.0 ? "#ff0" : "#f00";
      ctx.fillRect(e.x, e.y, e.width, e.height);
    }
    ctx.restore();
  });

  ctx.setTransform(1,0,0,1,0,0);
  ctx.font = "bold 32px 'Press Start 2P'";
  ctx.fillStyle = "yellow";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 6;
  const txt = gameStarted ? score : 0;
  ctx.fillText(txt, canvas.width/2, 10);
  
  // Show speed boost multiplier indicator
  if (gameStarted && !gameOver && keys.ArrowUp) {
    ctx.font = "bold 16px 'Press Start 2P'";
    ctx.fillStyle = "cyan";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 4;
    ctx.fillText("2x POINTS", canvas.width/2, 50);
  }

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
  player.velocity = 0;
  roadOffset = 0;
  lastSpawnTime = Date.now();
  hideGameOverScreen();
}

// ====== Main Loop ======
(function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
})();
