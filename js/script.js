// ====== Canvas & Context ======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Enable high-quality image smoothing for better road rendering
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

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

// Road dimensions (will be recalculated when canvas resizes)
// MUST be declared before resizeCanvas() and updateRoadDimensions()
let shoulderWidth = 40; // Brown shoulder on each side
let curbWidth = 15; // Gray curb between shoulder and road
let roadStartX = 0;
let roadWidth = 0;
let laneWidth = 0;

// Road boundaries for image-based road (approximate - adjust based on your image)
// Assuming road image has ~15% shoulders/curbs on each side
let roadImageMargin = 0; // Margin for shoulders/curbs on each side
let roadImageStartX = 0;
let roadImageWidth = 0;

// Function to recalculate road dimensions when canvas size changes
function updateRoadDimensions() {
  shoulderWidth = 40;
  curbWidth = 15;
  roadStartX = shoulderWidth + curbWidth;
  // Используем displayWidth для расчетов, так как контекст уже масштабирован
  roadWidth = displayWidth - (roadStartX * 2);
  laneWidth = roadWidth / 4;
  roadImageMargin = displayWidth * 0.15;
  roadImageStartX = roadImageMargin;
  roadImageWidth = displayWidth - (roadImageMargin * 2);
}

// Store display dimensions for calculations
let displayWidth = 400;
let displayHeight = 600;

// Adaptive canvas sizing for mobile
function resizeCanvas() {
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    // На мобильных используем CSS для управления размером
    // Убираем inline стили, чтобы CSS мог работать
    canvas.style.width = '';
    canvas.style.height = '';
    canvas.style.maxWidth = '';
    // Устанавливаем размер canvas на основе реального размера экрана
    // Используем requestAnimationFrame чтобы убедиться что CSS применился
    requestAnimationFrame(() => {
      const canvasWrapper = canvas.parentElement;
      if (canvasWrapper) {
        const wrapperRect = canvasWrapper.getBoundingClientRect();
        // Используем реальный размер wrapper для canvas, но не меньше минимального
        displayWidth = Math.max(wrapperRect.width || window.innerWidth, 300);
        // Увеличиваем высоту canvas на мобильных - используем больше пространства экрана
        displayHeight = Math.max(wrapperRect.height || (window.innerHeight - 50 - 100), 500);
        
        // Получаем devicePixelRatio для высокого качества на Retina дисплеях
        const dpr = window.devicePixelRatio || 1;
        
        // Устанавливаем внутренний размер canvas с учетом pixel ratio для четкости
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        
        // Масштабируем контекст для правильного отображения
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Устанавливаем CSS размер для отображения
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        // Обновляем размеры дороги (используем display размеры)
        updateRoadDimensions();
        
        // Инициализируем позицию игрока
        initializePlayerPosition();
      }
    });
  } else {
    displayWidth = 400;
    displayHeight = 600;
    canvas.style.width = '400px';
    canvas.style.height = '600px';
    canvas.style.maxWidth = '';
    canvas.width = 400;
    canvas.height = 600;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Сброс трансформации для десктопа
    // Обновляем размеры дороги для десктопа
    updateRoadDimensions();
    // Инициализируем позицию игрока для десктопа
    initializePlayerPosition();
  }
}

// Resize on load and window resize (debounced for performance)
// Wait for DOM to be ready before initializing canvas
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
  });
} else {
  resizeCanvas();
}

window.addEventListener('resize', debounce(() => {
  resizeCanvas();
  // Обновляем позицию игрока после изменения размера canvas
  if (player) {
    player.x = Math.min(player.x, displayWidth - player.width);
    player.y = Math.min(player.y, displayHeight - 150);
  }
}, 200));

// ====== Constants & Assets ======
const centerLineWidth = 6;
const enemyCar = new Image(); // Legacy - kept for backward compatibility
const car = new Image(); // Current player car (will be randomly selected)
const roadImage = new Image();

// Array of player car images for variety
const playerCars = [
  new Image(), // Mercedes G63
  new Image()  // Porsche 911 GT3 RS
];
const playerCarPaths = [
  "assets/images/cars/mercedesG63.svg",
  "assets/images/cars/porsche911GT3rs.svg"
];

// Array of enemy car images (only one car for enemies)
const enemyCars = [
  new Image() // Original enemy car
];
const enemyCarPaths = [
  "assets/images/enemycar.png"
];

