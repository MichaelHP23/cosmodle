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

No account or login is ever required. Your identity is just a random id stored in your browser, and your stats sync to a server under that id, so they survive a cleared cache or a new device.

## Tech stack

React + TypeScript + Vite, styled with Tailwind CSS, backed by Cloudflare Pages Functions + D1. Tests run on Vitest.

## Database schema

The D1 migrations are deliberately **not** tracked in this repository, so a fresh clone cannot
provision the database from `wrangler d1 migrations apply` and has to create the table by hand. The
whole schema is one table, recorded here so it is not lost with the working copy:

```sql
CREATE TABLE results (
  uuid TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  won INTEGER NOT NULL,
  guess_count INTEGER NOT NULL,
  hints_used INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  gave_up INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (uuid, day_number)
);
```

`gave_up` arrived after the table did, so an existing database needs
`ALTER TABLE results ADD COLUMN gave_up INTEGER NOT NULL DEFAULT 0;` rather than the full CREATE.

## Advertising

There is one ad slot, below the guess table and above the footer. It is off by default and stays off
until the environment variables in `.env.example` are filled in, so a build without them contains no
Google script, makes no ad request, and renders the slot as an empty reserved box.

The two variables are set at different points, because AdSense issues the publisher id at sign-up
but the ad unit only exists after the site is approved:

1. On sign-up, set `VITE_ADSENSE_CLIENT` to the publisher id, `ca-pub-` plus sixteen digits, and
   redeploy. That puts the tag in the page and publishes `ads.txt`, which is how Google verifies the
   site for review. With no `VITE_ADSENSE_SLOT` yet, nothing renders and no ad is requested.
2. On approval, create a display ad unit and set `VITE_ADSENSE_SLOT` to its `data-ad-slot` value.
   Ads start serving on the next deploy.

Both have to be set as build environment variables on the Cloudflare Pages project, not only in a
local `.env`, since they are baked in at build time rather than read by the browser.

Consent is handled by Google Funding Choices, Google's own certified CMP, which the app loads for the
same publisher id just before the AdSense tag. It is configured in the AdSense UI (Privacy and
messaging), not in this repository, so the message text, regions, and vendor list are changed there
and take effect without a deploy. There is deliberately no second cookie banner in the app.
`src/lib/consent.ts` records our own first-party preference and has nothing to do with ads.

The reserved height of the slot exists before anything loads and does not change when an ad arrives,
so enabling advertising causes no layout shift.

## Generated pages

`npm run build` ends by running `scripts/generate-archive.mjs`, which writes static HTML into
`dist/` from the dataset: a page per object under `/objects/`, the played-days list at `/archive/`,
plus `/about.html`, `/privacy.html`, `sitemap.xml` and `robots.txt`. These exist so the site has
crawlable content of its own; the game itself is a single page and shows search engines nothing.

Two rules the script keeps, both covered by `scripts/generate-archive.test.mjs`:

- No page may name the answer for today or any later scheduled day.
- Only categories listed in `PUBLISHED_CATEGORIES` get a page, because a generated page states its
  figures as fact. That is currently planets, dwarf planets, asteroids, comets, stars and exoplanets,
  the ones the `verify:` scripts cover. Add a category once its figures have been checked against a
  catalogue and its pages, index entries and sitemap URLs follow.

The pages are regenerated per build, so the archive only grows on deploy.

## Development

```bash
npm install
npm run dev      # local dev server
npm run dev:api  # local dev server plus the Functions/D1 backend (via wrangler)
npm run test     # run the test suite
npm run build    # typecheck + production build
npm run lint     # oxlint
```
