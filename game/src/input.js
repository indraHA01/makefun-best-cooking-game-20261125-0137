// Ember Hearth — Input: keyboard + mouse, in canvas coordinates.
// The game reads this each frame; nothing here knows about game rules.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, down: false };
    this.onFirstGesture = null;
    this._gestured = false;

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.key.toLowerCase());
      this.keys.add(event.key.toLowerCase());
      this._gesture();
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouse.x = (event.clientX - rect.left) * scaleX;
      this.mouse.y = (event.clientY - rect.top) * scaleY;
    });
    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouse.x = (event.clientX - rect.left) * scaleX;
      this.mouse.y = (event.clientY - rect.top) * scaleY;
      this.mouse.down = true;
      this.mouse.clicked = true;
      this._gesture();
    });
    window.addEventListener('pointerup', () => { this.mouse.down = false; });
  }

  _gesture() {
    if (this._gestured) return;
    this._gestured = true;
    if (this.onFirstGesture) this.onFirstGesture();
  }

  // True only on the frame the key went down.
  wasPressed(key) {
    return this.pressed.has(key.toLowerCase());
  }

  isDown(key) {
    return this.keys.has(key.toLowerCase());
  }

  // Movement vector from WASD or arrow keys, normalized.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.isDown('a') || this.isDown('arrowleft')) x -= 1;
    if (this.isDown('d') || this.isDown('arrowright')) x += 1;
    if (this.isDown('w') || this.isDown('arrowup')) y -= 1;
    if (this.isDown('s') || this.isDown('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const len = Math.hypot(x, y);
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  // True only on the frame the mouse was clicked; clears after the read.
  consumeClick() {
    const clicked = this.mouse.clicked;
    this.mouse.clicked = false;
    return clicked;
  }

  // Call at the end of each frame: edge-triggered keys live one frame.
  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}
