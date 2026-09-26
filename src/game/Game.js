// Main game class
import * as THREE from 'three';
import { CONFIG, DERIVED } from '../config.js';
import { GameState } from './GameState.js';
import { InputManager } from '../input/InputManager.js';
import { GameScene, GameCamera, GameLighting } from '../rendering/Scene.js';
import { EffectsManager } from '../rendering/Effects.js';
import { Ball } from '../entities/Ball.js';
import { Paddle } from '../entities/Paddle.js';
import { Arena } from '../entities/Arena.js';
import { LevelManager } from './LevelManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { audioManager } from '../audio/AudioManager.js';
import { UIManager } from '../ui/UIManager.js';

export class Game {
  constructor() {
    this.gameState = new GameState();
    this.input = new InputManager();
    this.scene = new GameScene();
    this.camera = new GameCamera(this.scene.scene);
    this.scene.setCamera(this.camera.getCamera());
    this.lighting = new GameLighting(this.scene.scene);
    this.effects = new EffectsManager(this.scene);
    this.ui = new UIManager(this);

    // Entities
    this.arena = new Arena(this.scene);
    this.paddle = new Paddle(this.scene, this.effects, audioManager);
    this.balls = [];
    this.levelManager = new LevelManager(this.scene, this.effects, audioManager);
    this.collisionSystem = new CollisionSystem(
      this.arena, this.paddle, this.balls, this.levelManager,
      this.effects, audioManager, this.gameState, this
    );

    // Power-ups
    this.powerUps = [];

    // Timing
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedTimeStep = CONFIG.PHYSICS.FIXED_TIMESTEP;
    this.maxSubSteps = CONFIG.PHYSICS.MAX_SUBSTEPS;

    // Game state
    this.isRunning = false;
    this.animationId = null;

    // Bind UI callbacks
    this.bindUI();
  }

