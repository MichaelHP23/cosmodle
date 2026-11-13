import type { CelestialObject } from "../types/celestial"
import type { ProfileEntry } from "../types/game"
import { compareProperty } from "./comparison"
import { getComparableValue } from "./objectProfiles"
import { propertyBracket } from "./formatting"

// The search never offers fewer than this many objects, however tightly the clues pin the answer down.
// A list of one is the answer; a list of five is still a puzzle.
export const MIN_CANDIDATES = 5
// Early on the list is held at this many objects per guess left, so a sharp first hint can't hand the
// player a short list they have more than enough guesses to work through. It tightens as guesses go.
const CANDIDATES_PER_GUESS_LEFT = 2

// How far an object misses a clue. A categorical mismatch counts as one full step, as does a numeric
// value a factor of ten off the answer; an object with no value at all for the property is far off.
const EXACT_MISS = 1
const MISSING_VALUE_MISS = 3
const NUMERIC_MISS_BASE = 0.5

export function minimumCandidates(guessesLeft: number): number {
  return Math.max(MIN_CANDIDATES, guessesLeft * CANDIDATES_PER_GUESS_LEFT)
}

// One fact the player holds about one property of the answer: a test any object passes or fails.
type Constraint = { entry: ProfileEntry; fits: (value: unknown) => boolean }

// Every fact the guesses and hints have established. A guess establishes the colour it came back with
// on every property: an object that would have coloured any tile differently cannot be the answer. A
// hint establishes the answer's value outright on a categorical property and its bracket on a numeric
// one, which is exactly what the panel shows the player.
function buildConstraints(
  profile: ProfileEntry[],
  guesses: CelestialObject[],
  answer: CelestialObject,
  dataset: CelestialObject[],
  hintedProperties: string[]
): Constraint[] {
  const constraints: Constraint[] = []

  for (const entry of profile) {
    const answerValue = getComparableValue(answer, entry.property, dataset)

    for (const guess of guesses) {
      const guessValue = getComparableValue(guess, entry.property, dataset)
      const observed = compareProperty(guessValue, answerValue, entry.kind).status
      constraints.push({ entry, fits: value => compareProperty(guessValue, value, entry.kind).status === observed })
    }

    if (!hintedProperties.includes(entry.property as string)) continue
    const bracket = entry.kind === "exact" ? null : propertyBracket(entry.property, answerValue)
    if (bracket) {
      const [low, high] = bracket
      constraints.push({ entry, fits: value => typeof value === "number" && value >= low && value <= high })
    } else if (entry.kind === "exact") {
      constraints.push({ entry, fits: value => value === answerValue })
    } else {
      constraints.push({
        entry,
        fits: value => compareProperty(value, answerValue, entry.kind).status === "correct",
      })
    }
  }

  return constraints
}

// How far a value sits from the answer's on one property, so the objects mixed back in are the ones
// that come nearest to fitting rather than whatever happens to come first. Numbers are compared by
// order of magnitude where both are positive, since the dataset spans kilometres to light years.
function propertyDistance(entry: ProfileEntry, value: unknown, answerValue: unknown): number {
  if (value === undefined || value === null) return MISSING_VALUE_MISS
  if (entry.kind === "exact" || typeof value !== "number" || typeof answerValue !== "number") return EXACT_MISS
  if (value > 0 && answerValue > 0) return NUMERIC_MISS_BASE + Math.abs(Math.log10(value / answerValue))
  return NUMERIC_MISS_BASE + Math.abs(value - answerValue) / Math.max(Math.abs(value), Math.abs(answerValue), 1)
}

// The objects the search should still offer: everything not yet guessed that fits every clue so far.
// The answer always fits its own clues, so it is never filtered out. When the clues leave fewer than
// the minimum, the objects that come closest to fitting are mixed back in so the list never shrinks to
// a giveaway. Results keep the dataset's own order, so a filler is not marked by its position.
export function narrowCandidates({
  profile,
  guesses,
  answer,
  dataset,
  hintedProperties,
  minCandidates = MIN_CANDIDATES,
}: {
  profile: ProfileEntry[]
  guesses: CelestialObject[]
  answer: CelestialObject
  dataset: CelestialObject[]
  hintedProperties: string[]
  minCandidates?: number
}): CelestialObject[] {
  const guessedIds = new Set(guesses.map(g => g.id))
  const pool = dataset.filter(o => !guessedIds.has(o.id))
  const constraints = buildConstraints(profile, guesses, answer, dataset, hintedProperties)
  if (constraints.length === 0) return pool

  // Each property an object breaks a clue on counts once, however many clues on it it breaks.
  const miss = new Map<string, number>()
  for (const o of pool) {
    let total = 0
    const broken = new Set<ProfileEntry>()
    for (const c of constraints) {
      if (broken.has(c.entry)) continue
      const value = getComparableValue(o, c.entry.property, dataset)
      if (c.fits(value)) continue
      broken.add(c.entry)
      total += propertyDistance(c.entry, value, getComparableValue(answer, c.entry.property, dataset))
    }
    miss.set(o.id, total)
  }

  const fitting = pool.filter(o => miss.get(o.id) === 0)
  if (fitting.length >= minCandidates) return fitting

  // The type is never fudged: once the player knows it is a star, or that it is not a planet, every
  // filler honours that, even if the list ends up shorter than the minimum.
  const typeConstraints = constraints.filter(c => c.entry.property === "category")
  const fillers = pool
    .filter(o => miss.get(o.id)! > 0)
    .filter(o => typeConstraints.every(c => c.fits(getComparableValue(o, "category", dataset))))
    .map((o, index) => ({ o, index }))
    .sort((a, b) => miss.get(a.o.id)! - miss.get(b.o.id)! || a.index - b.index)
    .slice(0, minCandidates - fitting.length)
    .map(d => d.o.id)

  const keep = new Set([...fitting.map(o => o.id), ...fillers])
  return pool.filter(o => keep.has(o.id))
}
