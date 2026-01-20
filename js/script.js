// ====== Canvas & Context ======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ====== Utility Functions ======

/**
 * Detects if the current device is a mobile device
 * @returns {boolean} True if mobile device, false otherwise
 */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Provides haptic feedback if supported
 * @param {number|number[]} pattern - Vibration pattern (ms duration or array of [vibrate, pause, vibrate, ...])
 */
function hapticFeedback(pattern = 50) {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Silently fail if vibration is not supported or blocked
    }
  }
}

// Adaptive canvas sizing for mobile
function resizeCanvas() {
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    // На мобильных используем CSS для управления размером
    // Убираем inline стили, чтобы CSS мог работать
    canvas.style.width = '';
    canvas.style.height = '';
    canvas.style.maxWidth = '';
  } else {
    canvas.style.width = '400px';
    canvas.style.height = '600px';
    canvas.style.maxWidth = '';
  }
}

// Resize on load and window resize (debounced for performance)
resizeCanvas();
window.addEventListener('resize', debounce(resizeCanvas, 200));

// ====== Constants & Assets ======
const centerLineWidth = 6;
const enemyCar = new Image();
const car = new Image();
const roadImage = new Image();
let imagesLoaded = 0;
const totalImages = 3;
let allImagesReady = false;

// ====== Audio System ======
let audioContext = null;
let soundsEnabled = true;

// Initialize audio context (required for Web Audio API)
function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Try to load sound settings from localStorage
    const soundSetting = localStorage.getItem('soundsEnabled');
    if (soundSetting !== null) {
      soundsEnabled = soundSetting === 'true';
    }
  } catch (e) {
    console.warn('Web Audio API not supported:', e);
    soundsEnabled = false;
  }
}

// Generate sound using Web Audio API
function playSound(frequency, duration, type = 'sine', volume = 0.3) {
  if (!soundsEnabled || !audioContext) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.warn('Error playing sound:', e);
  }
}

// Sound effects
const sounds = {
  engine: null,
  engineInterval: null,
  playEngine() {
    if (!soundsEnabled || !audioContext) return;
    // Continuous engine sound (low frequency)
    if (!this.engineInterval) {
      this.engineInterval = setInterval(() => {
        playSound(80, 0.1, 'sawtooth', 0.15);
      }, 100);
    }
  },
  stopEngine() {
    if (this.engineInterval) {
      clearInterval(this.engineInterval);
      this.engineInterval = null;
    }
  },
  playBoost() {
    playSound(200, 0.2, 'square', 0.4);
  },
  playCollision() {
    // Low frequency crash sound
    playSound(60, 0.3, 'sawtooth', 0.6);
    setTimeout(() => playSound(40, 0.2, 'sawtooth', 0.4), 50);
  },
  playScore() {
    // High frequency success sound
    playSound(800, 0.1, 'sine', 0.3);
    setTimeout(() => playSound(1000, 0.1, 'sine', 0.3), 50);
  },
  playBackground() {
    // Optional: simple background music loop
    // This is a placeholder - can be replaced with actual audio file
  }
};

// Initialize audio on user interaction (browser requirement)
document.addEventListener('click', () => {
  if (!audioContext) {
    initAudio();
  }
}, { once: true });

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
  allImagesReady = true;
  // Show canvas after all images are loaded
  const canvas = document.getElementById("gameCanvas");
  if (canvas) {
    canvas.classList.add("loaded");
  }
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
let gameStarted = false, gameOver = false, gamePaused = false;
const enemies = [], keys = {};
let lastSpawnTime = 0;
let roadOffset = 0; // For road animation

// Touch controls
let touchStartX = 0;
let touchStartY = 0;
let isTouching = false;

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
  // Скрываем мобильные контролы при Game Over
  const isMobile = isMobileDevice();
  updateMobileControlsVisibility(isMobile);
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
  // Pause toggle
  if (e.key.toLowerCase() === 'p' && gameStarted && !gameOver) {
    togglePause();
    return;
  }
  
  keys[e.key] = true;
  if (!gameStarted && ["ArrowLeft","ArrowRight","ArrowUp"].includes(e.key)) {
    gameStarted = true;
    lastSpawnTime = Date.now();
    sounds.playEngine();
    const isMobile = isMobileDevice();
    updateMobileControlsVisibility(isMobile);
  }
  if (gameOver && e.key === "r") {
    hideGameOverScreen();
    restartGame();
  }
});
window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

// Touch controls for mobile
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  isTouching = true;
  
  if (!gameStarted && !gameOver) {
    gameStarted = true;
    lastSpawnTime = Date.now();
    sounds.playEngine();
    const isMobile = isMobileDevice();
    updateMobileControlsVisibility(isMobile);
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!isTouching || gamePaused || gameOver) return;
  
  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touchStartY - touch.clientY;
  
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
    if (deltaX > 0) {
      keys.ArrowRight = true;
      keys.ArrowLeft = false;
    } else {
      keys.ArrowLeft = true;
      keys.ArrowRight = false;
    }
  }
  
  if (deltaY > 20) {
    keys.ArrowUp = true;
  }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  isTouching = false;
  keys.ArrowLeft = false;
  keys.ArrowRight = false;
  keys.ArrowUp = false;
}, { passive: false });

