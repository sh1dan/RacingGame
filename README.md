# 🏎️ Racing Game

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A fast-paced, retro-style racing game built with vanilla HTML5, CSS3, and JavaScript. No frameworks, no dependencies, just pure web technologies!**

[Play Now](#-quick-start) • [Features](#-features) • [Screenshots](#-screenshots) • [Contributing](#-contributing)

</div>

---

## 📖 About

Racing Game is an engaging top-down racing game where players dodge enemy cars while racing down a multi-lane highway. Built entirely with vanilla web technologies, it demonstrates modern game development techniques using Canvas API, LocalStorage, and smooth animations.

### 🎮 Gameplay

- **Dodge enemy cars** while maintaining your speed
- **Use speed boost** to earn double points
- **Compete** for the highest score
- **Track your progress** with persistent leaderboards

---

## ✨ Features

### 🎯 Core Gameplay
- ⚡ **Smooth Physics**: Realistic acceleration, friction, and momentum with frame-rate independent movement
- 🎨 **Visual Effects**: Car tilt animation, speed boost glow, seamless road scrolling
- 🚗 **Dynamic Enemies**: Intelligent spawning system with varied speeds
- 📊 **Score System**: Double points when using speed boost
- 🎲 **Random Car Selection**: Player car randomly changes between Mercedes G63 and Porsche 911 GT3 RS on each restart

### 💾 Data Management
- 💯 **Best Score Tracking**: Automatically saved to localStorage
- 🏆 **Leaderboard System**: Track top scores with time-based filtering
- 📝 **Player Names**: Add your name to the leaderboard
- 🔄 **Persistent Data**: All progress saved locally

### 🎨 Visual Design
- 🖼️ **Custom Road Graphics**: Beautiful multi-lane road with seamless tiling and realistic markings
- 🎭 **Retro Aesthetic**: Pixel-art style with modern polish
- 🎮 **Custom SVG Icons**: Pixel-perfect button icons for mobile controls
- 🚗 **SVG Car Graphics**: High-quality scalable car graphics (Mercedes G63, Porsche 911 GT3 RS)
- 📱 **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile devices
- ✨ **Smooth Animations**: 60 FPS gameplay with optimized rendering and deltaTime-based movement
- 🎨 **Enhanced UI**: Modern button designs with gradients, shadows, and hover effects

### 🛠️ Technical Features
- 🚀 **Zero Dependencies**: Pure vanilla JavaScript
- 📦 **Modular Structure**: Well-organized codebase
- 🎯 **Performance Optimized**: Efficient collision detection and rendering
- ⏱️ **Frame-Rate Independent**: DeltaTime-based movement ensures consistent speed across all devices
- 📱 **Mobile-First**: Enhanced touch controls with position-based steering and haptic feedback support
- 🎨 **Seamless Road Tiling**: Canvas pattern-based road rendering eliminates visible seams

---

## 🚀 Quick Start

### Prerequisites

No installation required! Just a modern web browser.

### Option 1: Node.js (Recommended)

```bash
# Using npx (no installation needed)
npx http-server -p 8000 -o

# Or install globally
npm install -g http-server
http-server -p 8000 -o
```

### Option 2: Python

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Option 3: PHP

```bash
php -S localhost:8000
```

### Option 4: VS Code Live Server

1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

Then open your browser to `http://localhost:8000`

---

## 🎮 Controls

### Desktop Controls

| Key | Action |
|-----|--------|
| **←** | Move left |
| **→** | Move right |
| **↑** | Speed boost (hold) |
| **P** | Pause game |
| **R** | Restart after Game Over |

### Mobile Controls

- **Touch-based steering**: Touch left half of screen to steer left, right half to steer right, top 30% for boost
- **Virtual buttons**: Pixel-art style buttons with SVG icons
  - **Pause button**: Yellow button in top-left corner
  - **Left arrow**: Green button with teal highlight
  - **Right arrow**: Green button with teal highlight
  - **Boost button**: Green button with rocket icon
- **Enhanced responsiveness**: Optimized physics for mobile devices with faster acceleration and better control

### 💡 Tips

- Hold **↑** while dodging to earn **2x points**
- Enemy spawn rate increases with your score
- Some enemies move faster - watch for the yellow glow!
- On mobile, use touch position on screen or virtual buttons for precise control
- Your car changes randomly on each restart - try different cars!
- Game speed is consistent across all devices thanks to frame-rate independent movement

---

## 📸 Screenshots

> https://tikolu.net/i/vgxox

### Game Features Showcase

- **Main Game**: Smooth racing action with dynamic road scrolling
- **Game Over Screen**: Beautiful overlay with score display and restart options
- **Leaderboard**: Track your best scores with time-based filtering
- **Mobile UI**: Custom pixel-art buttons with smooth animations

---

## 📁 Project Structure

```
racinggame/
├── index.html              # Main game page
├── leaderboard.html        # Leaderboard page
├── README.md               # This file
├── LICENSE                 # MIT License
│
├── css/                    # Stylesheets
│   ├── style.css          # Main styles (1172 lines)
│   └── game.css           # Game-specific styles (placeholder, 1 line)
│
├── js/                     # JavaScript files
│   ├── script.js          # Game logic (1104 lines)
│   └── leaderboard.js     # Leaderboard logic (87 lines)
│
└── assets/                 # Static assets
    ├── images/            # Game images and icons
    │   ├── enemycar.png   # Enemy car sprite (used)
    │   ├── logo.svg       # Game logo
    │   ├── road.png       # Road texture (used)
    │   ├── pause-icon.svg      # Pause button icon (yellow)
    │   ├── left-arrow-icon.svg # Left arrow button icon (green)
    │   ├── right-arrow-icon.svg# Right arrow button icon (green)
    │   ├── up-arrow-icon.svg   # Boost button icon (rocket, green)
    │   └── cars/          # Player car collection (used)
    │       ├── mercedesG63.svg      # Mercedes G63 (player car, randomly selected)
    │       └── porsche911GT3rs.svg # Porsche 911 GT3 RS (player car, randomly selected)
    └── sounds/            # Sound effects directory (empty, using Web Audio API)
```

---

## 🛠️ Technologies Used

- **HTML5**: Semantic markup and Canvas API
- **CSS3**: Modern styling with animations, gradients, and responsive design
- **JavaScript (ES6+)**: Game logic, physics, and state management
- **Canvas API**: 2D rendering and game graphics
- **SVG**: Scalable vector graphics for UI icons
- **LocalStorage API**: Persistent data storage
- **Web Audio API**: Sound effects generation
- **Google Fonts**: Press Start 2P & Quantico fonts

---

## 🎯 Game Mechanics

### Physics System
- **Velocity-based movement** with acceleration and friction
- **Frame-rate independent movement** using deltaTime for consistent speed across devices
- **Mobile-optimized physics** with faster acceleration and better responsiveness on touch devices
- **Collision detection** using AABB (Axis-Aligned Bounding Box)
- **Dynamic enemy spawning** with safe position checking

### Scoring System
- **Base points**: 1 point per enemy dodged
- **Boost multiplier**: 2x points when holding speed boost
- **Difficulty scaling**: Enemy spawn rate increases with score

### Road System
- **Seamless scrolling** with Canvas pattern-based tiling (no visible seams)
- **Multi-lane design** with proper boundaries
- **Visual feedback** with road animation synchronized to speed
- **Optimized rendering** using pattern caching for better performance

### UI System
- **Responsive buttons**: Uniform sizing and styling across all devices
- **SVG icons**: Pixel-perfect icons with crisp rendering
- **Smooth animations**: Press effects and hover states
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Touch-optimized controls**: Position-based steering and virtual buttons with haptic feedback

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Ideas for Contributions

- 🎨 New car designs and road textures
- 🎵 Sound effects and background music
- 🏁 New game modes (time attack, endless mode)
- 📱 Enhanced mobile touch controls
- 🌍 Multi-language support
- 🎯 Power-ups and special abilities
- 🎨 New SVG icon designs
- ♿ Accessibility improvements

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Yan Riabonenko**

- GitHub: [@sh1dan](https://github.com/sh1dan)
- Twitter: [@YourAnonSh1dan](https://twitter.com/YourAnonSh1dan)

---

## 🙏 Acknowledgments

- Inspired by classic arcade racing games
- Built with modern web technologies
- Thanks to all contributors and players!

---

## 📊 Project Stats

- **Total Lines of Code**: ~2364
  - CSS: 1172 lines (style.css)
  - JavaScript: 1191 lines (script.js: 1104, leaderboard.js: 87)
  - HTML: ~180 lines (index.html + leaderboard.html)
- **Files**: 15+
- **Dependencies**: 0 (pure vanilla JavaScript)
- **Images Loaded**: 5 total
  - Road texture: 1
  - Player cars: 2 (Mercedes G63, Porsche 911 GT3 RS)
  - Enemy car: 1 (enemycar.png)
  - Legacy enemy car: 1 (for backward compatibility)
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile Support**: iOS Safari, Chrome Mobile, Firefox Mobile
- **Player Cars**: 2 (Mercedes G63, Porsche 911 GT3 RS) - randomly selected on each restart
- **Enemy Cars**: 1 (enemycar.png)
- **Frame Rate**: 60 FPS with deltaTime-based movement for consistent speed across devices

---

## 🎨 UI Improvements

### Button Design
- **Modern gradients**: Smooth color transitions for visual depth
- **3D effects**: Multi-layered shadows for depth perception
- **Hover animations**: Shimmer effects and smooth transitions
- **Press feedback**: Visual and haptic feedback on interaction
- **Accessibility**: Focus states and proper contrast ratios

### Mobile Controls
- **Pixel-art style**: Retro aesthetic with modern functionality
- **Uniform sizing**: Consistent button dimensions (65px on mobile, 60px on small screens)
- **Perfect centering**: Flexbox-based icon alignment
- **Touch optimized**: Large touch targets with haptic feedback
- **Position-based steering**: Intuitive touch controls - touch left/right half of screen to steer
- **Enhanced responsiveness**: Optimized physics parameters for better mobile control

---

<div align="center">

**Made with ❤️ using vanilla web technologies**

⭐ Star this repo if you find it helpful!

</div>
