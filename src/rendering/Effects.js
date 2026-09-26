// Visual effects system - particles, trails, glows
import * as THREE from 'three';
import { CONFIG, DERIVED } from '../config.js';

export class EffectsManager {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.particlePool = [];
    this.trails = new Map(); // ballId -> trail points
    this.maxParticles = 500;
    this.maxTrailLength = CONFIG.BALL.TRAIL_LENGTH;

    // Create particle geometry and material
    this.particleGeometry = new THREE.BufferGeometry();
    const particleCount = this.maxParticles;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const alphas = new Float32Array(particleCount);

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particleSystem.frustumCulled = false;
    this.scene.addToEffects(this.particleSystem);

    // Trail geometry
    this.trailGeometry = new THREE.BufferGeometry();
    this.trailMaterial = new THREE.LineBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  // Spawn particles at position
  spawnParticles(position, color, count = 12, size = 0.15, lifetime = 0.8, velocitySpread = 8) {
    const positions = this.particleGeometry.attributes.position.array;
    const colors = this.particleGeometry.attributes.color.array;
    const sizes = this.particleGeometry.attributes.size.array;
    const alphas = this.particleGeometry.attributes.alpha.array;

    const threeColor = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      // Find inactive particle
      let index = this.particles.findIndex(p => !p.active);
      if (index === -1 && this.particles.length < this.maxParticles) {
        index = this.particles.length;
        this.particles.push({});
      } else if (index === -1) {
        // Recycle oldest
        index = this.particles.findIndex(p => p.life < 0.1);
        if (index === -1) index = 0;
      }

      const particle = this.particles[index];
      particle.active = true;
      particle.position = position.clone();
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * velocitySpread,
        (Math.random() - 0.5) * velocitySpread,
        (Math.random() - 0.5) * velocitySpread
      );
      particle.velocity.y += 2; // Upward bias
      particle.color = threeColor.clone();
      particle.size = size * (0.5 + Math.random() * 0.5);
      particle.life = lifetime;
      particle.maxLife = lifetime;
      particle.gravity = -15;
      particle.drag = 0.98;

