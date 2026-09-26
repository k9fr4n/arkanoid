// Game configuration constants
export const CONFIG = {
  // Game identity
  GAME_NAME: 'NEON BREAKER',

  // Arena dimensions (in world units)
  ARENA: {
    WIDTH: 20,
    HEIGHT: 15,
    DEPTH: 4,
    WALL_THICKNESS: 0.5
  },

  // Paddle settings
  PADDLE: {
    WIDTH: 4,
    HEIGHT: 0.4,
    DEPTH: 1,
    SPEED: 28,
    MAX_X_OFFSET: 8.5, // ARENA.WIDTH/2 - WALL_THICKNESS - PADDLE.WIDTH/2
    ROUNDNESS: 0.3
  },

  // Ball settings
  BALL: {
    RADIUS: 0.35,
    INITIAL_SPEED: 12,
    MAX_SPEED: 28,
    SPEED_INCREMENT_PER_LEVEL: 1.2,
    SPEED_INCREMENT_PER_HIT: 0.08,
    TRAIL_LENGTH: 12,
    MIN_ANGLE: 0.25, // radians - prevent near-horizontal
    MAX_ANGLE: 1.3,  // radians - prevent near-vertical
    LAUNCH_ANGLE: -Math.PI / 2 // straight up
  },

  // Brick settings
  BRICK: {
    WIDTH: 2.2,
    HEIGHT: 0.9,
    DEPTH: 0.6,
    GAP: 0.15,
    ROWS: 6,
    COLS: 8,
    START_Y: 5.5,
    TYPES: {
      STANDARD: { hits: 1, points: 100, color: 0x00f3ff, emissive: 0x0066cc },
      REINFORCED: { hits: 3, points: 250, color: 0xffaa00, emissive: 0xcc6600 },
      SPECIAL: { hits: 1, points: 500, color: 0xff00f3, emissive: 0xcc0099, dropsPowerUp: true },
      INDESTRUCTIBLE: { hits: -1, points: 0, color: 0x444466, emissive: 0x222244 }
    }
  },

  // Power-up settings
  POWERUP: {
    SIZE: 0.7,
    FALL_SPEED: 4,
    DURATION: 10,
    TYPES: {
      MULTI_BALL: { color: 0x00ff88, name: 'MULTI-BALL', symbol: '◆' },
      WIDE_PADDLE: { color: 0x00f3ff, name: 'WIDE PADDLE', symbol: '▬' },
      SLOW_BALL: { color: 0xffaa00, name: 'SLOW BALL', symbol: '◐' },
      FIRE_BALL: { color: 0xff3300, name: 'FIRE BALL', symbol: '●' },
      SHIELD: { color: 0xff00f3, name: 'SHIELD', symbol: '⛨' },
      MAGNET: { color: 0xffff00, name: 'MAGNET', symbol: '⇅' },
      SCORE_MULTIPLIER: { color: 0xff6600, name: 'SCORE ×2', symbol: '×2' }
    },
    DROP_CHANCE: 0.15
  },

  // Player settings
  PLAYER: {
    INITIAL_LIVES: 3,
    MAX_LIVES: 5
  },

  // Physics
  PHYSICS: {
    FIXED_TIMESTEP: 1/60,
    MAX_SUBSTEPS: 3,
    BALL_PADDLE_ANGLE_FACTOR: 0.9 // How much paddle position affects angle
  },

  // Visual effects
  EFFECTS: {
    PARTICLE_COUNT_PER_BRICK: 12,
    PARTICLE_LIFETIME: 0.8,
    CAMERA_SHAKE_INTENSITY: 0.15,
    CAMERA_SHAKE_DURATION: 0.15,
    GLOW_INTENSITY: 1.5
  },

  // Colors (neon theme)
  COLORS: {
    BACKGROUND: 0x0a0a12,
    WALL: 0x003355,
    WALL_EMISSIVE: 0x005588,
    GRID: 0x002244,
    PADDLE: 0x00ffff,
    PADDLE_EMISSIVE: 0x0088cc,
    BALL: 0xffffff,
    BALL_EMISSIVE: 0x00f3ff,
    TRAIL: 0x00f3ff,
    PARTICLE: 0x00f3ff
  },

  // Levels data
  LEVELS: [
    // Level 1 - Introduction
    {
      name: "INITIALIZATION",
      rows: [
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0]
      ],
      ballSpeedMultiplier: 1.0
    },
    // Level 2 - Reinforced bricks
    {
      name: "RESISTANCE",
      rows: [
        [2, 2, 2, 2, 2, 2, 2, 2],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 2, 2, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0]
      ],
      ballSpeedMultiplier: 1.1
    },
    // Level 3 - Special bricks and indestructibles
    {
      name: "COMPLEXITY",
      rows: [
        [3, 1, 1, 4, 4, 1, 1, 3],
        [2, 2, 1, 1, 1, 1, 2, 2],
        [1, 1, 2, 2, 2, 2, 1, 1],
        [0, 3, 1, 1, 1, 1, 3, 0],
        [0, 0, 1, 4, 4, 1, 0, 0]
      ],
      ballSpeedMultiplier: 1.2
    },
    // Level 4 - Dense pattern
    {
      name: "DENSITY",
      rows: [
        [2, 2, 2, 2, 2, 2, 2, 2],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [2, 2, 1, 1, 1, 1, 2, 2],
        [1, 1, 2, 2, 2, 2, 1, 1],
        [2, 2, 1, 1, 1, 1, 2, 2],
        [1, 1, 1, 3, 3, 1, 1, 1]
      ],
      ballSpeedMultiplier: 1.3
    },
    // Level 5 - Fortress
    {
      name: "FORTRESS",
      rows: [
        [4, 4, 4, 4, 4, 4, 4, 4],
        [2, 1, 1, 1, 1, 1, 1, 2],
        [2, 1, 3, 2, 2, 3, 1, 2],
        [2, 1, 2, 1, 1, 2, 1, 2],
        [2, 1, 2, 1, 1, 2, 1, 2],
        [2, 1, 3, 2, 2, 3, 1, 2],
        [2, 1, 1, 1, 1, 1, 1, 2],
        [4, 4, 4, 4, 4, 4, 4, 4]
      ],
      ballSpeedMultiplier: 1.4
    },
    // Level 6 - The Gauntlet
    {
      name: "THE GAUNTLET",
      rows: [
        [3, 2, 2, 2, 2, 2, 2, 3],
        [2, 1, 1, 4, 4, 1, 1, 2],
        [2, 1, 3, 1, 1, 3, 1, 2],
        [1, 2, 1, 2, 2, 1, 2, 1],
        [2, 1, 3, 1, 1, 3, 1, 2],
        [2, 1, 1, 4, 4, 1, 1, 2],
        [3, 2, 2, 2, 2, 2, 2, 3],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [2, 2, 2, 3, 3, 2, 2, 2]
      ],
      ballSpeedMultiplier: 1.5
    }
  ],

  // Input
  INPUT: {
    MOUSE_SENSITIVITY: 1.0,
    TOUCH_SENSITIVITY: 1.0,
    KEYBOARD_SPEED: 32
  },

  // Audio (placeholder - using Web Audio API synthesis)
  AUDIO: {
    MASTER_VOLUME: 0.5,
    SFX_VOLUME: 0.6,
    MUSIC_VOLUME: 0.3
  }
};

// Helper to get brick type config
export function getBrickType(typeId) {
  const types = Object.values(CONFIG.BRICK.TYPES);
  return types[typeId - 1] || types[0];
}

// Derived constants
export const DERIVED = {
  ARENA_HALF_WIDTH: CONFIG.ARENA.WIDTH / 2,
  ARENA_HALF_HEIGHT: CONFIG.ARENA.HEIGHT / 2,
  ARENA_HALF_DEPTH: CONFIG.ARENA.DEPTH / 2,
  PADDLE_MAX_X: CONFIG.ARENA.WIDTH / 2 - CONFIG.ARENA.WALL_THICKNESS - CONFIG.PADDLE.WIDTH / 2,
  BRICK_FIELD_WIDTH: CONFIG.BRICK.COLS * (CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP) - CONFIG.BRICK.GAP,
  BRICK_START_X: -(CONFIG.BRICK.COLS * (CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP) - CONFIG.BRICK.GAP) / 2 + CONFIG.BRICK.WIDTH / 2
};