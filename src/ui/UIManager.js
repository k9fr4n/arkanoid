// UI Manager
export class UIManager {
  constructor(game) {
    this.game = game;
    this.screens = {
      title: document.getElementById('title-screen'),
      pause: document.getElementById('pause-screen'),
      levelComplete: document.getElementById('level-complete-screen'),
      gameOver: document.getElementById('game-over-screen'),
      options: document.getElementById('options-screen'),
      game: null // Game screen is just hiding all others
    };
    this.launchHint = document.getElementById('launch-hint');
    this.controlsHint = document.querySelector('.controls-hint');
    this.multiplierDisplay = document.getElementById('multiplier-display');
    this.livesContainer = document.getElementById('lives');

    this.initLives();
  }

  initLives() {
    this.livesContainer.innerHTML = '';
    for (let i = 0; i < this.game.gameState.maxLives; i++) {
      const life = document.createElement('div');
      life.className = 'life-icon';
      this.livesContainer.appendChild(life);
    }
  }

  showScreen(screenName) {
    Object.values(this.screens).forEach(screen => {
      if (screen) screen.classList.add('hidden');
    });

    if (screenName === 'game') {
      this.launchHint.classList.remove('hidden');
      this.controlsHint.style.display = 'flex';
    } else {
      this.launchHint.classList.add('hidden');
      this.controlsHint.style.display = 'none';
      const screen = this.screens[screenName];
      if (screen) screen.classList.remove('hidden');
    }
  }

  updateHUD(gameState) {
    // Score
    document.getElementById('score').textContent = gameState.score.toLocaleString();

    // Level
    document.getElementById('level').textContent = gameState.currentLevel + 1;

    // Lives
    const lifeIcons = this.livesContainer.querySelectorAll('.life-icon');
    lifeIcons.forEach((icon, i) => {
      if (i < gameState.lives) {
        icon.classList.remove('lost');
      } else {
        icon.classList.add('lost');
      }
    });

    // Multiplier
    if (gameState.multiplier > 1) {
      this.multiplierDisplay.textContent = `×${gameState.multiplier}`;
      this.multiplierDisplay.classList.add('visible');
    } else {
      this.multiplierDisplay.classList.remove('visible');
    }
  }

  updateLevelDisplay(levelNumber, levelName) {
    // Could add level name display here
  }

  showLaunchHint() {
    this.launchHint.classList.remove('hidden');
  }

  hideLaunchHint() {
    this.launchHint.classList.add('hidden');
  }

  updatePowerUpDisplay(gameState) {
    // Could add active power-up indicators here
  }

  showLevelComplete(score, bonus, total) {
    document.getElementById('lc-score').textContent = score.toLocaleString();
    document.getElementById('lc-bonus').textContent = bonus.toLocaleString();
    document.getElementById('lc-total').textContent = total.toLocaleString();
    this.showScreen('levelComplete');
  }

  showGameOver(score, level) {
    document.getElementById('go-score').textContent = score.toLocaleString();
    document.getElementById('go-level').textContent = level;
    this.showScreen('gameOver');
  }
}