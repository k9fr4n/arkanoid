# NEON BREAKER

A modern arcade breakout game built with Three.js, featuring a futuristic neon sci-fi aesthetic, smooth 3D graphics, and polished gameplay.

![NEON BREAKER](https://img.shields.io/badge/NEON-BREAKER-00f3ff?style=for-the-badge&logoColor=00f3ff)
![Three.js](https://img.shields.io/badge/Three.js-r160-000000?style=for-the-badge&logo=three.js)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2023-F7DF1E?style=for-the-badge&logo=javascript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## 🎮 Features

- **Modern 3D Graphics** - Built with Three.js featuring neon glow effects, dynamic lighting, and particle systems
- **6 Unique Levels** - Progressive difficulty with varied brick layouts and patterns
- **7 Power-Up Types** - Multi-Ball, Wide Paddle, Slow Ball, Fire Ball, Shield, Magnet, Score Multiplier
- **4 Brick Types** - Standard, Reinforced (3 hits), Special (drops power-ups), Indestructible
- **Responsive Controls** - Mouse, keyboard (arrows/A-D), and touch support
- **Procedural Audio** - Synthesized sound effects and ambient music via Web Audio API
- **Visual Effects** - Particle explosions, ball trails, screen shake, glow effects
- **Score System** - Combo multipliers, high scores, level bonuses
- **Full Menu System** - Title screen, pause menu, level complete, game over
- **Options** - Toggle sound, music, particles, trails
- **Mobile Friendly** - Touch controls, responsive UI, works on all devices

## 🛠 Technologies

- **Three.js** (r160) - 3D rendering
- **Vite** (5.0) - Build tool and dev server
- **Vanilla JavaScript (ES Modules)** - No framework overhead
- **Web Audio API** - Procedural sound synthesis
- **GitHub Actions** - CI/CD pipeline
- **GitHub Pages** - Static hosting

## 🚀 Development

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/neon-breaker.git
cd neon-breaker

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🌐 Deployment

The project is configured for automatic deployment to GitHub Pages via GitHub Actions.

### Setup

1. Push to a GitHub repository
2. Enable GitHub Pages in repository settings:
   - Source: "GitHub Actions"
3. Push to `main` branch triggers automatic deployment

### Manual Deployment

You can also trigger deployment manually from the Actions tab in GitHub.

### Live Demo

**https://k9fr4n.github.io/arkanoid/**

Once deployed, the game will be available at:
```
https://<your-username>.github.io/<repository-name>/
```

## 🎯 Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Move Paddle | Mouse movement / ← → / A D | Touch drag |
| Launch Ball | Click / Space | Tap |
| Pause | ESC / P | — |

## 🏗 Architecture

```
src/
├── main.js                 # Entry point
├── config.js               # Game configuration constants
├── game/
│   ├── Game.js             # Main game loop
│   ├── GameState.js        # State management
│   ├── LevelManager.js     # Level loading & bricks
│   └── CollisionSystem.js  # Physics & collisions
├── entities/
│   ├── Ball.js             # Ball physics & rendering
│   ├── Paddle.js           # Player paddle
│   ├── Brick.js            # Destructible bricks
│   ├── PowerUp.js          # Falling power-ups
│   └── Arena.js            # Walls & boundaries
├── rendering/
│   ├── Scene.js            # Three.js scene, camera, lighting
│   └── Effects.js          # Particles, trails, materials
├── input/
│   └── InputManager.js     # Unified input handling
├── audio/
│   └── AudioManager.js     # Web Audio API synthesis
└── ui/
    └── UIManager.js        # HUD, menus, screens
```

## ⚙ Configuration

Game constants are centralized in `src/config.js` for easy tweaking:

- Arena dimensions
- Paddle/ball physics
- Brick types and scoring
- Power-up effects and durations
- Level definitions
- Visual effect parameters

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome for Android)

Requires WebGL 2.0 support.

## 🎨 Art Direction

**Neon Sci-Fi Arcade** aesthetic featuring:
- Dark futuristic arena with glowing grid
- Cyan/magenta/gold color palette
- Additive blending for glow effects
- Smooth animations and transitions
- Particle-based destruction effects
- Dynamic lighting with rim lights

## 📄 License

MIT License - feel free to use, modify, and distribute.

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**NEON BREAKER** - A modern take on the classic breakout genre. Built with ❤️ and Three.js.