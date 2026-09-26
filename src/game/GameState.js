// Game state management
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentLevel = 0;
    this.score = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.multiplier = 1;
    this.multiplierTimer = 0;
    this.consecutiveHits = 0;
    this.lastHitTime = 0;
    this.gameStatus = 'MENU'; // MENU, PLAYING, PAUSED, LEVEL_COMPLETE, GAME_OVER, LAUNCHING
    this.ballsLaunched = 0;
    this.totalBricksDestroyed = 0;
    this.powerUpsActive = new Map(); // type -> { endTime, data }
    this.levelStartTime = 0;
    this.gameStartTime = 0;
  }

  startGame() {
    this.reset();
    this.lives = 3;
    this.maxLives = 3;
    this.gameStatus = 'LAUNCHING';
    this.currentLevel = 0;
    this.gameStartTime = performance.now();
    this.startLevel();
  }

  startLevel() {
    this.levelStartTime = performance.now();
    this.ballsLaunched = 0;
    this.gameStatus = 'LAUNCHING';
  }

  completeLevel() {
    this.gameStatus = 'LEVEL_COMPLETE';
  }

  loseLife() {
    this.lives--;
    if (this.lives <= 0) {
      this.gameStatus = 'GAME_OVER';
    } else {
      this.gameStatus = 'LAUNCHING';
      this.ballsLaunched = 0;
      // Reset power-ups on life loss
      this.powerUpsActive.clear();
      this.multiplier = 1;
      this.consecutiveHits = 0;
    }
  }

  addScore(points) {
    const mult = this.multiplier || 1;
    this.score += points * mult;
  }

  registerHit() {
    const now = performance.now();
    if (now - this.lastHitTime < 1500) { // 1.5 second window for combo
      this.consecutiveHits++;
      if (this.consecutiveHits >= 5 && this.multiplier < 4) {
        this.multiplier = Math.min(4, Math.floor(this.consecutiveHits / 5) + 1);
        this.multiplierTimer = 3000; // 3 seconds
      }
    } else {
      this.consecutiveHits = 1;
    }
    this.lastHitTime = now;
  }

  updateMultiplier(deltaTime) {
    if (this.multiplier > 1) {
      this.multiplierTimer -= deltaTime;
      if (this.multiplierTimer <= 0) {
        this.multiplier = 1;
        this.consecutiveHits = 0;
      }
    }
  }

  activatePowerUp(type, duration = 10000) {
    const endTime = performance.now() + duration;
    this.powerUpsActive.set(type, { endTime, data: null });
  }

  deactivatePowerUp(type) {
    this.powerUpsActive.delete(type);
  }

  isPowerUpActive(type) {
    const pu = this.powerUpsActive.get(type);
    if (!pu) return false;
    if (performance.now() > pu.endTime) {
      this.powerUpsActive.delete(type);
      return false;
    }
    return true;
  }

  getPowerUpRemainingTime(type) {
    const pu = this.powerUpsActive.get(type);
    if (!pu) return 0;
    return Math.max(0, pu.endTime - performance.now());
  }

  updatePowerUps() {
    const now = performance.now();
    for (const [type, pu] of this.powerUpsActive) {
      if (now > pu.endTime) {
        this.powerUpsActive.delete(type);
      }
    }
  }

  nextLevel() {
    this.currentLevel++;
    this.startLevel();
  }

  retry() {
    this.reset();
    this.startGame();
  }

  getLevelData() {
    return CONFIG.LEVELS[this.currentLevel] || CONFIG.LEVELS[CONFIG.LEVELS.length - 1];
  }

  getTimeElapsed() {
    return performance.now() - this.gameStartTime;
  }

  getLevelTimeElapsed() {
    return performance.now() - this.levelStartTime;
  }
}

// Import CONFIG for derived values
import { CONFIG } from '../config.js';