canvas.addEventListener('touchcancel', (e) => {
  e.preventDefault();
  isTouching = false;
  keys.ArrowLeft = false;
  keys.ArrowRight = false;
  keys.ArrowUp = false;
}, { passive: false });

// Mobile virtual buttons
const mobileControls = document.getElementById('mobileControls');
const mobileLeft = document.getElementById('mobileLeft');
const mobileRight = document.getElementById('mobileRight');
const mobileBoost = document.getElementById('mobileBoost');
const mobilePause = document.getElementById('mobilePause');
const resumeBtn = document.getElementById('resumeBtn');

function checkMobile() {
  const isMobile = isMobileDevice();
  updateMobileControlsVisibility(isMobile);
  return isMobile;
}

function updateMobileControlsVisibility(isMobile) {
  if (mobileControls) {
    // Показываем контролы только на мобильных, когда игра запущена, не на паузе и не Game Over
    if (isMobile && gameStarted && !gameOver && !gamePaused) {
      mobileControls.classList.remove('hidden');
    } else {
      mobileControls.classList.add('hidden');
    }
  }
}

if (mobileLeft) {
  mobileLeft.addEventListener('touchstart', (e) => {
    e.preventDefault();
    hapticFeedback(30);
    keys.ArrowLeft = true;
    if (!gameStarted && !gameOver) {
      gameStarted = true;
      lastSpawnTime = Date.now();
      sounds.playEngine();
    }
  });
  mobileLeft.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.ArrowLeft = false;
  });
}

if (mobileRight) {
  mobileRight.addEventListener('touchstart', (e) => {
    e.preventDefault();
    hapticFeedback(30);
    keys.ArrowRight = true;
    if (!gameStarted && !gameOver) {
      gameStarted = true;
      lastSpawnTime = Date.now();
      sounds.playEngine();
    }
  });
  mobileRight.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.ArrowRight = false;
  });
}

if (mobileBoost) {
  mobileBoost.addEventListener('touchstart', (e) => {
    e.preventDefault();
    hapticFeedback(30);
    keys.ArrowUp = true;
  });
  mobileBoost.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.ArrowUp = false;
  });
}

if (mobilePause) {
  mobilePause.addEventListener('click', () => {
    if (gameStarted && !gameOver) {
      hapticFeedback(30);
      togglePause();
    }
  });
}

if (resumeBtn) {
  resumeBtn.addEventListener('click', () => {
    togglePause();
  });
}

checkMobile();
window.addEventListener('resize', debounce(checkMobile, 200));

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

// ====== Pause System ======
function togglePause() {
  gamePaused = !gamePaused;
  const pauseOverlay = document.getElementById('pauseOverlay');
  if (pauseOverlay) {
    if (gamePaused) {
      pauseOverlay.classList.remove('hidden');
      sounds.stopEngine();
    } else {
      pauseOverlay.classList.add('hidden');
      if (gameStarted && !gameOver) {
        sounds.playEngine();
      }
    }
  }
  // Обновляем видимость мобильных контролов при паузе
  const isMobile = isMobileDevice();
  updateMobileControlsVisibility(isMobile);
}

// ====== Update ======
function update() {
  if (!gameStarted || gameOver || gamePaused) return;

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
  
  // Play boost sound when boosting
  if (keys.ArrowUp && mv === speedBoost) {
    sounds.playBoost();
  }
  
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
      sounds.stopEngine();
      sounds.playCollision();
      // Haptic feedback for collision (stronger pattern for crash)
      hapticFeedback([100, 50, 100]);
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
      sounds.playScore();
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

  // Don't draw anything until all images are loaded
  if (!allImagesReady) {
    // Show loading message
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);
    return;
  }

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
  
  // Only draw if image is loaded - no fallback rectangles
  if (car.complete && car.naturalWidth > 0) {
    ctx.drawImage(car, -player.width / 2, -player.height / 2, player.width, player.height);
  }
  // Don't draw fallback rectangle - wait for image to load
  ctx.restore();

  enemies.forEach(e => {
    ctx.save();
    // Visual indicator for faster enemies
    if (e.speedMultiplier > 1.0) {
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = "#ff0";
      ctx.shadowBlur = 5;
    }
    
    // Only draw if image is loaded - no fallback rectangles
    if (enemyCar.complete && enemyCar.naturalWidth > 0) {
      ctx.drawImage(enemyCar, e.x, e.y, e.width, e.height);
    }
    // Don't draw fallback rectangle - wait for image to load
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
  
  // Обновляем видимость мобильных контролов в главном цикле
  const isMobile = isMobileDevice();
  updateMobileControlsVisibility(isMobile);
}

// ====== Restart ======
function restartGame() {
  score = 0;
  enemies.length = 0;
  gameStarted = false;
  gameOver = false;
  gamePaused = false;
  player.x = canvas.width/2 - player.width/2;
  player.velocity = 0;
  roadOffset = 0;
  lastSpawnTime = Date.now();
  sounds.stopEngine();
  hideGameOverScreen();
  const pauseOverlay = document.getElementById('pauseOverlay');
  if (pauseOverlay) {
    pauseOverlay.classList.add('hidden');
  }
  // Скрываем мобильные контролы при рестарте (игра еще не началась)
  const isMobile = isMobileDevice();
  updateMobileControlsVisibility(isMobile);
}

// ====== Main Loop ======
(function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
})();
