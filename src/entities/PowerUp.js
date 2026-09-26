// Power-up entity
import * as THREE from 'three';
import { CONFIG, DERIVED } from '../config.js';
import { createGlowMaterial, createNeonMaterial } from '../rendering/Effects.js';

export class PowerUp {
  constructor(scene, effects, audio, type, x, y, z) {
    this.scene = scene;
    this.effects = effects;
    this.audio = audio;
    this.type = type;
    this.config = CONFIG.POWERUP.TYPES[type];
    this.position = new THREE.Vector3(x, y, z);
    this.active = true;
    this.collected = false;
    this.fallSpeed = CONFIG.POWERUP.FALL_SPEED;
    this.rotationSpeed = 2;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.spawnTime = performance.now();

    this.createMesh();
  }

  createMesh() {
    // Main geometry - octahedron for power-ups
    const geometry = new THREE.OctahedronGeometry(CONFIG.POWERUP.SIZE * 0.6, 0);

    this.material = createGlowMaterial(this.config.color, this.config.color, 2);

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.copy(this.position);

    // Glow aura
    const auraGeometry = new THREE.OctahedronGeometry(CONFIG.POWERUP.SIZE, 0);
    this.auraMaterial = createNeonMaterial(this.config.color, 1.5);
    this.auraMaterial.opacity = 0.4;
    this.aura = new THREE.Mesh(auraGeometry, this.auraMaterial);
    this.mesh.add(this.aura);

    // Symbol text (using a simple plane with the symbol)
    this.createSymbol();

    // Particle trail
    this.trailParticles = [];
    this.createTrail();

    this.scene.addToEntities(this.mesh);

    // Spawn animation
    this.mesh.scale.set(0, 0, 0);
  }

  createSymbol() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 48px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.config.symbol, 32, 36);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const symbolGeometry = new THREE.PlaneGeometry(0.6, 0.6);
    const symbolMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.symbolMesh = new THREE.Mesh(symbolGeometry, symbolMaterial);
    this.symbolMesh.position.z = CONFIG.POWERUP.SIZE * 0.7;
    this.mesh.add(this.symbolMesh);
    this.symbolTexture = texture;
  }

  createTrail() {
    // Small trailing particles
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.SphereGeometry(0.08 * (1 - i * 0.15), 6, 6);
      const material = createNeonMaterial(this.config.color, 1);
      material.opacity = 0.5 * (1 - i * 0.15);
      const particle = new THREE.Mesh(geometry, material);
      particle.position.set(0, -0.3 - i * 0.15, 0);
      this.mesh.add(particle);
      this.trailParticles.push(particle);
    }
  }

  update(deltaTime) {
    if (!this.active || this.collected) return;

    // Fall down
    this.position.y -= this.fallSpeed * deltaTime;
    this.mesh.position.copy(this.position);

    // Rotation
    this.mesh.rotation.x += deltaTime * this.rotationSpeed;
    this.mesh.rotation.y += deltaTime * this.rotationSpeed * 0.7;

    // Bobbing motion
    this.bobOffset += deltaTime * 3;
    this.mesh.position.y += Math.sin(this.bobOffset) * 0.02;

    // Aura pulse
    this.aura.scale.setScalar(1 + Math.sin(performance.now() * 0.008) * 0.15);
    this.auraMaterial.opacity = 0.3 + Math.sin(performance.now() * 0.006) * 0.1;

    // Trail particles follow
    this.trailParticles.forEach((p, i) => {
      p.rotation.x += deltaTime;
      p.scale.setScalar(0.8 + Math.sin(performance.now() * 0.01 + i) * 0.2);
    });

    // Check if fallen past bottom
    if (this.position.y < -DERIVED.ARENA_HALF_HEIGHT - 1) {
      this.deactivate();
    }
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    this.active = false;

    this.audio.playPowerUpCollect();
    this.effects.spawnCollectEffect(this.position.clone(), this.config.color);

    // Collect animation
    this.animateCollect();
  }

  animateCollect() {
    const startScale = this.mesh.scale.x;
    const startTime = performance.now();
    const duration = 300;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const scale = startScale * (1 + progress * 2);
      const opacity = 1 - progress;

      this.mesh.scale.setScalar(scale);
      this.material.opacity = opacity;
      this.auraMaterial.opacity = opacity * 0.4;
      if (this.symbolMesh) this.symbolMesh.material.opacity = opacity;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.dispose();
      }
    };
    requestAnimationFrame(animate);
  }

  deactivate() {
    this.active = false;
    this.dispose();
  }

  dispose() {
    this.scene.removeFromEntities(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.aura.geometry.dispose();
    this.auraMaterial.dispose();
    if (this.symbolMesh) {
      this.symbolMesh.geometry.dispose();
      this.symbolMesh.material.dispose();
      this.symbolTexture.dispose();
    }
    this.trailParticles.forEach(p => {
      p.geometry.dispose();
      p.material.dispose();
    });
  }
}