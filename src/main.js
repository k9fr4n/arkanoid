// Main entry point
import { Game } from './game/Game.js';

// Global game instance
let game = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check WebGL support (use an offscreen canvas so we don't steal
  // the game canvas context before Three.js creates its renderer)
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
  if (!gl) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a12;color:#00f3ff;font-family:'Orbitron',sans-serif;text-align:center;padding:2rem;">
        <div>
          <h1 style="font-size:2rem;margin-bottom:1rem;">WebGL Not Supported</h1>
          <p>This game requires a browser with WebGL support.</p>
          <p>Please update your browser or enable hardware acceleration.</p>
        </div>
      </div>
    `;
    return;
  }

  // Create and initialize game
  game = new Game();
  game.init();

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    if (game) game.dispose();
  });

  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.gameState.gameStatus === 'PLAYING') {
      game.pauseGame();
    }
  });

  // Expose for debugging
  window.neonBreaker = game;
});

// Export for modules
export { Game };