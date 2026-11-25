// Ember Hearth — GameState: the whole shift in one object.
// Orders, the plate, the chef's hand, the stove and board, coins and hearts.
// World logic mutates this; render only reads it.

import {
  ORDER_PATIENCE, MAX_ORDERS, ORDER_SPAWN_EVERY, ORDER_SPAWN_RUSH,
  RUSH_AT_SECONDS_LEFT, SHIFT_SECONDS, RECIPES, unlockedRecipes, mulberry32,
} from './config.js';

let orderCounter = 0;

export class GameState {
  constructor(seed = 1) {
    this.random = mulberry32(seed);
    this.phase = 'title'; // title | playing | paused | over
    this.elapsed = 0;
    this.timeLeft = SHIFT_SECONDS;
    this.coins = 0;
    this.served = 0;
    this.expired = 0;
    this.hearts = 3;
    this.orders = [];
    this.spawnTimer = 6; // first ticket arrives quickly
    this.hand = null; // one item id, 'plate', or null
    this.plate = []; // item ids on the assembly plate
    this.board = { item: null, progress: 0, working: false };
    this.stove = [
      { item: null, progress: 0, state: 'empty' }, // state: empty|cooking|done|burnt
      { item: null, progress: 0, state: 'empty' },
    ];
    this.toasts = [];
    this.message = '';
    this.messageTimer = 0;
    this.rushAnnounced = false;
    this.stars = 0;
    this.flash = 0; // red flash on a lost order
  }

  get rushing() {
    return this.timeLeft <= RUSH_AT_SECONDS_LEFT && this.phase === 'playing';
  }

  get spawnEvery() {
    return this.rushing ? ORDER_SPAWN_RUSH : ORDER_SPAWN_EVERY;
  }

  // A ticket appears on the order board: pick a random unlocked recipe.
  spawnOrder() {
    if (this.orders.length >= MAX_ORDERS) return;
    const menu = unlockedRecipes(this.elapsed);
    const recipe = menu[Math.floor(this.random() * menu.length)];
    orderCounter += 1;
    this.orders.push({
      id: orderCounter,
      recipeId: recipe.id,
      patience: ORDER_PATIENCE,
      maxPatience: ORDER_PATIENCE,
      served: false,
    });
  }

  // Does the plate on the counter match this order, item for item?
  plateMatches(order) {
    const recipe = RECIPES.find((r) => r.id === order.recipeId);
    if (!recipe || this.plate.length !== recipe.items.length) return false;
    const want = [...recipe.items].sort();
    const have = [...this.plate].sort();
    return want.every((item, i) => item === have[i]);
  }

  // The plate is complete when it matches ANY open order.
  plateReady() {
    return this.orders.some((order) => this.plateMatches(order));
  }

  // Hand the plate to the window: find its order, pay coins + tip.
  servePlate() {
    const order = this.orders.find((o) => this.plateMatches(o));
    if (!order) return null;
    const recipe = RECIPES.find((r) => r.id === order.recipeId);
    const tip = Math.round((order.patience / order.maxPatience) * 15);
    const earned = recipe.base + tip;
    this.coins += earned;
    this.served += 1;
    this.orders = this.orders.filter((o) => o.id !== order.id);
    this.plate = [];
    this.hand = null;
    return { earned, tip, name: recipe.name };
  }

  loseOrder(order) {
    this.orders = this.orders.filter((o) => o.id !== order.id);
    this.expired += 1;
    this.hearts = Math.max(0, this.hearts - 1);
    this.coins = Math.max(0, this.coins - 15);
    this.flash = 0.6;
  }

  toast(text, color = '#ffffff') {
    this.toasts.push({ text, color, life: 1.6, y: 0 });
    if (this.toasts.length > 5) this.toasts.shift();
  }

  say(text, seconds = 2.5) {
    this.message = text;
    this.messageTimer = seconds;
  }

  // One tick of the shift clock. Returns 'over' when the shift ends.
  tick(dt) {
    if (this.phase !== 'playing') return null;
    this.elapsed += dt;
    this.timeLeft = Math.max(0, SHIFT_SECONDS - this.elapsed);
    if (this.flash > 0) this.flash -= dt;
    if (this.messageTimer > 0) this.messageTimer -= dt;
    for (const toast of this.toasts) {
      toast.life -= dt;
      toast.y += 22 * dt;
    }
    this.toasts = this.toasts.filter((t) => t.life > 0);

    // Order patience drains; an empty ticket is a lost customer.
    for (const order of [...this.orders]) {
      order.patience -= dt;
      if (order.patience <= 0) this.loseOrder(order);
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnOrder();
      this.spawnTimer = this.spawnEvery;
    }
    if (this.rushing && !this.rushAnnounced) {
      this.rushAnnounced = true;
      this.say('RUSH HOUR! Tickets are coming fast — keep the plates moving!', 3);
    }
    if (this.timeLeft <= 0) {
      this.phase = 'over';
      this.stars = this.coins >= 150 ? 3 : this.coins >= 100 ? 2 : this.coins >= 50 ? 1 : 0;
      return 'over';
    }
    if (this.hearts <= 0) {
      this.phase = 'over';
      this.stars = 0;
      return 'over';
    }
    return null;
  }

  reset(seed = 1) {
    const fresh = new GameState(seed);
    Object.assign(this, fresh);
  }
}
