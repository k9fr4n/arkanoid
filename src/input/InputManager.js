// Input management system
export class InputManager {
  constructor() {
    this.mouseX = 0;
    this.normalizedMouseX = 0; // -1 to 1
    this.keysPressed = new Set();
    this.touchX = null;
    this.touchActive = false;
    this.launchRequested = false;
    this.pauseRequested = false;
    this.menuActionRequested = false;

    this.bindEvents();
  }

  bindEvents() {
    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.updateNormalizedMouseX();
    });

    // Mouse click / touch for launch
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.launchRequested = true;
      }
    });

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.touchActive = true;
        this.touchX = e.touches[0].clientX;
        this.updateNormalizedFromTouch();
        this.launchRequested = true;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0 && this.touchActive) {
        this.touchX = e.touches[0].clientX;
        this.updateNormalizedFromTouch();
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.touchActive = false;
      this.touchX = null;
    });

    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.code);
      if (e.code === 'Space') {
        e.preventDefault();
        this.launchRequested = true;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        this.pauseRequested = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.code);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.updateNormalizedMouseX();
    });

    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  updateNormalizedMouseX() {
    const width = window.innerWidth;
    this.normalizedMouseX = (this.mouseX / width) * 2 - 1;
  }

  updateNormalizedFromTouch() {
    if (this.touchX !== null) {
      const width = window.innerWidth;
      this.normalizedMouseX = (this.touchX / width) * 2 - 1;
    }
  }

  // Get paddle target position (-1 to 1)
  getPaddleTarget() {
    // Use touch if active, otherwise mouse
    if (this.touchActive) {
      this.updateNormalizedFromTouch();
    }
    return this.normalizedMouseX;
  }

  // Get keyboard input (-1, 0, 1)
  getKeyboardInput() {
    let input = 0;
    if (this.keysPressed.has('ArrowLeft') || this.keysPressed.has('KeyA')) input -= 1;
    if (this.keysPressed.has('ArrowRight') || this.keysPressed.has('KeyD')) input += 1;
    return input;
  }

  // Check and consume launch request
  consumeLaunchRequest() {
    const requested = this.launchRequested;
    this.launchRequested = false;
    return requested;
  }

  // Check and consume pause request
  consumePauseRequest() {
    const requested = this.pauseRequested;
    this.pauseRequested = false;
    return requested;
  }

  // Check and consume menu action
  consumeMenuAction() {
    const requested = this.menuActionRequested;
    this.menuActionRequested = false;
    return requested;
  }

  requestMenuAction() {
    this.menuActionRequested = true;
  }

  // Reset input state
  reset() {
    this.launchRequested = false;
    this.pauseRequested = false;
    this.menuActionRequested = false;
  }

  // Get current input state for debugging
  getState() {
    return {
      mouseX: this.mouseX,
      normalizedMouseX: this.normalizedMouseX,
      keysPressed: Array.from(this.keysPressed),
      touchActive: this.touchActive,
      touchX: this.touchX
    };
  }
}