// Ember Hearth — World: the chef, the stations and every interaction.
// Movement, collisions, chopping, cooking, plating and serving all live here.

import {
  CHEF_RADIUS, CHEF_SPEED, CHOP_SECONDS, COOK_SECONDS, BURN_SECONDS,
  KITCHEN_X, KITCHEN_Y, KITCHEN_W, KITCHEN_H, STATIONS, INGREDIENTS, PROCESSED,
  ITEM_LABELS,
} from './config.js';

function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Is the chef close enough to reach this station?
function nearStation(chef, station) {
  const cx = clamp(chef.x, station.x, station.x + station.w);
  const cy = clamp(chef.y, station.y, station.y + station.h);
  return Math.hypot(chef.x - cx, chef.y - cy) < CHEF_RADIUS + 26;
}

export class World {
  constructor(state, sound) {
    this.state = state;
    this.sound = sound;
    this.chef = { x: KITCHEN_X + KITCHEN_W / 2, y: KITCHEN_Y + KITCHEN_H - 90, facing: 'up', moving: false };
    this.moveTarget = null; // {x, y, stationId, pendingIngredient}
    this.walkBob = 0;
  }

  // Keep the chef inside the kitchen and out of the station blocks.
  collide(chef) {
    chef.x = clamp(chef.x, KITCHEN_X + CHEF_RADIUS, KITCHEN_X + KITCHEN_W - CHEF_RADIUS);
    chef.y = clamp(chef.y, KITCHEN_Y + CHEF_RADIUS, KITCHEN_Y + KITCHEN_H - CHEF_RADIUS);
    for (const station of STATIONS) {
      if (station.id === 'window') continue; // the hatch is on the wall edge
      const nearestX = clamp(chef.x, station.x, station.x + station.w);
      const nearestY = clamp(chef.y, station.y, station.y + station.h);
      const dx = chef.x - nearestX;
      const dy = chef.y - nearestY;
      const dist = Math.hypot(dx, dy);
      if (dist < CHEF_RADIUS && dist > 0.01) {
        chef.x = nearestX + (dx / dist) * CHEF_RADIUS;
        chef.y = nearestY + (dy / dist) * CHEF_RADIUS;
      }
    }
  }

