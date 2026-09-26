// Arena walls and boundaries
import * as THREE from 'three';
import { CONFIG, DERIVED } from '../config.js';
import { createGlowMaterial, createStandardMaterial, createNeonMaterial } from '../rendering/Effects.js';

export class Arena {
  constructor(scene) {
    this.scene = scene;
    this.halfWidth = DERIVED.ARENA_HALF_WIDTH;
    this.halfHeight = DERIVED.ARENA_HALF_HEIGHT;
    this.halfDepth = DERIVED.ARENA_HALF_DEPTH;
    this.wallThickness = CONFIG.ARENA.WALL_THICKNESS;

    this.createWalls();
    this.createFloor();
    this.createCornerPillars();
  }

  createWalls() {
    const wallMaterial = createStandardMaterial(CONFIG.COLORS.WALL, CONFIG.COLORS.WALL_EMISSIVE);
    wallMaterial.roughness = 0.3;
    wallMaterial.metalness = 0.5;

    // Left wall
    this.leftWall = this.createWall(
      -this.halfWidth + this.wallThickness / 2, 0, 0,
      this.wallThickness, CONFIG.ARENA.HEIGHT, CONFIG.ARENA.DEPTH,
      wallMaterial
    );

    // Right wall
    this.rightWall = this.createWall(
      this.halfWidth - this.wallThickness / 2, 0, 0,
      this.wallThickness, CONFIG.ARENA.HEIGHT, CONFIG.ARENA.DEPTH,
      wallMaterial
    );

    // Top wall
    this.topWall = this.createWall(
      0, this.halfHeight - this.wallThickness / 2, 0,
      CONFIG.ARENA.WIDTH, this.wallThickness, CONFIG.ARENA.DEPTH,
      wallMaterial
    );

    // Edge glow lines
    this.createEdgeGlows();
  }

