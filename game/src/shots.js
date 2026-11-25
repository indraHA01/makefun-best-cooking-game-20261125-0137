// Ember Hearth — Shots: preset scenes for the entry's screenshots.
// ?shot=start | play | end (and ?seed=N) stages a real game state through
// the same code the player runs — nothing here is drawn by hand for a photo.

import { KITCHEN_X, KITCHEN_Y, KITCHEN_W, KITCHEN_H } from './config.js';

// Stage a scene on a fresh state + world. Returns nothing; the game loop
// then renders it like any other frame.
export function applyShot(shot, state, world) {
  if (shot === 'start') {
    state.phase = 'title';
    state.spawnOrder();
    world.chef.x = KITCHEN_X + 130;
    world.chef.y = KITCHEN_Y + 130;
    world.chef.facing = 'right';
    return;
  }

  if (shot === 'play') {
    state.phase = 'playing';
    state.elapsed = 75;
    state.timeLeft = 105;
    state.coins = 68;
    state.served = 3;
    // Three tickets on the board, one already impatient.
    state.spawnOrder();
    state.spawnOrder();
    state.spawnOrder();
    state.orders[0].patience = 22;
    state.orders[1].patience = 55;
    state.orders[2].patience = 74;
    // A patty searing on the stove, nearly perfect.
    state.stove[0].item = 'patty';
    state.stove[0].progress = 4.2;
    state.stove[0].state = 'cooking';
    // A dish mid-assembly: bun + seared patty + cheese, lettuce to come.
    state.plate = ['bun', 'cookedPatty', 'cheese'];
    // The chef, chopped tomato in hand, hurrying to the assembly counter.
    state.hand = 'choppedTomato';
    world.chef.x = KITCHEN_X + KITCHEN_W / 2 - 40;
    world.chef.y = KITCHEN_Y + KITCHEN_H - 200;
    world.chef.facing = 'up';
    state.say('Ember Burger almost done — one more ingredient!', 3);
    state.toast('Served Garden Bowl! +32 coins (tip 12)', '#ffd166');
    return;
  }

  if (shot === 'end') {
    state.phase = 'over';
    state.elapsed = 180;
    state.timeLeft = 0;
    state.coins = 187;
    state.served = 8;
    state.expired = 1;
    state.stars = 3;
    state.hearts = 2;
    return;
  }
}