let imagesLoaded = 0;
const totalImages = 1 + playerCars.length + 1 + enemyCars.length; // Road (1) + player cars + enemyCar legacy (1) + enemy cars
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
  loadImage(roadImage, "assets/images/road.png"),
  // Load all player car variants
  ...playerCars.map((img, index) => loadImage(img, playerCarPaths[index])),
  // Load all enemy car variants
  loadImage(enemyCar, "assets/images/enemycar.png"), // Legacy support
  ...enemyCars.map((img, index) => loadImage(img, enemyCarPaths[index]))
]).then(() => {
  console.log("All images loaded");
  allImagesReady = true;
  
  // Select random player car after all images are loaded
  selectRandomPlayerCar();
  
  // Show canvas after all images are loaded
  const canvas = document.getElementById("gameCanvas");
  if (canvas) {
    canvas.classList.add("loaded");
  }
});

/**
 * Selects a random player car from available cars
 */
function selectRandomPlayerCar() {
  const randomIndex = Math.floor(Math.random() * playerCars.length);
  const selectedCar = playerCars[randomIndex];
  
  // Use the selected car image directly
  // Since all images are already loaded, we can safely use the selected one
  if (selectedCar.complete && selectedCar.naturalWidth > 0) {
    // Copy src to main car object
    car.src = selectedCar.src;
    console.log(`Player car selected: ${playerCarPaths[randomIndex]}`);
  } else {
    // Wait for image to load if not ready yet
    const originalOnload = selectedCar.onload;
    selectedCar.onload = () => {
      car.src = selectedCar.src;
      console.log(`Player car selected: ${playerCarPaths[randomIndex]}`);
      if (originalOnload) originalOnload.call(selectedCar);
    };
  }
}

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
// Improved parameters for better mobile responsiveness
const isMobile = isMobileDevice();
// Player will be initialized after canvas is sized
const player = {
  width: 35,
  height: 70,
  x: 0, // Will be set after canvas initialization
  y: 0, // Will be set after canvas initialization
  speed: 5, // Legacy, not used
  velocity: 0, // Horizontal velocity for smooth movement
  // Mobile: faster response, desktop: smoother control
  maxSpeed: isMobile ? 7 : 6, // Slightly faster on mobile for better responsiveness
  acceleration: isMobile ? 1.2 : 0.8, // Much faster acceleration on mobile (was 0.8)
  friction: isMobile ? 0.88 : 0.92, // Less friction on mobile for quicker stops (was 0.92)
  decelerationRate: isMobile ? 0.25 : 0.15 // Faster direction change on mobile (was 0.15)
};

// Initialize player position after canvas is ready
function initializePlayerPosition() {
  if (displayWidth > 0 && displayHeight > 0) {
    player.x = displayWidth / 2 - player.width / 2;
    player.y = displayHeight - 150;
  }
}
const speedNormal = 4.5, speedBoost = 8; // More balanced speeds (was 5 and 12)
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
let lastFrameTime = performance.now(); // For deltaTime calculation

// Touch controls - Only for buttons, not canvas
let activeTouchId = null; // Track specific touch for multi-touch support
let touchTarget = null; // Track which element was touched (button only)

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

// Touch start on canvas for mobile - start game on first tap
canvas.addEventListener('touchstart', (e) => {
  // Only handle on mobile devices, if game hasn't started yet, and tap is directly on canvas
  const isMobile = isMobileDevice();
  if (isMobile && !gameStarted && !gameOver && e.target === canvas) {
    // Buttons call stopPropagation, so if we get here, it's not a button
    e.preventDefault();
    gameStarted = true;
    lastSpawnTime = Date.now();
    sounds.playEngine();
    updateMobileControlsVisibility(isMobile);
    hapticFeedback(30);
  }
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

// Improved virtual button handlers with better touch event support
if (mobileLeft) {
  mobileLeft.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent canvas touch handler
    const touch = e.touches[0];
    activeTouchId = touch.identifier;
    touchTarget = 'button-left';
    hapticFeedback(30);
    keys.ArrowLeft = true;
    keys.ArrowRight = false; // Ensure no conflict
    if (!gameStarted && !gameOver) {
      gameStarted = true;
      lastSpawnTime = Date.now();
      sounds.playEngine();
    }
  }, { passive: false });
  
  mobileLeft.addEventListener('touchmove', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Keep button active even if finger moves slightly
    if (touchTarget === 'button-left') {
      keys.ArrowLeft = true;
      keys.ArrowRight = false;
    }
  }, { passive: false });
  
  mobileLeft.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (touchTarget === 'button-left') {
      keys.ArrowLeft = false;
      activeTouchId = null;
      touchTarget = null;
    }
  }, { passive: false });
  
  mobileLeft.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (touchTarget === 'button-left') {
      keys.ArrowLeft = false;
      activeTouchId = null;
      touchTarget = null;
    }
  }, { passive: false });
}

