// Brick entity
import * as THREE from 'three';
import { CONFIG, getBrickType } from '../config.js';
import { createGlowMaterial, createStandardMaterial, createNeonMaterial } from '../rendering/Effects.js';

export class Brick {
  constructor(scene, effects, audio, typeId, x, y, z) {
    this.scene = scene;
    this.effects = effects;
    this.audio = audio;
    this.typeId = typeId;
    this.type = getBrickType(typeId);
    this.active = true;
    this.hitsRemaining = this.type.hits;
    this.maxHits = this.type.hits;
    this.halfWidth = CONFIG.BRICK.WIDTH / 2;
    this.halfHeight = CONFIG.BRICK.HEIGHT / 2;
    this.halfDepth = CONFIG.BRICK.DEPTH / 2;
    this.isDestroyed = false;
    this.destructionProgress = 0;
    this.spawnTime = performance.now();
    this.spawnDelay = 0;

    this.createMesh(x, y, z);
  }

  createMesh(x, y, z) {
    const geometry = new THREE.BoxGeometry(CONFIG.BRICK.WIDTH, CONFIG.BRICK.HEIGHT, CONFIG.BRICK.DEPTH, 2, 2, 1);

    // Create material based on type
    if (this.typeId === 4) { // Indestructible
      this.material = createStandardMaterial(this.type.color, this.type.emissive);
      this.material.roughness = 0.6;
      this.material.metalness = 0.2;
    } else {
      this.material = createGlowMaterial(this.type.color, this.type.emissive, 1.5);
    }

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(x, y, z);
    this.mesh.userData.brick = this;

    // Edge glow for destructible bricks
    if (this.typeId !== 4) {
      const edgeGeometry = new THREE.EdgesGeometry(geometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: this.type.color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      this.edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      this.mesh.add(this.edges);
    }

    // Special brick indicator
    if (this.typeId === 3) { // Special
      this.createSpecialIndicator();
    }

    this.scene.addToEntities(this.mesh);

    // Initial spawn animation
    this.mesh.scale.set(0, 0, 0);
  }

  createSpecialIndicator() {
    // Pulsing core
    const coreGeometry = new THREE.OctahedronGeometry(0.3, 0);
    const coreMaterial = createNeonMaterial(this.type.color, 2);
    this.core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.mesh.add(this.core);
  }

  // Spawn animation
  spawn(delay) {
    this.spawnDelay = delay;
    const startTime = performance.now() + delay;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }
      const progress = Math.min(1, elapsed / 400);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      this.mesh.scale.setScalar(eased);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  update(deltaTime) {
    if (!this.active) return;

    // Special brick animation
    if (this.typeId === 3 && this.core) {
      this.core.rotation.x += deltaTime * 2;
      this.core.rotation.y += deltaTime * 1.5;
      this.core.scale.setScalar(0.8 + Math.sin(performance.now() * 0.005) * 0.2);
    }

    // Destruction animation
    if (this.isDestroyed) {
      this.destructionProgress += deltaTime * 3;
      if (this.destructionProgress >= 1) {
        this.dispose();
      } else {
        this.mesh.scale.setScalar(1 - this.destructionProgress);
        this.material.opacity = 1 - this.destructionProgress;
        this.material.transparent = true;
        if (this.edges) {
          this.edges.material.opacity = 1 - this.destructionProgress;
        }
      }
    }
  }

  hit() {
    if (!this.active || this.typeId === 4) return false; // Indestructible

    this.hitsRemaining--;
    this.audio.playBounce(false);

    if (this.hitsRemaining <= 0) {
      this.destroy();
      return true; // Destroyed
    } else {
      // Damaged state visual
      this.showDamage();
      return false; // Damaged but not destroyed
    }
  }

  showDamage() {
    const damageRatio = 1 - this.hitsRemaining / this.maxHits;
    // Darken material
    this.material.color.lerp(new THREE.Color(0x333333), damageRatio * 0.5);
    this.material.emissiveIntensity = 1.5 - damageRatio;
    if (this.edges) {
      this.edges.material.color.lerp(new THREE.Color(0x666666), damageRatio * 0.5);
    }
    // Flash
    this.material.emissiveIntensity = 3;
    setTimeout(() => {
      if (this.active) this.material.emissiveIntensity = 1.5 - damageRatio;
    }, 50);
  }

  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.active = false;
    this.destructionProgress = 0;

    // Play destruction sound
    const typeNames = ['standard', 'reinforced', 'special', 'indestructible'];
    this.audio.playBrickDestroy(typeNames[this.typeId - 1] || 'standard');

    // Spawn particles
    this.effects.spawnBrickExplosion(
      this.mesh.position.clone(),
      typeNames[this.typeId - 1] || 'standard',
      this.type.color
    );

    // Screen shake
    // This will be handled by the game system
  }

  // Check if this brick should drop a power-up
  shouldDropPowerUp() {
    return this.type.dropsPowerUp && Math.random() < CONFIG.POWERUP.DROP_CHANCE;
  }

  getPoints() {
    return this.type.points;
  }

  dispose() {
    this.scene.removeFromEntities(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
    if (this.edges) {
      this.edges.geometry.dispose();
      this.edges.material.dispose();
    }
    if (this.core) {
      this.core.geometry.dispose();
      this.core.material.dispose();
    }
  }
}