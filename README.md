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
- ⚡ **Smooth Physics**: Realistic acceleration, friction, and momentum
- 🎨 **Visual Effects**: Car tilt animation, speed boost glow, road scrolling
- 🚗 **Dynamic Enemies**: Intelligent spawning system with varied speeds
- 📊 **Score System**: Double points when using speed boost

### 💾 Data Management
- 💯 **Best Score Tracking**: Automatically saved to localStorage
- 🏆 **Leaderboard System**: Track top scores with time-based filtering
- 📝 **Player Names**: Add your name to the leaderboard
- 🔄 **Persistent Data**: All progress saved locally

### 🎨 Visual Design
- 🖼️ **Custom Road Graphics**: Beautiful multi-lane road with realistic markings
- 🎭 **Retro Aesthetic**: Pixel-art style with modern polish
- 📱 **Responsive Layout**: Works on desktop and tablet devices
- ✨ **Smooth Animations**: 60 FPS gameplay with optimized rendering

### 🛠️ Technical Features
- 🚀 **Zero Dependencies**: Pure vanilla JavaScript
- 📦 **Modular Structure**: Well-organized codebase
- 🎯 **Performance Optimized**: Efficient collision detection and rendering
- 🔧 **Easy to Deploy**: Ready for Vercel, Netlify, or any static host

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

| Key | Action |
|-----|--------|
| **←** | Move left |
| **→** | Move right |
| **↑** | Speed boost (hold) |
| **R** | Restart after Game Over |

### 💡 Tips

- Hold **↑** while dodging to earn **2x points**
- Enemy spawn rate increases with your score
- Some enemies move faster - watch for the yellow glow!

---

## 📸 Screenshots

> *Gameplay screenshot would go here*

### Game Features Showcase

- **Main Game**: Smooth racing action with dynamic road scrolling
- **Game Over Screen**: Beautiful overlay with score display and restart options
- **Leaderboard**: Track your best scores with time-based filtering

---

## 📁 Project Structure

```
racinggame/
├── index.html              # Main game page
├── leaderboard.html        # Leaderboard page
├── vercel.json             # Vercel deployment config
├── README.md               # This file
├── LICENSE                 # MIT License
│
├── css/                    # Stylesheets
│   ├── style.css          # Main styles
│   └── game.css           # Game-specific styles
│
├── js/                     # JavaScript files
│   ├── script.js          # Game logic (527 lines)
│   └── leaderboard.js     # Leaderboard logic (90 lines)
│
└── assets/                 # Static assets
    └── images/            # Game images
        ├── car.png       # Player car sprite
        ├── enemycar.png  # Enemy car sprite
        ├── logo.svg      # Game logo
        └── road.png      # Road texture
```

---

## 🛠️ Technologies Used

- **HTML5**: Semantic markup and Canvas API
- **CSS3**: Modern styling with animations and responsive design
- **JavaScript (ES6+)**: Game logic, physics, and state management
- **Canvas API**: 2D rendering and game graphics
- **LocalStorage API**: Persistent data storage
- **Google Fonts**: Press Start 2P & Quantico fonts

---

## 🎯 Game Mechanics

### Physics System
- **Velocity-based movement** with acceleration and friction
- **Collision detection** using AABB (Axis-Aligned Bounding Box)
- **Dynamic enemy spawning** with safe position checking

### Scoring System
- **Base points**: 1 point per enemy dodged
- **Boost multiplier**: 2x points when holding speed boost
- **Difficulty scaling**: Enemy spawn rate increases with score

### Road System
- **Seamless scrolling** with optimized texture tiling
- **Multi-lane design** with proper boundaries
- **Visual feedback** with road animation synchronized to speed

---

## 🌐 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or simply push to GitHub and connect your repository to Vercel.

### Deploy to Netlify

1. Drag and drop the project folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect your Git repository

### Deploy to GitHub Pages

1. Push code to GitHub repository
2. Go to Settings → Pages
3. Select source branch and folder
4. Your game will be live at `https://username.github.io/repository-name`

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
- 📱 Mobile touch controls
- 🌍 Multi-language support
- 🎯 Power-ups and special abilities

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

- **Lines of Code**: ~700+
- **Files**: 10+
- **Dependencies**: 0
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

---

<div align="center">

**Made with ❤️ using vanilla web technologies**

⭐ Star this repo if you find it helpful!

</div>
