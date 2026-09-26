// Ball entity
import * as THREE from 'three';
import { CONFIG, DERIVED, getBrickType } from '../config.js';
import { createGlowMaterial, createNeonMaterial } from '../rendering/Effects.js';

export class Ball {
  constructor(scene, effects, audio, id = 0) {
    this.scene = scene;
    this.effects = effects;
    this.audio = audio;
    this.id = id;
    this.radius = CONFIG.BALL.RADIUS;
    this.speed = CONFIG.BALL.INITIAL_SPEED;
    this.maxSpeed = CONFIG.BALL.MAX_SPEED;
    this.velocity = new THREE.Vector3();
    this.position = new THREE.Vector3();
    this.isLaunched = false;
    this.isFireball = false;
    this.isMagnetized = false;
    this.isSlow = false;
    this.magnetTarget = null;
    this.trailEnabled = true;
    this.lastPaddleHit = 0;

    this.createMesh();
    this.reset();
  }

  createMesh() {
    // Main ball geometry
    const geometry = new THREE.SphereGeometry(this.radius, 32, 32);

    // Core material
    this.coreMaterial = createGlowMaterial(
      CONFIG.COLORS.BALL,
      CONFIG.COLORS.BALL_EMISSIVE,
      2
    );

    this.mesh = new THREE.Mesh(geometry, this.coreMaterial);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;

    // Glow aura
    const auraGeometry = new THREE.SphereGeometry(this.radius * 1.5, 16, 16);
    this.auraMaterial = createNeonMaterial(CONFIG.COLORS.BALL_EMISSIVE, 1);
    this.auraMaterial.opacity = 0.3;
    this.aura = new THREE.Mesh(auraGeometry, this.auraMaterial);
    this.mesh.add(this.aura);

    // Fireball effect
    this.fireParticles = null;

    this.scene.addToEntities(this.mesh);
  }

  reset(paddlePosition = null) {
    this.isLaunched = false;
    this.isFireball = false;
    this.isMagnetized = false;
    this.isSlow = false;
    this.speed = CONFIG.BALL.INITIAL_SPEED;
    this.velocity.set(0, 0, 0);

    if (paddlePosition) {
      this.position.set(paddlePosition.x, paddlePosition.y + 0.8, paddlePosition.z);
    } else {
      this.position.set(0, -DERIVED.ARENA_HALF_HEIGHT + CONFIG.ARENA.WALL_THICKNESS + 1.5, 0);
    }

    this.mesh.position.copy(this.position);
    this.aura.scale.setScalar(1);
    this.auraMaterial.opacity = 0.3;
    this.coreMaterial.emissiveIntensity = 2;

    // Clear trail
    this.effects.clearTrail(this.id);

    // Remove fire effect if exists
    if (this.fireParticles) {
      this.scene.removeFromEffects(this.fireParticles);
      this.fireParticles = null;
    }
  }

  launch(direction = null) {
    if (this.isLaunched) return;

    this.isLaunched = true;
    const angle = direction !== null ? direction : CONFIG.BALL.LAUNCH_ANGLE;
    this.velocity.set(Math.sin(angle), Math.cos(angle), 0).normalize();
    this.audio.playLaunch();
  }

  update(deltaTime, paddle = null) {
    if (!this.isLaunched) {
      // Follow paddle if not launched
      if (paddle && paddle.mesh) {
        this.position.x = paddle.mesh.position.x;
        this.position.y = paddle.mesh.position.y + 0.8;
        this.mesh.position.copy(this.position);
      }
      return;
    }

    // Apply slow effect
    const speedMultiplier = this.isSlow ? 0.5 : 1;
    const effectiveSpeed = this.speed * speedMultiplier;

    // Magnet effect - pull toward paddle
    if (this.isMagnetized && paddle && paddle.mesh) {
      const toPaddle = new THREE.Vector3().subVectors(paddle.mesh.position, this.position);
      const dist = toPaddle.length();
      if (dist < 8) {
        toPaddle.normalize();
        this.velocity.lerp(toPaddle, 0.02);
        this.velocity.normalize();
      }
    }

    // Move ball
    this.position.addScaledVector(this.velocity, effectiveSpeed * deltaTime);
    this.mesh.position.copy(this.position);

    // Update aura pulse
    this.aura.scale.setScalar(1 + Math.sin(performance.now() * 0.005) * 0.1);
    this.auraMaterial.opacity = 0.2 + Math.sin(performance.now() * 0.008) * 0.1;

    // Update trail
    if (this.trailEnabled) {
      this.effects.updateTrail(this.id, this.position.clone());
    }

    // Fireball particles
    if (this.isFireball && this.fireParticles) {
      this.fireParticles.position.copy(this.position);
    }
  }