if (mobileRight) {
  mobileRight.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent canvas touch handler
    const touch = e.touches[0];
    activeTouchId = touch.identifier;
    touchTarget = 'button-right';
    hapticFeedback(30);
    keys.ArrowRight = true;
    keys.ArrowLeft = false; // Ensure no conflict
    if (!gameStarted && !gameOver) {
      gameStarted = true;
      lastSpawnTime = Date.now();
      sounds.playEngine();
    }
  }, { passive: false });
  
  mobileRight.addEventListener('touchmove', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Keep button active even if finger moves slightly
    if (touchTarget === 'button-right') {
      keys.ArrowRight = true;
      keys.ArrowLeft = false;
    }
  }, { passive: false });
  
  mobileRight.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (touchTarget === 'button-right') {
      keys.ArrowRight = false;
      activeTouchId = null;
      touchTarget = null;
    }
  }, { passive: false });
  
  mobileRight.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (touchTarget === 'button-right') {
      keys.ArrowRight = false;
      activeTouchId = null;
      touchTarget = null;
    }
  }, { passive: false });
}

if (mobileBoost) {
  let boostTouchId = null; // Отдельный идентификатор для boost кнопки
  
  mobileBoost.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent canvas touch handler
    const touch = e.touches[0];
    boostTouchId = touch.identifier; // Сохраняем идентификатор для boost
    activeTouchId = touch.identifier;
    touchTarget = 'button-boost';
    hapticFeedback(30);
    keys.ArrowUp = true;
  }, { passive: false });
  
  mobileBoost.addEventListener('touchmove', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Keep button active even if finger moves slightly
    if (touchTarget === 'button-boost') {
      keys.ArrowUp = true;
    }
  }, { passive: false });
  
  mobileBoost.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Проверяем, что это событие относится к boost кнопке по идентификатору touch
    const endedTouch = Array.from(e.changedTouches).find(t => t.identifier === boostTouchId);
    if (endedTouch || e.target === mobileBoost || e.currentTarget === mobileBoost) {
      // Всегда сбрасываем boost если это событие от boost кнопки
      keys.ArrowUp = false;
      if (touchTarget === 'button-boost' || boostTouchId !== null) {
        activeTouchId = null;
        touchTarget = null;
        boostTouchId = null;
      }
    }
  }, { passive: false });
  
  mobileBoost.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Всегда сбрасываем boost при отмене touch для boost кнопки
    const cancelledTouch = Array.from(e.changedTouches).find(t => t.identifier === boostTouchId);
    if (cancelledTouch || e.target === mobileBoost || e.currentTarget === mobileBoost) {
      keys.ArrowUp = false;
      if (touchTarget === 'button-boost' || boostTouchId !== null) {
        activeTouchId = null;
        touchTarget = null;
        boostTouchId = null;
      }
    }
  }, { passive: false });
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
  
  // Calculate deltaTime for frame-rate independent movement
  const currentTime = performance.now();
  const deltaTime = Math.min((currentTime - lastFrameTime) / 16.67, 2.0); // Cap at 2x for stability
  lastFrameTime = currentTime;
  const timeScale = deltaTime; // Normalize to 60 FPS (16.67ms per frame)

  // Smooth player movement with acceleration and friction (frame-rate independent)
  // Improved physics: more responsive acceleration, smoother deceleration
  if (keys.ArrowLeft) {
    // Apply deceleration when changing direction
    if (player.velocity > 0) {
      player.velocity -= player.decelerationRate * timeScale * 2;
      if (player.velocity < 0) player.velocity = 0;
    }
    // Accelerate left
    player.velocity -= player.acceleration * timeScale;
  } else if (keys.ArrowRight) {
    // Apply deceleration when changing direction
    if (player.velocity < 0) {
      player.velocity += player.decelerationRate * timeScale * 2;
      if (player.velocity > 0) player.velocity = 0;
    }
    // Accelerate right
    player.velocity += player.acceleration * timeScale;
  } else {
    // Apply smooth friction when no input (exponential decay)
    // More realistic than Math.pow - uses exponential function
    const frictionFactor = Math.pow(player.friction, timeScale);
    player.velocity *= frictionFactor;
    
    // Stop completely if velocity is very small (prevents jitter)
    if (Math.abs(player.velocity) < 0.1) {
      player.velocity = 0;
    }
  }
  
  // Limit velocity with smooth clamping
  player.velocity = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.velocity));
  
  // Update position (frame-rate independent)
  player.x += player.velocity * timeScale;
  
  // Keep player within road bounds (not on shoulders/curbs)
  // If using road image, use road area only; otherwise use programmatic road bounds
  const minX = (roadImage.complete && roadImage.naturalWidth > 0) 
    ? roadImageStartX 
    : roadStartX;
  const maxX = (roadImage.complete && roadImage.naturalWidth > 0) 
    ? roadImageStartX + roadImageWidth - player.width 
    : roadStartX + roadWidth - player.width;
  player.x = Math.max(minX, Math.min(player.x, maxX));
  
  // Keep player within canvas bounds
  player.x = Math.max(0, Math.min(player.x, displayWidth - player.width));
  player.y = Math.max(0, Math.min(player.y, displayHeight - player.height));

  // Enemy movement with speed multiplier (frame-rate independent)
  const mv = keys.ArrowUp ? speedBoost : speedNormal;
  
  // Play boost sound when boosting
  if (keys.ArrowUp && mv === speedBoost) {
    sounds.playBoost();
  }
  
  enemies.forEach(e => {
    e.y += mv * (e.speedMultiplier || 1.0) * timeScale;
  });
  
  // Animate road (move forward effect) - slower than enemy speed for smooth effect
  const roadSpeed = mv * 0.2; // 20% of movement speed for smoother, less blurry road animation
  roadOffset += roadSpeed * timeScale;
  // Reset logic is handled in drawRoad() function based on image height or tile size
  
  // Dynamic enemy spawning
  const spawnCheckTime = Date.now();
  if (spawnCheckTime - lastSpawnTime >= getSpawnInterval()) {
    spawnEnemy();
    lastSpawnTime = spawnCheckTime;
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
    if (enemies[i].y > displayHeight) {
      enemies.splice(i, 1);
      score += pointsPerEnemy;
      sounds.playScore();
    }
  }
}