  bindUI() {
    // Title screen
    document.getElementById('btn-play').addEventListener('click', () => this.startGame());
    document.getElementById('btn-options').addEventListener('click', () => this.ui.showScreen('options'));

    // Pause screen
    document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
    document.getElementById('btn-restart').addEventListener('click', () => this.restartLevel());
    document.getElementById('btn-main-menu').addEventListener('click', () => this.returnToMenu());

    // Level complete
    document.getElementById('btn-next-level').addEventListener('click', () => this.nextLevel());

    // Game over
    document.getElementById('btn-retry').addEventListener('click', () => this.startGame());
    document.getElementById('btn-main-menu-go').addEventListener('click', () => this.returnToMenu());

    // Options
    document.getElementById('btn-back').addEventListener('click', () => this.ui.showScreen('title'));
    document.getElementById('sound-toggle').addEventListener('change', (e) => audioManager.toggleSfx(e.target.checked));
    document.getElementById('music-toggle').addEventListener('change', (e) => audioManager.toggleMusic(e.target.checked));
    document.getElementById('particles-toggle').addEventListener('change', (e) => { this.effects.particleSystem.visible = e.target.checked; });
    document.getElementById('trails-toggle').addEventListener('change', (e) => this.balls.forEach(b => b.trailEnabled = e.target.checked));

    // Keyboard pause
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (this.gameState.gameStatus === 'PLAYING') {
          this.pauseGame();
        } else if (this.gameState.gameStatus === 'PAUSED') {
          this.resumeGame();
        }
      }
    });
  }

  init() {
    // Show title screen first
    this.ui.showScreen('title');

    // Create initial ball
    this.createBall();

    // Initial camera setup
    this.camera.setPosition(0, 12, 18);

    // Start render loop
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  createBall() {
    const ball = new Ball(this.scene, this.effects, audioManager, this.balls.length);
    this.balls.push(ball);
    this.collisionSystem.balls = this.balls; // Update reference
    return ball;
  }

  startGame() {
    audioManager.resume();
    audioManager.playMusic();
    this.gameState.startGame();
    this.ui.showScreen('game');
    this.loadCurrentLevel();
    this.resetBall();
    // Focus canvas for keyboard input
    const canvas = document.getElementById('game-canvas');
    if (canvas) canvas.focus();
  }

  loadCurrentLevel() {
    const levelData = this.levelManager.loadLevel(this.gameState.currentLevel);
    this.lighting.setLevelMood(this.gameState.currentLevel);
    this.ui.updateLevelDisplay(this.gameState.currentLevel + 1, levelData.name);
  }

  resetBall() {
    this.balls.forEach(b => b.dispose());
    this.balls = [];
    this.createBall();
    this.collisionSystem.balls = this.balls;
    this.gameState.ballsLaunched = 0;
    this.ui.showLaunchHint();
  }

  nextLevel() {
    this.gameState.nextLevel();
    this.loadCurrentLevel();
    this.resetBall();
    this.powerUps.forEach(p => p.dispose());
    this.powerUps = [];
    this.ui.showScreen('game');
  }

  restartLevel() {
    this.gameState.startLevel();
    this.loadCurrentLevel();
    this.resetBall();
    this.powerUps.forEach(p => p.dispose());
    this.powerUps = [];
    this.ui.showScreen('game');
  }

  pauseGame() {
    if (this.gameState.gameStatus !== 'PLAYING') return;
    this.gameState.gameStatus = 'PAUSED';
    this.ui.showScreen('pause');
  }

  resumeGame() {
    if (this.gameState.gameStatus !== 'PAUSED') return;
    this.gameState.gameStatus = 'PLAYING';
    this.ui.showScreen('game');
    this.lastTime = performance.now(); // Reset time to avoid big delta
  }

  returnToMenu() {
    this.gameState.reset();
    this.balls.forEach(b => b.dispose());
    this.balls = [];
    this.createBall();
    this.collisionSystem.balls = this.balls;
    this.powerUps.forEach(p => p.dispose());
    this.powerUps = [];
    this.levelManager.clearLevel();
    this.ui.showScreen('title');
    this.ui.updateHUD(this.gameState);
  }

  handleLaunch() {
    if (this.gameState.gameStatus === 'LAUNCHING') {
      this.gameState.gameStatus = 'PLAYING';
      this.gameState.ballsLaunched++;
      this.balls[0].launch();
      this.ui.hideLaunchHint();
    }
  }

  handleMultiBall() {
    if (this.gameState.pendingMultiBall > 0) {
      const count = this.gameState.pendingMultiBall;
      this.gameState.pendingMultiBall = 0;

      for (let i = 0; i < count; i++) {
        const newBall = this.createBall();
        // Launch in slightly different directions (0 = straight up)
        const angle = (Math.random() - 0.5) * 0.5;
        newBall.launch(angle);
        newBall.speed = this.balls[0].speed;
      }
      this.ui.hideLaunchHint();
      this.gameState.gameStatus = 'PLAYING';
    }
  }

  update(deltaTime) {
    // Update game state
    this.gameState.updateMultiplier(deltaTime * 1000);
    this.gameState.updatePowerUps();

    // Handle multi-ball spawn
    this.handleMultiBall();

    // Input
    const paddleInput = this.input.getPaddleTarget() + this.input.getKeyboardInput();
    this.paddle.update(deltaTime, paddleInput);

    // Launch ball
    if (this.input.consumeLaunchRequest()) {
      this.handleLaunch();
    }

    // Pause
    if (this.input.consumePauseRequest()) {
      if (this.gameState.gameStatus === 'PLAYING') this.pauseGame();
      else if (this.gameState.gameStatus === 'PAUSED') this.resumeGame();
    }

    // Update balls
    this.balls.forEach(ball => ball.update(deltaTime, this.paddle));

    // Update power-ups
    this.powerUps.forEach(powerUp => powerUp.update(deltaTime));
    this.powerUps = this.powerUps.filter(p => p.active);

    // Check power-up collisions
    this.collisionSystem.checkPowerUpCollisions(this.powerUps);

    // Collision system
    this.collisionSystem.update(deltaTime);

    // Level manager
    this.levelManager.update(deltaTime);

    // Arena
    this.arena.update(deltaTime, performance.now() * 0.001);

    // Lighting
    this.lighting.update(deltaTime, this.paddle, this.balls[0]);

    // Effects
    this.effects.update(deltaTime);

    // Camera
    this.camera.update(deltaTime);

    // UI
    this.ui.updateHUD(this.gameState);
    this.ui.updatePowerUpDisplay(this.gameState);
  }

  animate(currentTime = performance.now()) {
    if (!this.isRunning) return;

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = currentTime;

    // Fixed timestep physics
    this.accumulator += deltaTime;
    while (this.accumulator >= this.fixedTimeStep) {
      this.update(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    // Render
    this.scene.render();

    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }

  dispose() {
    this.isRunning = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);

    this.balls.forEach(b => b.dispose());
    this.paddle.dispose();
    this.arena.dispose();
    this.levelManager.clearLevel();
    this.powerUps.forEach(p => p.dispose());
    this.effects.dispose();
    this.scene.dispose();
    audioManager.dispose();
  }
}