  setFireball(enabled) {
    this.isFireball = enabled;
    if (enabled) {
      this.coreMaterial.emissive.setHex(0xff3300);
      this.coreMaterial.emissiveIntensity = 3;
      this.auraMaterial.color.setHex(0xff3300);

      // Add fire trail particles
      if (!this.fireParticles) {
        const geometry = new THREE.SphereGeometry(this.radius * 0.8, 8, 8);
        const material = createNeonMaterial(0xff3300, 2);
        this.fireParticles = new THREE.Mesh(geometry, material);
        this.scene.addToEffects(this.fireParticles);
      }
    } else {
      this.coreMaterial.emissive.setHex(CONFIG.COLORS.BALL_EMISSIVE);
      this.coreMaterial.emissiveIntensity = 2;
      this.auraMaterial.color.setHex(CONFIG.COLORS.BALL_EMISSIVE);
      if (this.fireParticles) {
        this.scene.removeFromEffects(this.fireParticles);
        this.fireParticles.geometry.dispose();
        this.fireParticles.material.dispose();
        this.fireParticles = null;
      }
    }
  }

  setMagnetized(enabled) {
    this.isMagnetized = enabled;
  }

  setSlow(enabled) {
    this.isSlow = enabled;
  }

  // Collision response
  reflect(normal) {
    // Reflect velocity vector
    this.velocity.reflect(normal).normalize();

    // Prevent near-horizontal or near-vertical angles
    const angle = Math.atan2(this.velocity.y, this.velocity.x);
    const minAngle = CONFIG.BALL.MIN_ANGLE;
    const maxAngle = CONFIG.BALL.MAX_ANGLE;

    if (Math.abs(this.velocity.x) < Math.sin(minAngle)) {
      this.velocity.x = this.velocity.x >= 0 ? Math.sin(minAngle) : -Math.sin(minAngle);
      this.velocity.y = Math.sqrt(1 - this.velocity.x * this.velocity.x) * (this.velocity.y >= 0 ? 1 : -1);
    }

    if (Math.abs(this.velocity.y) < Math.sin(minAngle)) {
      this.velocity.y = this.velocity.y >= 0 ? Math.sin(minAngle) : -Math.sin(minAngle);
      this.velocity.x = Math.sqrt(1 - this.velocity.y * this.velocity.y) * (this.velocity.x >= 0 ? 1 : -1);
    }

    this.velocity.normalize();
  }

  // Paddle hit with angle modification based on hit position
  hitPaddle(paddle, hitPosition) {
    this.lastPaddleHit = performance.now();
    this.audio.playBounce(true);
    this.effects.spawnPaddleHit(this.position.clone(), paddle.width);

    // Calculate bounce angle based on hit position
    // Center hit = straight up, edge hits = angled
    const relativeHit = hitPosition / (paddle.width / 2); // -1 to 1
    const maxAngle = CONFIG.BALL.MAX_ANGLE;
    const bounceAngle = -Math.PI / 2 + relativeHit * maxAngle * CONFIG.PHYSICS.BALL_PADDLE_ANGLE_FACTOR;

    this.velocity.set(Math.sin(bounceAngle), Math.cos(bounceAngle), 0).normalize();

    // Speed up slightly
    this.speed = Math.min(this.maxSpeed, this.speed + CONFIG.BALL.SPEED_INCREMENT_PER_HIT);

    // Visual feedback
    this.mesh.scale.setScalar(1.3);
    setTimeout(() => { this.mesh.scale.setScalar(1); }, 50);
    this.coreMaterial.emissiveIntensity = 4;
    setTimeout(() => { this.coreMaterial.emissiveIntensity = 2; }, 100);
  }

  hitWall() {
    this.audio.playBounce(false);
  }

  hitBrick(brickType) {
    this.audio.playBrickDestroy(brickType);
    this.effects.spawnBrickExplosion(this.position.clone(), brickType, getBrickType(brickType).color);
  }