  createWall(x, y, z, w, h, d, material) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    this.scene.addToArena(mesh);
    return mesh;
  }

  createEdgeGlows() {
    const glowMaterial = createNeonMaterial(CONFIG.COLORS.WALL_EMISSIVE, 1.5);
    glowMaterial.opacity = 0.5;

    // Vertical edge glows
    const edgeGeometry = new THREE.BoxGeometry(0.05, CONFIG.ARENA.HEIGHT, 0.05);

    // Left edges
    this.leftEdge1 = new THREE.Mesh(edgeGeometry, glowMaterial.clone());
    this.leftEdge1.position.set(-this.halfWidth, 0, this.halfDepth);
    this.scene.addToArena(this.leftEdge1);

    this.leftEdge2 = new THREE.Mesh(edgeGeometry, glowMaterial.clone());
    this.leftEdge2.position.set(-this.halfWidth, 0, -this.halfDepth);
    this.scene.addToArena(this.leftEdge2);

    // Right edges
    this.rightEdge1 = new THREE.Mesh(edgeGeometry, glowMaterial.clone());
    this.rightEdge1.position.set(this.halfWidth, 0, this.halfDepth);
    this.scene.addToArena(this.rightEdge1);

    this.rightEdge2 = new THREE.Mesh(edgeGeometry, glowMaterial.clone());
    this.rightEdge2.position.set(this.halfWidth, 0, -this.halfDepth);
    this.scene.addToArena(this.rightEdge2);

    // Top edges
    const topEdgeGeometry = new THREE.BoxGeometry(CONFIG.ARENA.WIDTH, 0.05, 0.05);
    this.topEdge1 = new THREE.Mesh(topEdgeGeometry, glowMaterial.clone());
    this.topEdge1.position.set(0, this.halfHeight, this.halfDepth);
    this.scene.addToArena(this.topEdge1);

    this.topEdge2 = new THREE.Mesh(topEdgeGeometry, glowMaterial.clone());
    this.topEdge2.position.set(0, this.halfHeight, -this.halfDepth);
    this.scene.addToArena(this.topEdge2);
  }

  createFloor() {
    // Subtle floor grid
    const floorGeometry = new THREE.PlaneGeometry(CONFIG.ARENA.WIDTH, CONFIG.ARENA.DEPTH, 20, 10);
    const floorMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.COLORS.GRID,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -this.halfHeight - 0.01;
    this.scene.addToArena(this.floor);

    // Grid lines
    const gridGeometry = new THREE.BufferGeometry();
    const gridPositions = [];
    const gridSize = 1;
    const halfW = this.halfWidth;
    const halfD = this.halfDepth;

    // Lines along X
    for (let z = -halfD; z <= halfD; z += gridSize) {
      gridPositions.push(-halfW, -this.halfHeight + 0.01, z);
      gridPositions.push(halfW, -this.halfHeight + 0.01, z);
    }
    // Lines along Z
    for (let x = -halfW; x <= halfW; x += gridSize) {
      gridPositions.push(x, -this.halfHeight + 0.01, -halfD);
      gridPositions.push(x, -this.halfHeight + 0.01, halfD);
    }

    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3));

    const gridMaterial = new THREE.LineBasicMaterial({
      color: CONFIG.COLORS.WALL_EMISSIVE,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending
    });
    this.grid = new THREE.LineSegments(gridGeometry, gridMaterial);
    this.scene.addToArena(this.grid);
  }

  createCornerPillars() {
    const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.4, CONFIG.ARENA.HEIGHT + this.wallThickness, 8);
    const pillarMaterial = createStandardMaterial(0x002244, 0x004488);
    pillarMaterial.roughness = 0.4;
    pillarMaterial.metalness = 0.6;

    const positions = [
      [-this.halfWidth, 0, this.halfDepth],
      [this.halfWidth, 0, this.halfDepth],
      [-this.halfWidth, 0, -this.halfDepth],
      [this.halfWidth, 0, -this.halfDepth]
    ];

    this.pillars = positions.map(pos => {
      const mesh = new THREE.Mesh(pillarGeometry, pillarMaterial.clone());
      mesh.position.set(pos[0], pos[1], pos[2]);
      this.scene.addToArena(mesh);
      return mesh;
    });

    // Pillar top lights
    const lightGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const lightMaterial = createNeonMaterial(CONFIG.COLORS.WALL_EMISSIVE, 2);
    this.pillarLights = positions.map((pos, i) => {
      const mesh = new THREE.Mesh(lightGeometry, lightMaterial.clone());
      mesh.position.set(pos[0], pos[1] + CONFIG.ARENA.HEIGHT / 2 + 0.3, pos[2]);
      this.scene.addToArena(mesh);
      return mesh;
    });
  }

  update(deltaTime, time) {
    // Animate edge glows
    const pulse = Math.sin(time * 2) * 0.2 + 0.8;
    [this.leftEdge1, this.leftEdge2, this.rightEdge1, this.rightEdge2,
     this.topEdge1, this.topEdge2].forEach(edge => {
      edge.material.opacity = 0.3 * pulse;
    });

    // Animate pillar lights
    this.pillarLights.forEach((light, i) => {
      light.material.opacity = 0.5 + Math.sin(time * 1.5 + i) * 0.3;
      light.scale.setScalar(0.8 + Math.sin(time * 2 + i) * 0.2);
    });

    // Subtle grid pulse
    if (this.grid) {
      this.grid.material.opacity = 0.05 + Math.sin(time * 0.5) * 0.05;
    }
  }

  // Check ball collision with walls
  checkBallCollision(ball) {
    const radius = ball.radius;
    let collided = false;

    // Left wall
    if (ball.position.x - radius <= -this.halfWidth + this.wallThickness / 2) {
      ball.position.x = -this.halfWidth + this.wallThickness / 2 + radius;
      ball.velocity.x = Math.abs(ball.velocity.x);
      collided = true;
    }
    // Right wall
    else if (ball.position.x + radius >= this.halfWidth - this.wallThickness / 2) {
      ball.position.x = this.halfWidth - this.wallThickness / 2 - radius;
      ball.velocity.x = -Math.abs(ball.velocity.x);
      collided = true;
    }

    // Top wall
    if (ball.position.y + radius >= this.halfHeight - this.wallThickness / 2) {
      ball.position.y = this.halfHeight - this.wallThickness / 2 - radius;
      ball.velocity.y = -Math.abs(ball.velocity.y);
      collided = true;
    }

    // Front/back walls (depth)
    if (ball.position.z - radius <= -this.halfDepth) {
      ball.position.z = -this.halfDepth + radius;
      ball.velocity.z = Math.abs(ball.velocity.z);
      collided = true;
    } else if (ball.position.z + radius >= this.halfDepth) {
      ball.position.z = this.halfDepth - radius;
      ball.velocity.z = -Math.abs(ball.velocity.z);
      collided = true;
    }

    if (collided) {
      ball.mesh.position.copy(ball.position);
    }

    return collided;
  }

  // Check if ball is lost (past bottom)
  isBallLost(ball) {
    return ball.position.y - ball.radius <= -this.halfHeight;
  }

  dispose() {
    [this.leftWall, this.rightWall, this.topWall, this.floor, this.grid].forEach(obj => {
      if (obj) {
        this.scene.removeFromArena(obj);
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    [this.leftEdge1, this.leftEdge2, this.rightEdge1, this.rightEdge2,
     this.topEdge1, this.topEdge2].forEach(edge => {
      if (edge) {
        this.scene.removeFromArena(edge);
        edge.geometry.dispose();
        edge.material.dispose();
      }
    });

    this.pillars.forEach(p => {
      this.scene.removeFromArena(p);
      p.geometry.dispose();
      p.material.dispose();
    });

    this.pillarLights.forEach(l => {
      this.scene.removeFromArena(l);
      l.geometry.dispose();
      l.material.dispose();
    });
  }
}