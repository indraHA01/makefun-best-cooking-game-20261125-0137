// Ember Hearth — Render, part 1: the kitchen itself.
// Canvas primitives only: every tile, counter and morsel is drawn in code,
// so the game has no art files and no network request.

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, HUD_HEIGHT, BOARD_X, BOARD_WIDTH,
  KITCHEN_X, KITCHEN_Y, KITCHEN_W, KITCHEN_H, STATIONS, STATION_COLORS,
  INGREDIENTS, ITEM_LABELS, ITEM_COLORS, RECIPES, SHIFT_SECONDS,
} from './config.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// One ingredient, drawn as a little morsel. `r` is its radius.
export function drawIngredient(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  switch (id) {
    case 'bun': {
      ctx.fillStyle = '#c98a3d';
      roundRect(ctx, -r, -r * 0.15, r * 2, r * 0.55, r * 0.25);
      ctx.fill();
      ctx.fillStyle = '#f2c078';
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 0.95, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      for (const [dx, dy] of [[-0.45, -0.55], [0, -0.75], [0.45, -0.5], [-0.2, -0.35], [0.25, -0.3]]) {
        ctx.beginPath();
        ctx.ellipse(dx * r, dy * r, r * 0.12, r * 0.07, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'patty':
    case 'cookedPatty':
    case 'burntPatty': {
      ctx.fillStyle = id === 'cookedPatty' ? '#6e3418' : id === 'burntPatty' ? '#241a14' : '#b0613f';
      roundRect(ctx, -r, -r * 0.45, r * 2, r * 0.9, r * 0.4);
      ctx.fill();
      if (id === 'cookedPatty') {
        ctx.strokeStyle = '#3d1e0e';
        ctx.lineWidth = r * 0.12;
        for (const dx of [-0.5, 0, 0.5]) {
          ctx.beginPath();
          ctx.moveTo(dx * r, -r * 0.35);
          ctx.lineTo(dx * r, r * 0.35);
          ctx.stroke();
        }
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.moveTo(-r, -r * 0.7);
      ctx.lineTo(r, -r * 0.7);
      ctx.lineTo(r, r * 0.4);
      ctx.lineTo(0, r * 0.85);
      ctx.lineTo(-r, r * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e0a92e';
      for (const [dx, dy] of [[-0.4, -0.2], [0.35, -0.1], [0, 0.25]]) {
        ctx.beginPath();
        ctx.arc(dx * r, dy * r, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'tomato':
    case 'choppedTomato': {
      ctx.fillStyle = id === 'tomato' ? '#e4572e' : '#ff6b4a';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb199';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd9c9';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
      if (id === 'choppedTomato') {
        ctx.strokeStyle = '#c23c17';
        ctx.lineWidth = r * 0.1;
        ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.6, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -r * 0.6); ctx.lineTo(0, r * 0.6); ctx.stroke();
      }
      break;
    }
    case 'lettuce':
    case 'choppedLettuce': {
      ctx.fillStyle = id === 'lettuce' ? '#5da338' : '#8fd45e';
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * r * 0.45, Math.sin(angle) * r * 0.45, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#a8e07e';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'onion':
    case 'choppedOnion': {
      ctx.fillStyle = '#efe6fa';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b39ddb';
      ctx.lineWidth = r * 0.12;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.stroke();
      if (id === 'choppedOnion') {
        ctx.strokeStyle = '#b39ddb';
        ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.stroke();
      }
      break;
    }
    default: {
      ctx.fillStyle = ITEM_COLORS[id] || '#cccccc';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawFloor(ctx) {
  ctx.fillStyle = '#b98a5a';
  ctx.fillRect(KITCHEN_X, KITCHEN_Y, KITCHEN_W, KITCHEN_H);
  const tile = 48;
  for (let ty = 0; ty < KITCHEN_H / tile; ty++) {
    for (let tx = 0; tx < KITCHEN_W / tile; tx++) {
      if ((tx + ty) % 2 === 0) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(KITCHEN_X + tx * tile, KITCHEN_Y + ty * tile, tile, tile);
    }
  }
  // Warm rug in the middle of the kitchen floor.
  ctx.fillStyle = '#a34d2d';
  roundRect(ctx, KITCHEN_X + 330, KITCHEN_Y + 230, 320, 180, 18);
  ctx.fill();
  ctx.strokeStyle = '#e8b04b';
  ctx.lineWidth = 4;
  roundRect(ctx, KITCHEN_X + 344, KITCHEN_Y + 244, 292, 152, 12);
  ctx.stroke();
}

function drawPantry(ctx, station, state) {
  ctx.fillStyle = STATION_COLORS.pantry;
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  ctx.fillStyle = '#6d4420';
  ctx.fillRect(station.x, station.y + station.h - 12, station.w, 12);
  const ids = Object.keys(INGREDIENTS);
  const binW = station.w / ids.length;
  ids.forEach((id, i) => {
    const cx = station.x + binW * (i + 0.5);
    const cy = station.y + 34;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, cx - binW / 2 + 4, station.y + 6, binW - 8, station.h - 20, 6);
    ctx.fill();
    drawIngredient(ctx, id, cx, cy, 15);
    text(ctx, INGREDIENTS[id].key, cx, station.y + station.h - 20, 11, '#ffe9c4', 'center');
  });
  text(ctx, station.label, station.x + 8, station.y - 12, 12, '#f5e6c8');
}

function drawBoard(ctx, station, state) {
  const board = state.board;
  ctx.fillStyle = STATION_COLORS.board;
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  ctx.fillStyle = '#e8c48f';
  roundRect(ctx, station.x + 10, station.y + 10, station.w - 20, station.h - 20, 6);
  ctx.fill();
  if (board.item) {
    drawIngredient(ctx, board.item, station.x + station.w / 2 - 18, station.y + station.h / 2, 20);
    if (board.working) {
      // Chopping progress ring.
      const frac = board.progress / 2.5;
      ctx.strokeStyle = '#2e6f5e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(station.x + station.w / 2 - 18, station.y + station.h / 2, 28, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      text(ctx, 'CHOP!', station.x + station.w / 2 + 34, station.y + station.h / 2, 13, '#5a3a1a', 'center');
    } else {
      text(ctx, ITEM_LABELS[board.item], station.x + station.w / 2 + 40, station.y + station.h / 2, 11, '#5a3a1a', 'center');
    }
  }
  // The knife, resting on the board.
  ctx.save();
  ctx.translate(station.x + station.w - 34, station.y + 22);
  ctx.rotate(0.5);
  ctx.fillStyle = '#cfd6dd';
  roundRect(ctx, -16, -4, 32, 8, 3);
  ctx.fill();
  ctx.fillStyle = '#4a3220';
  roundRect(ctx, 14, -4, 14, 8, 3);
  ctx.fill();
  ctx.restore();
  text(ctx, station.label, station.x + 8, station.y - 12, 12, '#f5e6c8');
}

function drawStove(ctx, station, state) {
  ctx.fillStyle = STATION_COLORS.stove;
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  const burnerW = station.w / 2;
  state.stove.forEach((burner, i) => {
    const cx = station.x + burnerW * (i + 0.5);
    const cy = station.y + station.h / 2 + 4;
    // Burner ring.
    ctx.fillStyle = '#1d1d26';
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    if (burner.state === 'cooking') {
      ctx.fillStyle = 'rgba(255,120,40,0.55)';
      ctx.beginPath();
      ctx.arc(cx, cy, 30 + Math.sin(Date.now() / 90) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // The pan.
    ctx.fillStyle = '#22222c';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3a48';
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fill();
    if (burner.item) {
      drawIngredient(ctx, burner.item, cx, cy, 17);
      const frac = burner.state === 'cooking'
        ? burner.progress / 5
        : burner.state === 'done' ? (burner.progress - 5) / 5 : 1;
      ctx.strokeStyle = burner.state === 'burnt' ? '#ff4444' : burner.state === 'done' ? '#7bc950' : '#ff9f1c';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 32, -Math.PI / 2, -Math.PI / 2 + Math.min(1, Math.max(0, frac)) * Math.PI * 2);
      ctx.stroke();
      if (burner.state === 'done') text(ctx, 'READY!', cx, cy - 42, 12, '#8fd45e', 'center');
      if (burner.state === 'burnt') text(ctx, 'BURNT!', cx, cy - 42, 12, '#ff6b6b', 'center');
    } else {
      text(ctx, 'PAN', cx, cy, 11, '#777788', 'center');
    }
  });
  text(ctx, station.label, station.x + 8, station.y - 12, 12, '#f5e6c8');
}

function drawAssembly(ctx, station, state) {
  ctx.fillStyle = STATION_COLORS.assembly;
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#b8a888';
  ctx.lineWidth = 2;
  roundRect(ctx, station.x + 4, station.y + 4, station.w - 8, station.h - 8, 8);
  ctx.stroke();
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2;
  // The plate.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 86, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9bfa8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 86, 34, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (state.plate.length === 0) {
    text(ctx, 'Build a dish here', cx, cy, 13, '#a89a7e', 'center');
  } else {
    // Ingredients stacked on the plate, left to right.
    const n = state.plate.length;
    state.plate.forEach((item, i) => {
      drawIngredient(ctx, item, cx - ((n - 1) * 34) / 2 + i * 34, cy - 4, 16);
    });
    if (state.plateReady()) {
      ctx.strokeStyle = '#7bc950';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 94, 40, 0, 0, Math.PI * 2);
      ctx.stroke();
      text(ctx, 'READY TO SERVE!', cx, cy + 52, 14, '#2e6f5e', 'center');
    }
  }
  text(ctx, station.label, station.x + 8, station.y - 12, 12, '#f5e6c8');
}

function drawWindow(ctx, station, state) {
  ctx.fillStyle = STATION_COLORS.window;
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  ctx.fillStyle = '#1d4a3e';
  roundRect(ctx, station.x + 8, station.y + 8, station.w - 16, 54, 6);
  ctx.fill();
  text(ctx, 'SERVE', station.x + station.w / 2, station.y + 36, 16, '#ffe9c4', 'center');
  // A bell on the counter, and a tray waiting for the next plate.
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.arc(station.x + station.w / 2, station.y + 96, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(station.x + station.w / 2 - 18, station.y + 96, 36, 4);
  ctx.fillStyle = '#d8d2c2';
  roundRect(ctx, station.x + 16, station.y + 122, station.w - 32, 40, 6);
  ctx.fill();
  text(ctx, station.label, station.x + station.w / 2, station.y + station.h + 14, 12, '#f5e6c8', 'center');
}

function drawTrash(ctx, station, state) {
  ctx.fillStyle = STATION_COLORS.trash;
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  ctx.fillStyle = '#3d5a34';
  roundRect(ctx, station.x + 14, station.y + 14, station.w - 28, station.h - 28, 8);
  ctx.fill();
  text(ctx, '♻', station.x + station.w / 2, station.y + station.h / 2 - 8, 26, '#cfe8b8', 'center');
  text(ctx, station.label, station.x + station.w / 2, station.y + station.h - 12, 11, '#d8e8c8', 'center');
}

function drawOrderBoard(ctx, state) {
  // The chalkboard.
  ctx.fillStyle = '#2b2b33';
  roundRect(ctx, BOARD_X, HUD_HEIGHT + 8, BOARD_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT - 16, 12);
  ctx.fill();
  ctx.strokeStyle = '#c98f4e';
  ctx.lineWidth = 3;
  roundRect(ctx, BOARD_X + 4, HUD_HEIGHT + 12, BOARD_WIDTH - 8, CANVAS_HEIGHT - HUD_HEIGHT - 24, 9);
  ctx.stroke();
  text(ctx, '— ORDER BOARD —', BOARD_X + BOARD_WIDTH / 2, HUD_HEIGHT + 34, 16, '#ffe9c4', 'center');
  text(ctx, `${state.orders.length} ticket${state.orders.length === 1 ? '' : 's'} waiting`, BOARD_X + BOARD_WIDTH / 2, HUD_HEIGHT + 58, 12, '#b8b0a0', 'center');

  if (state.orders.length === 0) {
    if (state.phase === 'over') {
      text(ctx, 'Shift over —', BOARD_X + BOARD_WIDTH / 2, HUD_HEIGHT + 140, 14, '#8a8272', 'center');
      text(ctx, 'well cooked!', BOARD_X + BOARD_WIDTH / 2, HUD_HEIGHT + 164, 14, '#8a8272', 'center');
    } else {
      text(ctx, 'No orders yet…', BOARD_X + BOARD_WIDTH / 2, HUD_HEIGHT + 140, 14, '#8a8272', 'center');
      text(ctx, 'The lunch crowd', BOARD_X + BOARD_WIDTH / 2, HUD_HEIGHT + 164, 12, '#8a8272', 'center');
      text(ctx, 'is on its way!', BOARD_X + BOARD_WIDTH / 2, HUD_HEIGHT + 182, 12, '#8a8272', 'center');
    }
  }

  state.orders.forEach((order, i) => {
    const recipe = RECIPES.find((r) => r.id === order.recipeId);
    const y = HUD_HEIGHT + 78 + i * 128;
    const frac = Math.max(0, order.patience / order.maxPatience);
    const urgent = frac < 0.35;
    // Ticket card.
    ctx.fillStyle = urgent ? '#fff0e0' : '#fff8e8';
    roundRect(ctx, BOARD_X + 14, y, BOARD_WIDTH - 28, 116, 8);
    ctx.fill();
    if (urgent) {
      ctx.strokeStyle = '#e4572e';
      ctx.lineWidth = 3;
      roundRect(ctx, BOARD_X + 14, y, BOARD_WIDTH - 28, 116, 8);
      ctx.stroke();
    }
    ctx.fillStyle = recipe.color;
    ctx.fillRect(BOARD_X + 14, y, 8, 116);
    text(ctx, `#${order.id}  ${recipe.name}`, BOARD_X + 34, y + 18, 15, '#33302a');
    // The recipe, as little morsels with names.
    recipe.items.forEach((item, j) => {
      const ix = BOARD_X + 44 + j * 52;
      drawIngredient(ctx, item, ix, y + 52, 15);
      text(ctx, ITEM_LABELS[item].split(' ')[0], ix, y + 82, 9, '#6a6258', 'center');
    });
    // Patience bar.
    ctx.fillStyle = '#e8e0d0';
    roundRect(ctx, BOARD_X + 34, y + 96, BOARD_WIDTH - 68, 10, 5);
    ctx.fill();
    ctx.fillStyle = urgent ? '#e4572e' : frac < 0.6 ? '#f7b731' : '#7bc950';
    roundRect(ctx, BOARD_X + 34, y + 96, (BOARD_WIDTH - 68) * frac, 10, 5);
    ctx.fill();
    text(ctx, `${Math.ceil(order.patience)}s`, BOARD_X + BOARD_WIDTH - 40, y + 18, 13, urgent ? '#e4572e' : '#6a6258', 'right');
  });

  // The menu, pinned under the tickets: what the kitchen can cook.
  const menuY = CANVAS_HEIGHT - 128;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(ctx, BOARD_X + 10, menuY, BOARD_WIDTH - 20, 112, 8);
  ctx.fill();
  text(ctx, 'MENU', BOARD_X + BOARD_WIDTH / 2, menuY + 16, 12, '#ffe9c4', 'center');
  RECIPES.forEach((recipe, i) => {
    const locked = state.elapsed < recipe.unlockAt;
    text(
      ctx,
      `${locked ? '🔒 ' : ''}${recipe.name} — ${recipe.base}c`,
      BOARD_X + 24,
      menuY + 38 + i * 19,
      12,
      locked ? '#8a8272' : '#f5e6c8',
    );
  });
}

function drawChef(ctx, world, state) {
  const chef = world.chef;
  const bob = chef.moving ? Math.sin(world.walkBob) * 2 : 0;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(chef.x, chef.y + 18, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white apron, red scarf.
  ctx.fillStyle = '#f5f2ea';
  ctx.beginPath();
  ctx.arc(chef.x, chef.y + 6 + bob * 0.4, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e4572e';
  ctx.fillRect(chef.x - 18, chef.y - 2 + bob * 0.4, 36, 6);
  // Head.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(chef.x, chef.y - 16 + bob * 0.4, 13, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(chef.x - 8, chef.y - 28 + bob * 0.4, 7, 0, Math.PI * 2);
  ctx.arc(chef.x, chef.y - 32 + bob * 0.4, 8, 0, Math.PI * 2);
  ctx.arc(chef.x + 8, chef.y - 28 + bob * 0.4, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(chef.x - 11, chef.y - 28 + bob * 0.4, 22, 6);
  // Eyes look where the chef faces.
  const look = { up: [0, -2], down: [0, 2], left: [-3, 0], right: [3, 0] }[chef.facing];
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.arc(chef.x - 5 + look[0], chef.y - 16 + look[1] + bob * 0.4, 1.8, 0, Math.PI * 2);
  ctx.arc(chef.x + 5 + look[0], chef.y - 16 + look[1] + bob * 0.4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // What the chef carries, held high.
  if (state.hand && state.hand !== 'plate') {
    drawIngredient(ctx, state.hand, chef.x, chef.y - 48 + bob * 0.4, 13);
  } else if (state.hand === 'plate') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(chef.x, chef.y - 48 + bob * 0.4, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    state.plate.forEach((item, i) => {
      drawIngredient(ctx, item, chef.x - ((state.plate.length - 1) * 12) / 2 + i * 12, chef.y - 52 + bob * 0.4, 7);
    });
  }
  text(ctx, 'YOU', chef.x, chef.y + 34, 10, '#fff3d6', 'center');
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#23232c';
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = '#c98f4e';
  ctx.fillRect(0, HUD_HEIGHT - 4, CANVAS_WIDTH, 4);
  text(ctx, '🔥 EMBER HEARTH', 16, HUD_HEIGHT / 2 - 8, 20, '#ffd166');
  text(ctx, 'Sizzle & Serve', 16, HUD_HEIGHT / 2 + 16, 12, '#b8b0a0');

  // Shift timer, centre: a bar you can feel draining.
  const frac = state.timeLeft / SHIFT_SECONDS;
  const cx = CANVAS_WIDTH / 2;
  ctx.fillStyle = '#3a3a48';
  roundRect(ctx, cx - 190, 14, 380, 22, 11);
  ctx.fill();
  ctx.fillStyle = state.rushing ? '#e4572e' : frac < 0.3 ? '#f7b731' : '#7bc950';
  if (frac > 0) roundRect(ctx, cx - 190, 14, 380 * frac, 22, 11);
  ctx.fill();
  const mins = Math.floor(state.timeLeft / 60);
  const secs = Math.floor(state.timeLeft % 60);
  text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, cx, 25, 15, '#ffffff', 'center');
  text(ctx, state.rushing ? 'RUSH HOUR!' : 'SHIFT', cx, 48, 11, state.rushing ? '#ff8a7a' : '#b8b0a0', 'center');

  // Coins, served count, hearts, right.
  text(ctx, `🪙 ${state.coins}`, CANVAS_WIDTH - 300, HUD_HEIGHT / 2 - 8, 18, '#ffd166', 'right');
  text(ctx, `served ${state.served}`, CANVAS_WIDTH - 300, HUD_HEIGHT / 2 + 16, 11, '#b8b0a0', 'right');
  const hearts = '♥'.repeat(state.hearts) + '♡'.repeat(Math.max(0, 3 - state.hearts));
  text(ctx, hearts, CANVAS_WIDTH - 150, HUD_HEIGHT / 2 - 8, 20, '#ff6b6b', 'right');
  text(ctx, 'P pause · M mute', CANVAS_WIDTH - 150, HUD_HEIGHT / 2 + 16, 11, '#b8b0a0', 'right');
}

function drawToasts(ctx, state) {
  // Toasts float over the open floor between the pantry and the board,
  // never over a station label.
  state.toasts.forEach((toast, i) => {
    const alpha = Math.min(1, toast.life);
    ctx.globalAlpha = alpha;
    text(ctx, toast.text, CANVAS_WIDTH / 2, 196 + i * 24 - toast.y, 15, toast.color, 'center');
    ctx.globalAlpha = 1;
  });
  if (state.messageTimer > 0) {
    ctx.fillStyle = 'rgba(20,20,28,0.85)';
    const w = ctx.measureText(state.message).width + 40;
    roundRect(ctx, CANVAS_WIDTH / 2 - 320, CANVAS_HEIGHT - 44, 640, 32, 16);
    ctx.fill();
    text(ctx, state.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 28, 14, '#ffe9c4', 'center');
  }
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(20,16,12,0.72)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#fff8e8';
  roundRect(ctx, 290, 110, 700, 500, 18);
  ctx.fill();
  text(ctx, '🔥 EMBER HEARTH 🔥', 640, 158, 40, '#e4572e', 'center');
  text(ctx, 'Sizzle & Serve — a one-chef lunch rush', 640, 196, 17, '#6a6258', 'center');
  const lines = [
    'Tickets land on the ORDER BOARD — each one names a dish and a timer.',
    'Grab ingredients at the PANTRY (keys 1–6 or click a bin).',
    'Chop veg on the BOARD, sear patties on the STOVE — don’t let them burn!',
    'Build the dish on the ASSEMBLY plate, then carry it to the SERVING WINDOW.',
    'Serve fast for tips. Three lost tickets end the shift. 3 minutes. Go!',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 238 + i * 28, 15, '#33302a', 'center'));
  text(ctx, 'Move: WASD / arrows / click   ·   Use: E or Space   ·   Pause: P', 640, 408, 14, '#6a6258', 'center');
  // Start button.
  ctx.fillStyle = '#e4572e';
  roundRect(ctx, 520, 440, 240, 56, 12);
  ctx.fill();
  text(ctx, 'START SHIFT  ▶', 640, 469, 20, '#ffffff', 'center');
  text(ctx, 'or press Enter', 640, 522, 12, '#8a8272', 'center');
  text(ctx, 'An original game — drawn and scored in code, no borrowed art.', 640, 580, 12, '#8a8272', 'center');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(20,16,12,0.78)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#fff8e8';
  roundRect(ctx, 340, 130, 600, 440, 18);
  ctx.fill();
  const title = state.hearts <= 0 ? 'SHIFT OVER — the crowd walked out!' : 'SHIFT COMPLETE!';
  text(ctx, title, 640, 180, 28, '#e4572e', 'center');
  const stars = '★'.repeat(state.stars) + '☆'.repeat(3 - state.stars);
  text(ctx, stars, 640, 232, 44, '#f7b731', 'center');
  text(ctx, `Coins earned: ${state.coins}`, 640, 296, 20, '#33302a', 'center');
  text(ctx, `Dishes served: ${state.served}   ·   Tickets lost: ${state.expired}`, 640, 330, 15, '#6a6258', 'center');
  const verdict = state.stars === 3
    ? 'Three stars — the Ember Hearth has a new head chef!'
    : state.stars === 2
      ? 'Two stars — the lunch crowd is talking about you.'
      : state.stars === 1
        ? 'One star — the kitchen survived. Barely.'
        : 'No stars this time — the tickets beat you. Run it back!';
  text(ctx, verdict, 640, 368, 15, '#33302a', 'center');
  ctx.fillStyle = '#2e6f5e';
  roundRect(ctx, 520, 410, 240, 56, 12);
  ctx.fill();
  text(ctx, 'COOK AGAIN  ↻', 640, 439, 20, '#ffffff', 'center');
  text(ctx, 'press R to restart', 640, 502, 12, '#8a8272', 'center');
}

export function draw(ctx, state, world) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Warm kitchen backdrop.
  ctx.fillStyle = '#7a4a26';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawFloor(ctx);
  drawHud(ctx, state);
  drawOrderBoard(ctx, state);
  for (const station of STATIONS) {
    if (station.id === 'pantry') drawPantry(ctx, station, state);
    else if (station.id === 'board') drawBoard(ctx, station, state);
    else if (station.id === 'stove') drawStove(ctx, station, state);
    else if (station.id === 'assembly') drawAssembly(ctx, station, state);
    else if (station.id === 'window') drawWindow(ctx, station, state);
    else if (station.id === 'trash') drawTrash(ctx, station, state);
  }
  if (state.phase !== 'over') drawChef(ctx, world, state);
  drawToasts(ctx, state);
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(228,87,46,${Math.min(0.3, state.flash * 0.4)})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  if (state.phase === 'title') drawTitle(ctx, state);
  if (state.phase === 'paused') {
    ctx.fillStyle = 'rgba(20,16,12,0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    text(ctx, 'PAUSED', 640, 340, 44, '#ffffff', 'center');
    text(ctx, 'press P to keep cooking', 640, 390, 16, '#ffe9c4', 'center');
  }
  if (state.phase === 'over') drawGameOver(ctx, state);
}