  checkBounds(arena) {
    const halfWidth = arena.halfWidth - this.radius;
    const halfHeight = arena.halfHeight - this.radius;

    let collided = false;

    // Left/Right walls
    if (this.position.x <= -halfWidth) {
      this.position.x = -halfWidth;
      this.velocity.x = Math.abs(this.velocity.x);
      this.hitWall();
      collided = true;
    } else if (this.position.x >= halfWidth) {
      this.position.x = halfWidth;
      this.velocity.x = -Math.abs(this.velocity.x);
      this.hitWall();
      collided = true;
    }

    // Top wall
    if (this.position.y >= halfHeight) {
      this.position.y = halfHeight;
      this.velocity.y = -Math.abs(this.velocity.y);
      this.hitWall();
      collided = true;
    }

    // Bottom - ball lost
    if (this.position.y <= -halfHeight) {
      return 'LOST';
    }

    this.mesh.position.copy(this.position);
    return collided ? 'WALL' : null;
  }

  // Check collision with paddle
  checkPaddleCollision(paddle) {
    if (!this.isLaunched || !paddle.mesh) return false;

    const paddleHalfWidth = paddle.width / 2;
    const paddleHalfHeight = paddle.height / 2;

    const dx = this.position.x - paddle.mesh.position.x;
    const dy = this.position.y - paddle.mesh.position.y;

    if (Math.abs(dx) <= paddleHalfWidth + this.radius &&
        Math.abs(dy) <= paddleHalfHeight + this.radius) {

      // Only bounce if moving downward
      if (this.velocity.y < 0) {
        const hitPosition = Math.max(-paddleHalfWidth, Math.min(paddleHalfWidth, dx));
        this.position.y = paddle.mesh.position.y + paddleHalfHeight + this.radius;
        this.hitPaddle(paddle, hitPosition);
        return true;
      }
    }
    return false;
  }

  // Check collision with brick
  checkBrickCollision(brick) {
    if (!brick.active || !this.isLaunched) return false;

    // Fireball passes through bricks
    if (this.isFireball && brick.type !== 'indestructible') {
      const dx = Math.abs(this.position.x - brick.mesh.position.x);
      const dy = Math.abs(this.position.y - brick.mesh.position.y);
      const dz = Math.abs(this.position.z - brick.mesh.position.z);

      if (dx <= brick.halfWidth + this.radius &&
          dy <= brick.halfHeight + this.radius &&
          dz <= brick.halfDepth + this.radius) {
        return 'PENETRATE';
      }
      return false;
    }

    // AABB vs Sphere collision
    const dx = Math.abs(this.position.x - brick.mesh.position.x);
    const dy = Math.abs(this.position.y - brick.mesh.position.y);
    const dz = Math.abs(this.position.z - brick.mesh.position.z);

    if (dx <= brick.halfWidth + this.radius &&
        dy <= brick.halfHeight + this.radius &&
        dz <= brick.halfDepth + this.radius) {

      // Determine collision normal
      const overlapX = (brick.halfWidth + this.radius) - dx;
      const overlapY = (brick.halfHeight + this.radius) - dy;
      const overlapZ = (brick.halfDepth + this.radius) - dz;

      const minOverlap = Math.min(overlapX, overlapY, overlapZ);
      let normal = new THREE.Vector3();

      if (minOverlap === overlapX) {
        normal.set(this.position.x > brick.mesh.position.x ? 1 : -1, 0, 0);
        this.position.x = brick.mesh.position.x + normal.x * (brick.halfWidth + this.radius);
      } else if (minOverlap === overlapY) {
        normal.set(0, this.position.y > brick.mesh.position.y ? 1 : -1, 0);
        this.position.y = brick.mesh.position.y + normal.y * (brick.halfHeight + this.radius);
      } else {
        normal.set(0, 0, this.position.z > brick.mesh.position.z ? 1 : -1);
        this.position.z = brick.mesh.position.z + normal.z * (brick.halfDepth + this.radius);
      }

      this.reflect(normal);
      this.mesh.position.copy(this.position);
      return true;
    }
    return false;
  }

  dispose() {
    this.scene.removeFromEntities(this.mesh);
    this.mesh.geometry.dispose();
    this.coreMaterial.dispose();
    this.aura.geometry.dispose();
    this.auraMaterial.dispose();
    if (this.fireParticles) {
      this.scene.removeFromEffects(this.fireParticles);
      this.fireParticles.geometry.dispose();
      this.fireParticles.material.dispose();
    }
    this.effects.clearTrail(this.id);
  }
}