  update(dt, input) {
    const state = this.state;
    if (state.phase !== 'playing') return;

    // Chopping and cooking run on their own clocks.
    this.updateBoard(dt);
    this.updateStove(dt);

    // Keyboard movement cancels a click target.
    const move = input.moveVector();
    if (move.x !== 0 || move.y !== 0) {
      this.moveTarget = null;
      this.chef.x += move.x * CHEF_SPEED * dt;
      this.chef.y += move.y * CHEF_SPEED * dt;
      this.chef.moving = true;
      this.walkBob += dt * 12;
      this.chef.facing = Math.abs(move.x) > Math.abs(move.y)
        ? (move.x > 0 ? 'right' : 'left')
        : (move.y > 0 ? 'down' : 'up');
    } else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.chef.x;
      const dy = this.moveTarget.y - this.chef.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) {
        const target = this.moveTarget;
        this.moveTarget = null;
        this.chef.moving = false;
        if (target.stationId) this.interact(target.stationId, target.pendingIngredient);
      } else {
        this.chef.x += (dx / dist) * CHEF_SPEED * dt;
        this.chef.y += (dy / dist) * CHEF_SPEED * dt;
        this.chef.moving = true;
        this.walkBob += dt * 12;
        this.chef.facing = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? 'right' : 'left')
          : (dy > 0 ? 'down' : 'up');
      }
    } else {
      this.chef.moving = false;
    }
    this.collide(this.chef);

    // E / Space interacts with the nearest reachable station.
    if (input.wasPressed('e') || input.wasPressed(' ')) {
      const station = STATIONS.find((s) => nearStation(this.chef, s));
      if (station) this.interact(station.id);
    }

    // Number keys 1-6 grab that ingredient from the pantry, if in reach.
    for (const [id, ingredient] of Object.entries(INGREDIENTS)) {
      if (input.wasPressed(ingredient.key)) this.grabIngredient(id);
    }

    // Mouse: click a station to walk there and use it; click anywhere else
    // to walk there. Clicking an ingredient bin grabs it on arrival.
    if (input.consumeClick()) {
      const { x, y } = input.mouse;
      const station = STATIONS.find((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
      if (station) {
        let pending = null;
        if (station.id === 'pantry') {
          pending = this.pantryIngredientAt(x, y);
        }
        const target = this.approachPoint(station);
        this.moveTarget = { x: target.x, y: target.y, stationId: station.id, pendingIngredient: pending };
      } else if (x >= KITCHEN_X && x <= KITCHEN_X + KITCHEN_W && y >= KITCHEN_Y && y <= KITCHEN_Y + KITCHEN_H) {
        this.moveTarget = { x, y, stationId: null, pendingIngredient: null };
      }
    }
  }

  // A point just outside the station, facing it, for click-to-walk.
  approachPoint(station) {
    const cx = station.x + station.w / 2;
    const cy = station.y + station.h / 2;
    const below = { x: cx, y: station.y + station.h + CHEF_RADIUS + 8 };
    const above = { x: cx, y: station.y - CHEF_RADIUS - 8 };
    const left = { x: station.x - CHEF_RADIUS - 8, y: cy };
    const right = { x: station.x + station.w + CHEF_RADIUS + 8, y: cy };
    const chef = this.chef;
    const options = [below, above, left, right]
      .filter((p) => p.x > KITCHEN_X && p.x < KITCHEN_X + KITCHEN_W && p.y > KITCHEN_Y && p.y < KITCHEN_Y + KITCHEN_H);
    options.sort((a, b) => Math.hypot(a.x - chef.x, a.y - chef.y) - Math.hypot(b.x - chef.x, b.y - chef.y));
    return options[0] ?? { x: chef.x, y: chef.y };
  }

  // Which pantry bin sits under this click? Six bins in a row.
  pantryIngredientAt(x, y) {
    const station = stationById('pantry');
    const ids = Object.keys(INGREDIENTS);
    const index = Math.floor(((x - station.x) / station.w) * ids.length);
    return ids[clamp(index, 0, ids.length - 1)] ?? null;
  }

  updateBoard(dt) {
    const board = this.state.board;
    if (!board.working || !board.item) return;
    board.progress += dt;
    if (board.progress >= CHOP_SECONDS) {
      const done = PROCESSED[board.item];
      board.item = done;
      board.working = false;
      board.progress = 0;
      this.sound.chopDone();
      this.state.toast(`${ITEM_LABELS[done]} ready!`, '#8fd45e');
    }
  }

  updateStove(dt) {
    let cooking = false;
    for (const burner of this.state.stove) {
      if (burner.state === 'empty') continue;
      cooking = true;
      burner.progress += dt;
      if (burner.state === 'cooking' && burner.progress >= COOK_SECONDS) {
        burner.state = 'done';
        burner.item = PROCESSED[burner.item];
        this.sound.cookDone();
        this.state.toast('Patty seared — perfect! Grab it before it burns.', '#f7c948');
      } else if (burner.state === 'done' && burner.progress >= BURN_SECONDS) {
        burner.state = 'burnt';
        burner.item = 'burntPatty';
        this.sound.error();
        this.state.say('That patty burnt! Toss it in the compost.', 2.5);
      }
    }
    if (cooking) this.sound.startSizzle();
    else this.sound.stopSizzle();
  }

  // --- Interactions -------------------------------------------------------

  interact(stationId, pendingIngredient = null) {
    const state = this.state;
    if (stationId === 'pantry') {
      if (pendingIngredient) this.grabIngredient(pendingIngredient);
      else state.say('Pantry: press 1–6 or click a bin to grab an ingredient.', 2.5);
      return;
    }
    if (stationId === 'board') return this.useBoard();
    if (stationId === 'stove') return this.useStove();
    if (stationId === 'assembly') return this.useAssembly();
    if (stationId === 'window') return this.useWindow();
    if (stationId === 'trash') return this.useTrash();
  }

  grabIngredient(id) {
    const state = this.state;
    const station = stationById('pantry');
    if (!nearStation(this.chef, station)) {
      state.say('Walk up to the pantry first.', 1.5);
      return;
    }
    if (state.hand) {
      state.say('Your hands are full — plate or compost what you carry first.', 2);
      this.sound.error();
      return;
    }
    state.hand = id;
    this.sound.pickup();
    state.say(`${ITEM_LABELS[id]} in hand.`, 1.2);
  }

  useBoard() {
    const state = this.state;
    const board = state.board;
    if (board.item) {
      if (state.hand) { state.say('The board is busy — pick up its item first.', 2); this.sound.error(); return; }
      state.hand = board.item;
      board.item = null;
      board.progress = 0;
      board.working = false;
      this.sound.pickup();
      return;
    }
    if (!state.hand) { state.say('Bring something to chop: tomato, lettuce or onion.', 2); return; }
    if (INGREDIENTS[state.hand]?.needs !== 'chop') {
      state.say(`${ITEM_LABELS[state.hand]} does not need chopping.`, 2);
      this.sound.error();
      return;
    }
    board.item = state.hand;
    board.working = true;
    board.progress = 0;
    state.hand = null;
    this.sound.chop();
    state.say('Chopping…', 1.2);
  }

  useStove() {
    const state = this.state;
    // Pick up a finished (or burnt) patty first.
    const ready = state.stove.find((b) => b.state === 'done' || b.state === 'burnt');
    if (ready && !state.hand) {
      state.hand = ready.item;
      ready.item = null;
      ready.progress = 0;
      ready.state = 'empty';
      this.sound.pickup();
      if (state.hand === 'burntPatty') state.say('Burnt patty — compost it.', 2);
      return;
    }
    if (ready && state.hand) { state.say('Hands full — set something down first.', 2); this.sound.error(); return; }
    const free = state.stove.find((b) => b.state === 'empty');
    if (!free) { state.say('Both burners are busy.', 2); return; }
    if (!state.hand) { state.say('Bring a raw patty to the stove.', 2); return; }
    if (state.hand !== 'patty') {
      state.say('Only a raw patty goes on the stove.', 2);
      this.sound.error();
      return;
    }
    free.item = 'patty';
    free.progress = 0;
    free.state = 'cooking';
    state.hand = null;
    this.sound.place();
    state.say('Patty on the pan — searing…', 1.5);
  }

  useAssembly() {
    const state = this.state;
    if (state.hand === 'plate') {
      // Put the plate back down.
      state.hand = null;
      this.sound.place();
      return;
    }
    if (!state.hand) {
      // Pick the whole plate up to carry it to the window.
      if (state.plate.length === 0) { state.say('The plate is empty — add ingredients first.', 2); return; }
      state.hand = 'plate';
      this.sound.pickup();
      state.say(state.plateReady() ? 'Plate complete — serve it at the window!' : 'Plate in hand — it still needs something.', 2.5);
      return;
    }
    if (state.hand === 'burntPatty') { state.say('Burnt food never goes on a plate. Compost it.', 2); this.sound.error(); return; }
    if (state.plate.includes(state.hand)) {
      state.say(`${ITEM_LABELS[state.hand]} is already on the plate.`, 2);
      this.sound.error();
      return;
    }
    if (state.plate.length >= 4) { state.say('The plate is full.', 2); this.sound.error(); return; }
    state.plate.push(state.hand);
    state.hand = null;
    this.sound.place();
    if (state.plateReady()) {
      state.say('That plate matches an order — serve it!', 2.5);
      this.sound.cookDone();
    }
  }

  useWindow() {
    const state = this.state;
    if (state.hand !== 'plate') { state.say('Bring a finished plate to the window.', 2); return; }
    if (!state.plateReady()) {
      state.say('No ticket matches this plate — check the order board!', 2.5);
      this.sound.error();
      return;
    }
    const result = state.servePlate();
    if (result) {
      this.sound.serve();
      state.toast(`Served ${result.name}! +${result.earned} coins (tip ${result.tip})`, '#ffd166');
    }
  }

  useTrash() {
    const state = this.state;
    if (state.hand === 'plate') {
      state.plate = [];
      state.hand = null;
      this.sound.trash();
      state.say('Plate cleared.', 1.5);
      return;
    }
    if (!state.hand) { state.say('Nothing to compost.', 1.5); return; }
    const item = state.hand;
    state.hand = null;
    this.sound.trash();
    state.say(`${ITEM_LABELS[item]} composted.`, 1.5);
  }
}
