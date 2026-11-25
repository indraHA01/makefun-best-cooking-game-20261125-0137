// Ember Hearth — Sizzle & Serve: game configuration.
// Every tunable number, ingredient, recipe and station lives here so the
// rest of the game reads data, never magic numbers.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const HUD_HEIGHT = 64;
export const BOARD_X = 8;
export const BOARD_WIDTH = 264;
export const KITCHEN_X = 288;
export const KITCHEN_Y = 76;
export const KITCHEN_W = 984;
export const KITCHEN_H = 636;

export const SHIFT_SECONDS = 180;
export const RUSH_AT_SECONDS_LEFT = 30;
export const MAX_ORDERS = 4;
export const ORDER_PATIENCE = 80;
export const ORDER_SPAWN_EVERY = 18;
export const ORDER_SPAWN_RUSH = 12;
export const CHOP_SECONDS = 2.5;
export const COOK_SECONDS = 5;
export const BURN_SECONDS = 10;
export const CHEF_SPEED = 250;
export const CHEF_RADIUS = 20;

// Ingredients. `needs` tells the kitchen what a raw item must go through:
// "chop" on the board, "cook" on the stove, "none" ready to plate.
export const INGREDIENTS = {
  bun: { label: 'Bun', key: '1', needs: 'none', color: '#e8a94f', price: 0 },
  patty: { label: 'Patty', key: '2', needs: 'cook', color: '#b0613f', price: 0 },
  cheese: { label: 'Cheese', key: '3', needs: 'none', color: '#f7c948', price: 0 },
  tomato: { label: 'Tomato', key: '4', needs: 'chop', color: '#e4572e', price: 0 },
  lettuce: { label: 'Lettuce', key: '5', needs: 'chop', color: '#7bc950', price: 0 },
  onion: { label: 'Onion', key: '6', needs: 'chop', color: '#d9c7f0', price: 0 },
};

// What a station turns an item into, once its work is done.
export const PROCESSED = {
  tomato: 'choppedTomato',
  lettuce: 'choppedLettuce',
  onion: 'choppedOnion',
  patty: 'cookedPatty',
};

export const ITEM_LABELS = {
  bun: 'Bun',
  patty: 'Raw Patty',
  cheese: 'Cheese',
  tomato: 'Tomato',
  lettuce: 'Lettuce',
  onion: 'Onion',
  choppedTomato: 'Chopped Tomato',
  choppedLettuce: 'Chopped Lettuce',
  choppedOnion: 'Chopped Onion',
  cookedPatty: 'Seared Patty',
  burntPatty: 'Burnt Patty',
};

export const ITEM_COLORS = {
  bun: '#e8a94f',
  patty: '#b0613f',
  cheese: '#f7c948',
  tomato: '#e4572e',
  lettuce: '#7bc950',
  onion: '#d9c7f0',
  choppedTomato: '#ff6b4a',
  choppedLettuce: '#8fd45e',
  choppedOnion: '#efe6fa',
  cookedPatty: '#7a3b22',
  burntPatty: '#2b211c',
};

// The menu. A plate is served when its items match a recipe exactly.
export const RECIPES = [
  {
    id: 'ember-burger',
    name: 'Ember Burger',
    items: ['bun', 'cookedPatty', 'cheese', 'choppedLettuce'],
    base: 25,
    color: '#e4572e',
    unlockAt: 0,
  },
  {
    id: 'garden-bowl',
    name: 'Garden Bowl',
    items: ['choppedTomato', 'choppedLettuce', 'choppedOnion'],
    base: 20,
    color: '#7bc950',
    unlockAt: 0,
  },
  {
    id: 'melt-toast',
    name: 'Melt Toast',
    items: ['bun', 'cheese', 'choppedTomato'],
    base: 18,
    color: '#f7c948',
    unlockAt: 0,
  },
  {
    id: 'sunrise-stack',
    name: 'Sunrise Stack',
    items: ['bun', 'cookedPatty', 'choppedOnion', 'cheese'],
    base: 30,
    color: '#ff9f1c',
    unlockAt: 60,
  },
];

// Stations, in kitchen coordinates. `kind` drives the interaction.
export const STATIONS = [
  { id: 'pantry', kind: 'pantry', label: 'PANTRY', x: 300, y: 80, w: 330, h: 76 },
  { id: 'board', kind: 'board', label: 'CHOPPING BOARD', x: 300, y: 300, w: 180, h: 84 },
  { id: 'stove', kind: 'stove', label: 'STOVE', x: 700, y: 80, w: 300, h: 84 },
  { id: 'assembly', kind: 'assembly', label: 'ASSEMBLY', x: 560, y: 520, w: 260, h: 100 },
  { id: 'window', kind: 'window', label: 'SERVING WINDOW', x: 1150, y: 300, w: 122, h: 180 },
  { id: 'trash', kind: 'trash', label: 'COMPOST', x: 1050, y: 560, w: 150, h: 80 },
];

export const STATION_COLORS = {
  pantry: '#8a5a2b',
  board: '#c98f4e',
  stove: '#3d3d4d',
  assembly: '#e8e0d0',
  window: '#2e6f5e',
  trash: '#5a7d4f',
};

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function unlockedRecipes(elapsedSeconds) {
  return RECIPES.filter((r) => elapsedSeconds >= r.unlockAt);
}

// Tiny deterministic RNG so screenshots are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
