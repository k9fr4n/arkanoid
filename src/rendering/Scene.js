// Three.js scene setup
import * as THREE from 'three';
import { CONFIG, DERIVED } from '../config.js';

export class GameScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.composer = null;
    this.setupRenderer();
    this.setupScene();
  }

  setupRenderer() {
    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false; // We'll use custom glow instead
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Handle resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupScene() {
    // Background
    this.scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND);
    this.scene.fog = new THREE.FogExp2(CONFIG.COLORS.BACKGROUND, 0.08);

    // Arena group
    this.arena = new THREE.Group();
    this.arena.name = 'arena';
    this.scene.add(this.arena);

    // Effects group
    this.effects = new THREE.Group();
    this.effects.name = 'effects';
    this.scene.add(this.effects);

    // Entities group
    this.entities = new THREE.Group();
    this.entities.name = 'entities';
    this.scene.add(this.entities);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  render() {
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  addToArena(object) {
    this.arena.add(object);
  }

  addToEntities(object) {
    this.entities.add(object);
  }

  addToEffects(object) {
    this.effects.add(object);
  }

  removeFromArena(object) {
    this.arena.remove(object);
  }

  removeFromEntities(object) {
    this.entities.remove(object);
  }

  removeFromEffects(object) {
    this.effects.remove(object);
  }

  dispose() {
    this.renderer.dispose();
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}

export class GameCamera {
  constructor(scene) {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    // Position camera above and behind the arena
    this.basePosition = new THREE.Vector3(0, 12, 18);
    this.targetPosition = new THREE.Vector3(0, 0, 0);
    this.camera.position.copy(this.basePosition);
    this.camera.lookAt(this.targetPosition);

    // Camera shake
    this.shakeIntensity = 0;
    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeOffset = new THREE.Vector3();
  }

  update(deltaTime) {
    // Smooth camera follow
    this.camera.position.lerp(this.basePosition, 0.1);
    this.camera.lookAt(this.targetPosition);

    // Camera shake
    if (this.shakeTime > 0) {
      this.shakeTime -= deltaTime;
      const progress = 1 - this.shakeTime / this.shakeDuration;
      const intensity = this.shakeIntensity * (1 - progress) * Math.exp(-progress * 3);

      this.shakeOffset.set(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      );

      this.camera.position.add(this.shakeOffset);
    } else {
      this.shakeOffset.set(0, 0, 0);
    }
  }

  shake(intensity = 0.15, duration = 0.15) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = duration;
  }

  setPosition(x, y, z) {
    this.basePosition.set(x, y, z);
  }

  getCamera() {
    return this.camera;
  }
}

export class GameLighting {
  constructor(scene) {
    this.scene = scene;
    this.setupLights();
    this.time = 0;
  }

  setupLights() {
    // Ambient light
    this.ambient = new THREE.AmbientLight(0x223344, 0.4);
    this.scene.add(this.ambient);

    // Main directional light (top-down)
    this.mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.mainLight.position.set(0, 20, 10);
    this.mainLight.target.position.set(0, 0, 0);
    this.scene.add(this.mainLight);
    this.scene.add(this.mainLight.target);

    // Rim lights for neon glow effect
    this.rimLight1 = new THREE.DirectionalLight(0x00f3ff, 0.8);
    this.rimLight1.position.set(-15, 10, -15);
    this.scene.add(this.rimLight1);

    this.rimLight2 = new THREE.DirectionalLight(0xff00f3, 0.6);
    this.rimLight2.position.set(15, 10, -15);
    this.scene.add(this.rimLight2);

    // Point lights for dynamic highlights
    this.pointLights = [];
    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight(0x00f3ff, 0, 15, 2);
      light.position.set(
        (i % 2 === 0 ? -1 : 1) * 8,
        5,
        (i < 2 ? -1 : 1) * 8
      );
      light.visible = false;
      this.scene.add(light);
      this.pointLights.push(light);
    }

    // Paddle highlight light
    this.paddleLight = new THREE.PointLight(0x00ffff, 0, 8, 2);
    this.paddleLight.position.set(0, -6, 2);
    this.scene.add(this.paddleLight);

    // Ball light
    this.ballLight = new THREE.PointLight(0x00f3ff, 1, 10, 2);
    this.ballLight.position.set(0, 0, 0);
    this.scene.add(this.ballLight);
  }

  update(deltaTime, paddle, ball) {
    this.time += deltaTime;

    // Animate rim lights
    this.rimLight1.intensity = 0.6 + Math.sin(this.time * 1.5) * 0.2;
    this.rimLight2.intensity = 0.4 + Math.cos(this.time * 1.3) * 0.2;

    // Update paddle light
    if (paddle && paddle.mesh) {
      this.paddleLight.position.x = paddle.mesh.position.x;
      this.paddleLight.position.y = paddle.mesh.position.y + 0.5;
      this.paddleLight.intensity = paddle.isGlowing ? 2 : 0.5;
    }

    // Update ball light
    if (ball && ball.mesh) {
      this.ballLight.position.copy(ball.mesh.position);
      this.ballLight.intensity = ball.isFireball ? 3 : 1.5;
      this.ballLight.color.setHex(ball.isFireball ? 0xff3300 : 0x00f3ff);
    }

    // Animate point lights subtly
    this.pointLights.forEach((light, i) => {
      if (light.visible) {
        light.intensity = 0.5 + Math.sin(this.time * 2 + i) * 0.3;
      }
    });
  }

  triggerPaddleHit() {
    this.paddleLight.intensity = 3;
    setTimeout(() => { this.paddleLight.intensity = 0.5; }, 100);
  }

  triggerBrickHit(position, color) {
    const light = this.pointLights.find(l => !l.visible);
    if (light) {
      light.position.copy(position);
      light.color.setHex(color);
      light.visible = true;
      light.intensity = 2;

      setTimeout(() => {
        light.visible = false;
        light.intensity = 0;
      }, 200);
    }
  }

  setLevelMood(levelIndex) {
    const hues = [0x00f3ff, 0x00ff88, 0xffaa00, 0xff00f3, 0xff3366, 0xffff00];
    const hue = hues[levelIndex % hues.length];
    this.rimLight1.color.setHex(hue);
  }
}