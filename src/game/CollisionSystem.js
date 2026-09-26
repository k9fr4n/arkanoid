// Collision detection and resolution system
import { CONFIG } from '../config.js';
import { PowerUp } from '../entities/PowerUp.js';

export class CollisionSystem {
  constructor(arena, paddle, balls, levelManager, effects, audio, gameState, game) {
    this.arena = arena;
    this.paddle = paddle;
    this.balls = balls;
    this.levelManager = levelManager;
    this.effects = effects;
    this.audio = audio;
    this.gameState = gameState;
    this.game = game;
  }

  update(deltaTime) {
    // Update each ball
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      if (!ball.isLaunched) continue;

      // Arena collision
      this.arena.checkBallCollision(ball);

      // Check if ball lost
      if (this.arena.isBallLost(ball)) {
        this.handleBallLost(ball, i);
        continue;
      }

      // Paddle collision (including shield)
      if (this.paddle.checkShield(ball)) {
        continue; // Shield handled it
      }
      if (ball.checkPaddleCollision(this.paddle)) {
        this.paddle.triggerGlow();
        this.gameState.registerHit();
        continue;
      }

      // Brick collisions
      const collision = this.levelManager.checkBallCollision(ball);
      if (collision) {
        this.handleBrickCollision(ball, collision);
      }
    }

    // Ball-ball collision (for multi-ball)
    this.checkBallBallCollisions();
  }

  handleBallLost(ball, index) {
    this.audio.playLifeLost();
    this.effects.spawnGameOverEffect();
    this.gameState.loseLife();

    // Remove ball if multi-ball
    if (this.balls.length > 1) {
      ball.dispose();
      this.balls.splice(index, 1);
    }
  }

  handleBrickCollision(ball, collision) {
    const { brick, destroyed, dropPowerUp, penetrate, position, type } = collision;

    // Award points
    if (destroyed) {
      const points = brick.getPoints();
      this.gameState.addScore(points);

      // Check level complete
      if (this.levelManager.isLevelComplete()) {
        this.gameState.completeLevel();
      }
    }

    // Spawn power-up if applicable
    if (dropPowerUp && position) {
      this.spawnPowerUp(position);
    }

    // Screen shake for impact
    if (destroyed && (type === 2 || type === 3)) { // Reinforced or special
      if (this.game && this.game.camera) this.game.camera.shake(0.2, 0.2);
    }
  }

  spawnPowerUp(position) {
    const types = Object.keys(CONFIG.POWERUP.TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];

    const powerUp = new PowerUp(
      this.effects.scene,
      this.effects,
      this.audio,
      randomType,
      position.x,
      position.y,
      position.z
    );
    // Power-ups are managed by the Game class
    if (this.game && this.game.powerUps) {
      this.game.powerUps.push(powerUp);
    }
    this.audio.playPowerUpSpawn();
    this.effects.spawnPowerUpEffect(position, CONFIG.POWERUP.TYPES[randomType].color);
  }

  checkBallBallCollisions() {
    // Simple ball-ball collision for multi-ball
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const ball1 = this.balls[i];
        const ball2 = this.balls[j];

        if (!ball1.isLaunched || !ball2.isLaunched) continue;

        const dx = ball1.position.x - ball2.position.x;
        const dy = ball1.position.y - ball2.position.y;
        const dz = ball1.position.z - ball2.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const minDist = ball1.radius + ball2.radius;

        if (dist < minDist && dist > 0) {
          // Separate balls
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          const overlap = minDist - dist;
          ball1.position.x += nx * overlap * 0.5;
          ball1.position.y += ny * overlap * 0.5;
          ball1.position.z += nz * overlap * 0.5;
          ball2.position.x -= nx * overlap * 0.5;
          ball2.position.y -= ny * overlap * 0.5;
          ball2.position.z -= nz * overlap * 0.5;

          // Swap velocities (simple elastic collision for equal mass)
          const v1x = ball1.velocity.x;
          const v1y = ball1.velocity.y;
          const v1z = ball1.velocity.z;

          ball1.velocity.x = ball2.velocity.x;
          ball1.velocity.y = ball2.velocity.y;
          ball1.velocity.z = ball2.velocity.z;

          ball2.velocity.x = v1x;
          ball2.velocity.y = v1y;
          ball2.velocity.z = v1z;

          ball1.mesh.position.copy(ball1.position);
          ball2.mesh.position.copy(ball2.position);
        }
      }
    }
  }

  // Check power-up collection
  checkPowerUpCollisions(powerUps) {
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const powerUp = powerUps[i];
      if (!powerUp.active || powerUp.collected) continue;

      // Check against paddle
      const dx = Math.abs(powerUp.position.x - this.paddle.mesh.position.x);
      const dy = Math.abs(powerUp.position.y - this.paddle.mesh.position.y);

      if (dx <= this.paddle.width / 2 + CONFIG.POWERUP.SIZE &&
          dy <= this.paddle.height / 2 + CONFIG.POWERUP.SIZE) {
        powerUp.collect();
        this.applyPowerUp(powerUp.type);
        powerUps.splice(i, 1);
      }
    }
  }

  applyPowerUp(type) {
    const config = CONFIG.POWERUP.TYPES[type];
    const duration = CONFIG.POWERUP.DURATION;

    switch (type) {
      case 'MULTI_BALL':
        this.spawnExtraBalls(2);
        break;
      case 'WIDE_PADDLE':
        this.paddle.setWide(true);
        this.gameState.activatePowerUp('WIDE_PADDLE', duration);
        break;
      case 'SLOW_BALL':
        this.balls.forEach(b => b.setSlow(true));
        this.gameState.activatePowerUp('SLOW_BALL', duration);
        setTimeout(() => this.balls.forEach(b => b.setSlow(false)), duration);
        break;
      case 'FIRE_BALL':
        this.balls.forEach(b => b.setFireball(true));
        this.gameState.activatePowerUp('FIRE_BALL', duration);
        setTimeout(() => this.balls.forEach(b => b.setFireball(false)), duration);
        break;
      case 'SHIELD':
        this.paddle.setShield(true);
        this.gameState.activatePowerUp('SHIELD', duration);
        break;
      case 'MAGNET':
        this.balls.forEach(b => b.setMagnetized(true));
        this.gameState.activatePowerUp('MAGNET', duration);
        setTimeout(() => this.balls.forEach(b => b.setMagnetized(false)), duration);
        break;
      case 'SCORE_MULTIPLIER':
        this.gameState.multiplier = Math.min(4, this.gameState.multiplier + 1);
        this.gameState.multiplierTimer = duration;
        this.gameState.activatePowerUp('SCORE_MULTIPLIER', duration);
        this.showMultiplierPopup();
        break;
    }
  }

  spawnExtraBalls(count) {
    // This will be handled by the main game loop
    this.gameState.pendingMultiBall = (this.gameState.pendingMultiBall || 0) + count;
  }

  showMultiplierPopup() {
    const display = document.getElementById('multiplier-display');
    if (display) {
      display.textContent = `×${this.gameState.multiplier}`;
      display.classList.add('visible');
      setTimeout(() => display.classList.remove('visible'), 1000);
    }
  }
}