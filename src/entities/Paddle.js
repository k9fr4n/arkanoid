// Paddle entity
import * as THREE from 'three';
import { CONFIG, DERIVED } from '../config.js';
import { createGlowMaterial, createNeonMaterial } from '../rendering/Effects.js';

export class Paddle {
  constructor(scene, effects, audio) {
    this.scene = scene;
    this.effects = effects;
    this.audio = audio;
    this.width = CONFIG.PADDLE.WIDTH;
    this.height = CONFIG.PADDLE.HEIGHT;
    this.depth = CONFIG.PADDLE.DEPTH;
    this.speed = CONFIG.PADDLE.SPEED;
    this.maxX = DERIVED.PADDLE_MAX_X;
    this.targetX = 0;
    this.currentX = 0;
    this.isWide = false;
    this.wideTimer = 0;
    this.hasShield = false;
    this.shieldTimer = 0;
    this.shieldMesh = null;
    this.isGlowing = false;
    this.glowTimer = 0;

    this.createMesh();
  }

  createMesh() {
    // Main paddle geometry - rounded box
    const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth, 4, 2, 2);
    // Round corners by adjusting vertices
    this.roundGeometry(geometry);

    this.material = createGlowMaterial(
      CONFIG.COLORS.PADDLE,
      CONFIG.COLORS.PADDLE_EMISSIVE,
      1
    );

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(0, -DERIVED.ARENA_HALF_HEIGHT + CONFIG.ARENA.WALL_THICKNESS + this.height / 2, 0);
    this.currentX = this.mesh.position.x;

    // Edge glow
    const edgeGeometry = new THREE.BoxGeometry(this.width + 0.1, this.height + 0.1, this.depth + 0.1, 4, 2, 2);
    this.roundGeometry(edgeGeometry);
    const edgeMaterial = createNeonMaterial(CONFIG.COLORS.PADDLE, 1.5);
    edgeMaterial.opacity = 0.4;
    this.edgeMaterial = edgeMaterial;
    this.edgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
    this.mesh.add(this.edgeMesh);

    // Shield indicator
    this.createShield();

