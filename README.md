[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/indraHA01/makefun-best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/indraHA01/makefun-best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# 🔥 Ember Hearth — Sizzle & Serve

**Ember Hearth** is an original cooking game built for the [make.fun](https://make.fun/bounty/best-cooking-game-20261125-0137) **best-cooking-game-20261125-0137** bounty ("Make the best cooking game"). It plays offline in desktop Chrome from static files — no build step, no network request, no library. Every pixel is drawn in code (canvas primitives only) and every sound is synthesized with WebAudio: no borrowed art, no copied levels, no commercial characters.

You are the only chef in a small hearth kitchen on the busiest lunch shift of the year. Tickets land on the order board, each naming a dish and a countdown. Run the route — pantry, chopping board, stove, assembly plate, serving window — and get every plate out before its ticket burns.

## How to play

- **Move:** WASD / arrow keys, or click anywhere to walk there. Click a station to walk to it and use it.
- **Pantry:** press **1–6** or click a bin to grab an ingredient (bun, patty, cheese, tomato, lettuce, onion).
- **Chopping board:** put tomato, lettuce or onion on it — it chops itself in 2.5 seconds. Pick the chopped veg up with **E**.
- **Stove:** sear a raw patty (5 seconds to perfect, burns at 10). Two burners, so plan ahead.
- **Assembly plate:** stack ingredients on the plate. When the plate matches an open ticket exactly, it glows green: **READY TO SERVE!**
- **Serving window:** carry the finished plate there and press **E**. Serve fast for a tip — up to +15 coins.
- **Compost:** burnt food and mistakes go in the green bin.
- **P / M:** pause / mute. **R:** cook again after the shift ends.

## The menu

| Dish | Needs | Pays |
| --- | --- | --- |
| Ember Burger | bun + seared patty + cheese + chopped lettuce | 25c + tip |
| Garden Bowl | chopped tomato + chopped lettuce + chopped onion | 20c + tip |
| Melt Toast | bun + cheese + chopped tomato | 18c + tip |
| Sunrise Stack | bun + seared patty + chopped onion + cheese | 30c + tip (unlocks 60s in) |

## The shift

- **3 minutes** on the clock, shown as a draining bar you can feel.
- Tickets arrive every ~18 seconds (every ~12 in the **rush hour**, the last 30 seconds).
- Each ticket gives you 80 seconds. Lose three tickets and the crowd walks out — the shift ends early.
- Score is coins: **50+** earns one star, **100+** two, **150+** three.

## Feel and polish

- A patty sizzles (filtered noise, looped while anything cooks) and dings when it is seared; chops thock, serves chime, mistakes buzz.
- The order board shows every ticket's patience draining in real time; an impatient ticket turns red.
- Floating `+coins` toasts, a red flash when a ticket is lost, and a rush-hour announcement when the last 30 seconds hit.
- Keyboard and mouse play the same game: click-to-walk with auto-use on arrival, or pure keyboard.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshot scenes are staged through the same code the player runs:

```sh
node serve.ts
# http://localhost:8080/?shot=start  — title screen, one ticket waiting
# http://localhost:8080/?shot=play   — mid-service: three tickets, a dish mid-assembly
# http://localhost:8080/?shot=end    — shift complete, three stars
```

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/index.html` — the page; loads the game as ES modules.
- `game/src/config.js` — constants, ingredients, recipes, stations, seeded RNG.
- `game/src/audio.js` — WebAudio sound synthesis (sizzle, chops, chimes).
- `game/src/input.js` — keyboard + mouse, in canvas coordinates.
- `game/src/state.js` — the shift: orders, plate, stove, board, coins, hearts.
- `game/src/world.js` — the chef, collisions, and every station interaction.
- `game/src/render.js` — all canvas drawing: kitchen, food, HUD, overlays.
- `game/src/shots.js` — screenshot scenes (`?shot=start|play|end`).
- `game/src/main.js` — the game loop and phase glue.