// ====== Draw ======
// Cache for road pattern to avoid recreating it every frame
let roadPatternCache = {
  pattern: null,
  scaledHeight: 0,
  canvasWidth: 0
};

function drawRoad() {
  // Use road image if loaded, otherwise fallback to programmatic drawing
  if (roadImage.complete && roadImage.naturalWidth > 0) {
    const roadImageHeight = roadImage.height;
    const roadImageWidth = roadImage.width;
    
    // Scale image to match display width while maintaining aspect ratio
    const scale = displayWidth / roadImageWidth;
    const scaledHeight = roadImageHeight * scale;
    
      // Create or reuse pattern for seamless tiling
      if (!roadPatternCache.pattern || 
          roadPatternCache.scaledHeight !== scaledHeight || 
          roadPatternCache.canvasWidth !== displayWidth) {
        
        // Create a temporary canvas for the pattern tile
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = displayWidth;
        patternCanvas.height = scaledHeight;
        const patternCtx = patternCanvas.getContext('2d');
        
        // Enable high-quality smoothing
        patternCtx.imageSmoothingEnabled = true;
        patternCtx.imageSmoothingQuality = 'high';
        
        // Draw the road image scaled to pattern canvas
        patternCtx.drawImage(
          roadImage,
          0, 0, roadImageWidth, roadImageHeight,
          0, 0, displayWidth, scaledHeight
        );
        
        // Create pattern that repeats vertically
        roadPatternCache.pattern = ctx.createPattern(patternCanvas, 'repeat-y');
        roadPatternCache.scaledHeight = scaledHeight;
        roadPatternCache.canvasWidth = displayWidth;
      }
    
    // Normalize offset to prevent floating point accumulation errors
    let normalizedOffset = roadOffset;
    if (normalizedOffset >= scaledHeight) {
      normalizedOffset = normalizedOffset % scaledHeight;
      roadOffset = normalizedOffset;
    }
    
    ctx.save();
    
    // Use pattern fill - this creates truly seamless tiling without visible cuts
    ctx.translate(0, normalizedOffset);
    ctx.fillStyle = roadPatternCache.pattern;
    
    // Fill a larger area to ensure complete coverage
    ctx.fillRect(0, -scaledHeight, displayWidth, displayHeight + scaledHeight * 2);
    
    ctx.restore();
  } else {
    // Fallback: Draw brown shoulders (outer edges)
    ctx.fillStyle = "#8b6f47"; // Brown dirt/gravel
    ctx.fillRect(0, 0, shoulderWidth, displayHeight);
    ctx.fillRect(displayWidth - shoulderWidth, 0, shoulderWidth, displayHeight);
    
    // Draw gray curbs
    ctx.fillStyle = "#a0a0a0"; // Light gray
    ctx.fillRect(shoulderWidth, 0, curbWidth, displayHeight);
    ctx.fillRect(displayWidth - shoulderWidth - curbWidth, 0, curbWidth, displayHeight);
    
    // Draw animated road texture with smooth movement
    ctx.save();
    ctx.translate(0, roadOffset);
    ctx.fillStyle = asphaltPattern;
    ctx.fillRect(roadStartX, -60, roadWidth, displayHeight + 60);
    ctx.restore();
    
    // Reset roadOffset for seamless loop
    if (roadOffset >= 30) {
      roadOffset = roadOffset - 30;
    }
  }
}
function draw() {
  // На мобильных не сбрасываем трансформацию (она уже установлена с учетом dpr)
  // На десктопе сбрасываем трансформацию
  // Используем функцию напрямую для определения мобильного устройства
  if (!isMobileDevice()) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  // Используем display размеры для clearRect, так как контекст уже масштабирован
  ctx.clearRect(0, 0, displayWidth, displayHeight);

  // Don't draw anything until all images are loaded
  if (!allImagesReady) {
    // Show loading message
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Loading...", displayWidth / 2, displayHeight / 2);
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
    ctx.moveTo(displayWidth/2, -60 + roadOffset);
    ctx.lineTo(displayWidth/2, displayHeight + 60 + roadOffset);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.save();
  // Visual tilt effect based on movement direction
  // Improved: smoother tilt with better responsiveness
  const tiltAngle = player.velocity * 0.04; // Slightly reduced for more realistic feel (was 0.05)
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  ctx.rotate(tiltAngle);
  
  if (keys.ArrowUp) { 
    // Масштабируем shadowBlur для правильного отображения на мобильных с dpr
    const dpr = window.devicePixelRatio || 1;
    const isMobile = isMobileDevice();
    ctx.shadowColor = "cyan"; 
    // На мобильных контекст уже масштабирован на dpr, поэтому shadowBlur должен быть в координатах контекста
    // Чтобы визуальный эффект был одинаковым, используем одинаковое значение
    // Но увеличиваем для лучшей видимости на мобильных
    ctx.shadowBlur = isMobile ? 20 * dpr : 20; 
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  } else {
    // Сбрасываем shadow когда не ускоряемся
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
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
    
    // Draw enemy car (only one type: enemycar.png)
    if (enemyCar.complete && enemyCar.naturalWidth > 0) {
      ctx.drawImage(enemyCar, e.x, e.y, e.width, e.height);
    }
    // Don't draw fallback rectangle - wait for image to load
    ctx.restore();
  });

  // Не сбрасываем трансформацию здесь - она нужна для правильного масштабирования на мобильных
  // Используем функцию напрямую для определения мобильного устройства
  if (!isMobileDevice()) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  ctx.font = "bold 32px 'Press Start 2P'";
  ctx.fillStyle = "yellow";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 6;
  const txt = gameStarted ? score : 0;
  ctx.fillText(txt, displayWidth/2, 10);
  
  // Show speed boost multiplier indicator
  if (gameStarted && !gameOver && keys.ArrowUp) {
    ctx.font = "bold 16px 'Press Start 2P'";
    ctx.fillStyle = "cyan";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 4;
    ctx.fillText("2x POINTS", displayWidth/2, 50);
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
  initializePlayerPosition();
  player.velocity = 0;
  roadOffset = 0;
  lastSpawnTime = Date.now();
  lastFrameTime = performance.now(); // Reset frame time tracking
  sounds.stopEngine();
  hideGameOverScreen();
  const pauseOverlay = document.getElementById('pauseOverlay');
  if (pauseOverlay) {
    pauseOverlay.classList.add('hidden');
  }
  
  // Select a new random player car on restart for variety
  selectRandomPlayerCar();
  
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