      // Update buffer
      const i3 = index * 3;
      positions[i3] = particle.position.x;
      positions[i3 + 1] = particle.position.y;
      positions[i3 + 2] = particle.position.z;
      colors[i3] = particle.color.r;
      colors[i3 + 1] = particle.color.g;
      colors[i3 + 2] = particle.color.b;
      sizes[index] = particle.size;
      alphas[index] = 1;
    }

    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;
    this.particleGeometry.attributes.size.needsUpdate = true;
    this.particleGeometry.attributes.alpha.needsUpdate = true;
  }

  // Spawn brick destruction effect
  spawnBrickExplosion(position, brickType, color) {
    const typeConfig = {
      standard: { count: 15, size: 0.18, speed: 10, life: 0.7 },
      reinforced: { count: 20, size: 0.22, speed: 12, life: 0.9 },
      special: { count: 25, size: 0.25, speed: 15, life: 1.0 }
    };
    const config = typeConfig[brickType] || typeConfig.standard;
    this.spawnParticles(position, color, config.count, config.size, config.life, config.speed);

    // Add ring expansion effect
    this.spawnRing(position, color, 1.5, 0.3);
  }

  // Spawn expanding ring
  spawnRing(position, color, maxRadius, duration) {
    const ringGeometry = new THREE.RingGeometry(0.1, 0.15, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.rotation.x = -Math.PI / 2;
    ring.userData = { maxRadius, duration, elapsed: 0, startScale: 0.1 };
    this.scene.addToEffects(ring);

    // Animate and remove
    const animate = (deltaTime) => {
      ring.userData.elapsed += deltaTime;
      const progress = ring.userData.elapsed / ring.userData.duration;
      if (progress >= 1) {
        this.scene.removeFromEffects(ring);
        ringGeometry.dispose();
        ringMaterial.dispose();
        return;
      }
      const scale = ring.userData.startScale + progress * (maxRadius - ring.userData.startScale);
      ring.scale.setScalar(scale);
      ringMaterial.opacity = 0.8 * (1 - progress);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  // Update trail for a ball
  updateTrail(ballId, position) {
    if (!this.trails.has(ballId)) {
      this.trails.set(ballId, []);
    }
    const trail = this.trails.get(ballId);
    trail.push(position.clone());

    // Limit trail length
    if (trail.length > this.maxTrailLength) {
      trail.shift();
    }
  }

  // Get trail points for rendering
  getTrailPoints(ballId) {
    return this.trails.get(ballId) || [];
  }

  // Clear trail
  clearTrail(ballId) {
    this.trails.delete(ballId);
  }

  // Update all effects
  update(deltaTime) {
    this.updateParticles(deltaTime);
  }

  updateParticles(deltaTime) {
    const positions = this.particleGeometry.attributes.position.array;
    const sizes = this.particleGeometry.attributes.size.array;
    const alphas = this.particleGeometry.attributes.alpha.array;

    let anyActive = false;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle.active) continue;

      anyActive = true;

      // Physics
      particle.velocity.y += particle.gravity * deltaTime;
      particle.velocity.multiplyScalar(particle.drag);
      particle.position.addScaledVector(particle.velocity, deltaTime);
      particle.life -= deltaTime;

      // Update buffer
      const i3 = i * 3;
      positions[i3] = particle.position.x;
      positions[i3 + 1] = particle.position.y;
      positions[i3 + 2] = particle.position.z;

      const lifeRatio = particle.life / particle.maxLife;
      alphas[i] = Math.max(0, lifeRatio);
      sizes[i] = particle.size * lifeRatio;

      if (particle.life <= 0) {
        particle.active = false;
        alphas[i] = 0;
      }
    }

    if (anyActive) {
      this.particleGeometry.attributes.position.needsUpdate = true;
      this.particleGeometry.attributes.alpha.needsUpdate = true;
      this.particleGeometry.attributes.size.needsUpdate = true;
    }
  }

  // Create paddle hit effect
  spawnPaddleHit(position, paddleWidth) {
    // Line effect along paddle
    const count = 8;
    for (let i = 0; i < count; i++) {
      const x = position.x + (Math.random() - 0.5) * paddleWidth * 0.8;
      this.spawnParticles(
        new THREE.Vector3(x, position.y + 0.3, position.z),
        0x00ffff,
        3,
        0.12,
        0.4,
        6
      );
    }
  }

  // Create power-up spawn effect
  spawnPowerUpEffect(position, color) {
    this.spawnParticles(position, color, 10, 0.2, 0.6, 5);
    this.spawnRing(position, color, 2, 0.5);
  }

  // Create power-up collect effect
  spawnCollectEffect(position, color) {
    this.spawnParticles(position, color, 15, 0.18, 0.5, 10);
    this.spawnRing(position, color, 1.5, 0.3);
  }

  // Create level complete effect
  spawnLevelCompleteEffect(arenaWidth, arenaHeight) {
    // Burst from center
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.spawnParticles(
          new THREE.Vector3(0, 0, 0),
          [0x00f3ff, 0x00ff88, 0xffaa00, 0xff00f3, 0xffff00][i],
          30,
          0.25,
          1.5,
          20
        );
        this.spawnRing(new THREE.Vector3(0, 0, 0), [0x00f3ff, 0x00ff88, 0xffaa00, 0xff00f3, 0xffff00][i], 15, 1);
      }, i * 100);
    }
  }

  // Create game over effect
  spawnGameOverEffect() {
    this.spawnParticles(
      new THREE.Vector3(0, 0, 0),
      0xff0066,
      40,
      0.3,
      2,
      25
    );
  }

  dispose() {
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.trailGeometry.dispose();
    this.trailMaterial.dispose();
    this.particles = [];
    this.trails.clear();
  }
}

// Glow effect for objects
export function createGlowMaterial(baseColor, emissiveColor, intensity = 1) {
  return new THREE.MeshPhysicalMaterial({
    color: baseColor,
    emissive: emissiveColor,
    emissiveIntensity: intensity,
    metalness: 0.3,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transmission: 0.1,
    thickness: 0.5
  });
}

export function createNeonMaterial(color, glowIntensity = 1.5) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

export function createStandardMaterial(color, emissiveColor) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: emissiveColor,
    emissiveIntensity: 0.5,
    metalness: 0.4,
    roughness: 0.3
  });
}