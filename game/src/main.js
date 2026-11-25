// Ember Hearth — Main: the game loop and the glue between modules.
// Boot: canvas, state, world, sound, input. Tick: update, render, repeat.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';
import { GameState } from './state.js';
import { World } from './world.js';
import { draw } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 7) || 7;
const shot = params.get('shot');

const sound = new SoundEngine();
const state = new GameState(seed);
const world = new World(state, sound);
const input = new Input(canvas);
input.onFirstGesture = () => sound.ensure();

if (shot) applyShot(shot, state, world);

// The title screen's Start button (and the game-over Cook Again button).
function buttonAt(x, y) {
  if (state.phase === 'title') return x >= 520 && x <= 760 && y >= 440 && y <= 496;
  if (state.phase === 'over') return x >= 520 && x <= 760 && y >= 410 && y <= 466;
  return false;
}

function startShift() {
  state.reset(seed);
  state.phase = 'playing';
  state.spawnOrder();
  sound.ensure();
  sound.rush();
  state.say('First ticket is in — grab ingredients from the pantry!', 3);
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // Global keys, whatever the phase.
  if (input.wasPressed('m')) {
    const muted = sound.toggleMute();
    state.say(muted ? 'Sound off.' : 'Sound on.', 1.2);
  }
  if (input.wasPressed('p') && (state.phase === 'playing' || state.phase === 'paused')) {
    state.phase = state.phase === 'playing' ? 'paused' : 'playing';
    if (state.phase === 'paused') sound.stopSizzle();
  }

  if (state.phase === 'title') {
    if (input.wasPressed('enter') || input.wasPressed(' ')) startShift();
    if (input.consumeClick() && buttonAt(input.mouse.x, input.mouse.y)) startShift();
  } else if (state.phase === 'over') {
    if (input.wasPressed('r') || input.wasPressed('enter')) startShift();
    if (input.consumeClick() && buttonAt(input.mouse.x, input.mouse.y)) startShift();
  } else if (state.phase === 'playing') {
    world.update(dt, input);
    const ended = state.tick(dt);
    if (ended === 'over') {
      sound.stopSizzle();
      sound.win();
    }
    // A ticking clock in the last ten seconds.
    if (state.timeLeft <= 10.5 && state.timeLeft > 0 && Math.ceil(state.timeLeft) !== Math.ceil(state.timeLeft + dt)) {
      sound.tick();
    }
  }

  draw(ctx, state, world);
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
