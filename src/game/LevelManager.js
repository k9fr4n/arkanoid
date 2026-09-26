// Level management system
import { CONFIG, DERIVED } from '../config.js';
import { Brick } from '../entities/Brick.js';

export class LevelManager {
  constructor(scene, effects, audio) {
    this.scene = scene;
    this.effects = effects;
    this.audio = audio;
    this.bricks = [];
    this.currentLevelData = null;
    this.bricksRemaining = 0;
    this.destructibleBricks = 0;
  }

  loadLevel(levelIndex) {
    this.clearLevel();
    this.currentLevelData = CONFIG.LEVELS[levelIndex] || CONFIG.LEVELS[CONFIG.LEVELS.length - 1];
    this.buildLevel(this.currentLevelData.rows);
    return this.currentLevelData;
  }

  buildLevel(rows) {
    this.bricks = [];
    this.bricksRemaining = 0;
    this.destructibleBricks = 0;

    const startY = CONFIG.BRICK.START_Y;
    const brickWidth = CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP;
    const brickHeight = CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP;
    const totalWidth = CONFIG.BRICK.COLS * brickWidth - CONFIG.BRICK.GAP;
    const startX = -totalWidth / 2 + CONFIG.BRICK.WIDTH / 2;

    rows.forEach((row, rowIndex) => {
      row.forEach((typeId, colIndex) => {
        if (typeId === 0) return; // Empty

        const x = startX + colIndex * brickWidth;
        const y = startY - rowIndex * brickHeight;
        const z = 0;

        const brick = new Brick(this.scene, this.effects, this.audio, typeId, x, y, z);
        brick.spawn(rowIndex * 100 + colIndex * 20); // Staggered spawn
        this.bricks.push(brick);

        if (typeId !== 4) { // Not indestructible
          this.destructibleBricks++;
        }
        this.bricksRemaining++;
      });
    });
  }

  clearLevel() {
    this.bricks.forEach(brick => brick.dispose());
    this.bricks = [];
    this.bricksRemaining = 0;
    this.destructibleBricks = 0;
  }

  update(deltaTime) {
    this.bricks.forEach(brick => {
      if (brick.active) {
        brick.update(deltaTime);
      }
    });
  }

  // Check collision with ball
  checkBallCollision(ball) {
    for (const brick of this.bricks) {
      if (!brick.active) continue;

      const result = ball.checkBrickCollision(brick);
      if (result === true || result === 'PENETRATE') {
        const destroyed = brick.hit();

        if (destroyed) {
          this.bricksRemaining--;
          if (brick.typeId !== 4) {
            this.destructibleBricks--;
          }

          // Check for power-up drop
          if (brick.shouldDropPowerUp()) {
            return { brick, destroyed: true, dropPowerUp: true, position: brick.mesh.position.clone(), type: brick.typeId };
          }
          return { brick, destroyed: true, dropPowerUp: false, position: brick.mesh.position.clone(), type: brick.typeId };
        } else if (result === 'PENETRATE') {
          // Fireball passes through but still damages
          return { brick, destroyed: false, dropPowerUp: false, penetrate: true };
        }
        return { brick, destroyed: false, dropPowerUp: false };
      }
    }
    return null;
  }

  getBricksRemaining() {
    return this.bricksRemaining;
  }

  getDestructibleBricksRemaining() {
    return this.destructibleBricks;
  }

  isLevelComplete() {
    return this.destructibleBricks === 0;
  }

  getBricks() {
    return this.bricks;
  }

  getActiveBricks() {
    return this.bricks.filter(b => b.active);
  }
}