    this.scene.addToEntities(this.mesh);
  }

  roundGeometry(geometry) {
    const position = geometry.attributes.position;
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    const roundness = CONFIG.PADDLE.ROUNDNESS;

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);

      // Round the corners on X-Y plane
      if (Math.abs(x) > halfW - roundness && Math.abs(y) > halfH - roundness) {
        const dx = Math.abs(x) - (halfW - roundness);
        const dy = Math.abs(y) - (halfH - roundness);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > roundness) {
          const factor = roundness / dist;
          position.setX(i, x > 0 ? halfW - roundness + dx * factor : -halfW + roundness - dx * factor);
          position.setY(i, y > 0 ? halfH - roundness + dy * factor : -halfH + roundness - dy * factor);
        }
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  createShield() {
    const shieldGeometry = new THREE.PlaneGeometry(this.width + 0.5, 0.5);
    const shieldMaterial = createNeonMaterial(0xff00f3, 2);
    shieldMaterial.opacity = 0;
    shieldMaterial.side = THREE.DoubleSide;
    this.shieldMaterial = shieldMaterial;
    this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    this.shieldMesh.position.set(0, this.height / 2 + 0.1, 0);
    this.shieldMesh.rotation.x = -Math.PI / 2;
    this.mesh.add(this.shieldMesh);
  }

  update(deltaTime, inputX) {
    // Target movement with inertia - doesn't snap to center when input stops
    // Only update target when there's actual input
    if (inputX !== 0) {
      this.targetX = Math.max(-this.maxX, Math.min(this.maxX, inputX * this.maxX));
      this.currentX = this.targetX; // Snap to target when actively moving
    }
    // When no input, apply friction - paddle coasts to stop naturally
    // rather than being pulled to center
    const inputDeadzone = 0.1;
    const effectiveInput = Math.abs(inputX) > inputDeadzone ? inputX : 0;
    
    // Simple inertia: when no input, gradually slow down
    if (effectiveInput === 0 && this.currentX !== 0) {
      // Decelerate naturally
      const decel = deltaTime * 10;
      this.currentX += Math.sign(this.currentX) * -decel;
      // Clamp to max range
      this.currentX = Math.max(-this.maxX, Math.min(this.maxX, this.currentX));
    }
    
    this.mesh.position.x = this.currentX;

    // Update wide power-up
    if (this.isWide) {
      this.wideTimer -= deltaTime;
      if (this.wideTimer <= 0) {
        this.setWide(false);
      }
    }

    // Update shield
    if (this.hasShield) {
      this.shieldTimer -= deltaTime;
      const pulse = Math.sin(performance.now() * 0.01) * 0.2 + 0.5;
      this.shieldMaterial.opacity = pulse * 0.6;
      if (this.shieldTimer <= 0) {
        this.setShield(false);
      }
    }

    // Glow effect
    if (this.glowTimer > 0) {
      this.glowTimer -= deltaTime;
      this.isGlowing = true;
      this.material.emissiveIntensity = 2 + Math.sin(performance.now() * 0.02) * 1;
    } else {
      this.isGlowing = false;
      this.material.emissiveIntensity = 1;
    }

    // Edge glow pulse
    this.edgeMaterial.opacity = 0.3 + Math.sin(performance.now() * 0.005) * 0.1;
  }

  setWide(enabled) {
    this.isWide = enabled;
    if (enabled) {
      this.width = CONFIG.PADDLE.WIDTH * 1.6;
      this.maxX = DERIVED.PADDLE_MAX_X * 0.9; // Slightly less room when wide
      this.wideTimer = CONFIG.POWERUP.DURATION;
      this.updateGeometry();
      this.edgeMesh.scale.x = 1.6;
    } else {
      this.width = CONFIG.PADDLE.WIDTH;
      this.maxX = DERIVED.PADDLE_MAX_X;
      this.updateGeometry();
      this.edgeMesh.scale.x = 1;
    }
  }

  setShield(enabled) {
    this.hasShield = enabled;
    if (enabled) {
      this.shieldTimer = CONFIG.POWERUP.DURATION;
      this.shieldMaterial.opacity = 0.6;
    } else {
      this.shieldMaterial.opacity = 0;
    }
  }

  triggerGlow() {
    this.glowTimer = 0.2;
    this.isGlowing = true;
  }

  updateGeometry() {
    // Recreate geometry with new width
    this.mesh.geometry.dispose();
    const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth, 4, 2, 2);
    this.roundGeometry(geometry);
    this.mesh.geometry = geometry;

    this.edgeMesh.geometry.dispose();
    const edgeGeometry = new THREE.BoxGeometry(this.width + 0.1, this.height + 0.1, this.depth + 0.1, 4, 2, 2);
    this.roundGeometry(edgeGeometry);
    this.edgeMesh.geometry = edgeGeometry;
  }

  // Check if ball hits shield
  checkShield(ball) {
    if (!this.hasShield) return false;

    const shieldY = this.mesh.position.y + this.height / 2 + 0.1;
    if (ball.position.y <= shieldY && ball.velocity.y < 0) {
      const dx = Math.abs(ball.position.x - this.mesh.position.x);
      if (dx <= this.width / 2 + ball.radius) {
        // Bounce ball
        ball.position.y = shieldY + ball.radius;
        ball.velocity.y = Math.abs(ball.velocity.y);
        this.audio.playBounce(true);
        this.effects.spawnPaddleHit(new THREE.Vector3(ball.position.x, shieldY, 0), this.width);
        return true;
      }
    }
    return false;
  }

  getWorldPosition() {
    return this.mesh.position.clone();
  }

  dispose() {
    this.scene.removeFromEntities(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.edgeMesh.geometry.dispose();
    this.edgeMesh.material.dispose();
    if (this.shieldMesh) {
      this.shieldMesh.geometry.dispose();
      this.shieldMesh.material.dispose();
    }
  }
}