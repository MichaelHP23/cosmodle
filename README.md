# Cosmodle 🌌

Wordle, but the answer is a planet, moon, star, galaxy, or anything else floating around in space.

## What it actually is

Every day there's one mystery celestial object. You guess other celestial objects to try to find it. After each guess, the game compares your guess to the mystery object across a handful of properties (distance from Earth or the Sun, size, temperature, number of moons, etc.) and shows you how close you got on each one. Use those clues to narrow it down. You get 7 guesses.

That's it. No astronomy degree required, just paying attention to whether your last guess was too hot, too big, or too far away.

## How to play

1. Search for and pick any celestial object as your guess.
2. Each property gets a colored square:
   - 🟩 **Correct** — exact match (or close enough: within 2% for numbers, 3°C for temperature)
   - 🟨 **Close** — within 15% for numbers, or within 25°C for temperature
   - 🔺/🔻 **Higher / Lower** — the real answer's value is above or below your guess
   - 🟥 **Incorrect** — not a match
   - **N/A** — that property doesn't apply to one of the two objects (a star doesn't have rings, for instance)
3. Guess again using those clues. You've got 7 tries to land on the exact object.
4. Stuck? Hit **Hint** to reveal one of the answer's real properties, up to 3 per puzzle. Using all 3 and still winning still counts as a win, but it won't extend your streak.

## Modes

- **Daily** — one puzzle a day, same for every player. Wins and losses count toward your Played / Win % / Streak stats.
- **Practice** — unlimited random rounds whenever you want. Doesn't touch your stats.
- **Archive** — go back and play any past daily puzzle you missed.

Stats and puzzle progress are stored locally in your browser (no account, no server) — clearing your browser data resets them.

## Tech stack

React + TypeScript + Vite, styled with Tailwind CSS. Tests run on Vitest.

## Development

```bash
npm install
npm run dev      # local dev server
npm run test     # run the test suite
npm run build    # typecheck + production build
npm run lint     # oxlint
```
