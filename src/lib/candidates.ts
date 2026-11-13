import type { CelestialObject } from "../types/celestial"
import type { ProfileEntry } from "../types/game"
import { compareProperty } from "./comparison"
import { getComparableValue } from "./objectProfiles"
import { propertyBracket } from "./formatting"

// Below this many objects the search would all but name the answer, so it is topped up with the
// nearest misses instead. A list of one is the answer; a list of five is still a puzzle.
export const MIN_CANDIDATES = 5

// One fact the player holds about the answer. Each one is a test any object either passes or fails.
type Constraint = (object: CelestialObject) => boolean

// Every fact the guesses and hints have established, as tests. A guess establishes the colour it came
// back with on every property: an object that would have coloured any tile differently cannot be the
// answer. A hint establishes the answer's value outright on a categorical property and its bracket on
// a numeric one, which is exactly what the panel shows the player.
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
      constraints.push(
        o => compareProperty(guessValue, getComparableValue(o, entry.property, dataset), entry.kind).status === observed
      )
    }

    if (!hintedProperties.includes(entry.property as string)) continue
    const bracket = entry.kind === "exact" ? null : propertyBracket(entry.property, answerValue)
    if (bracket) {
      const [low, high] = bracket
      constraints.push(o => {
        const value = getComparableValue(o, entry.property, dataset)
        return typeof value === "number" && value >= low && value <= high
      })
    } else {
      constraints.push(o => {
        const value = getComparableValue(o, entry.property, dataset)
        return entry.kind === "exact"
          ? value === answerValue
          : compareProperty(value, answerValue, entry.kind).status === "correct"
      })
    }
  }

  return constraints
}

// The objects the search should still offer: everything not yet guessed that fits every clue so far.
// The answer always fits its own clues, so it is never filtered out. When the clues have whittled the
// field down to a handful, the closest misses (fewest clues broken) are mixed back in so the list never
// shrinks to a giveaway. Results keep the dataset's own order, so a decoy is not marked by its position.
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

  const misses = new Map(pool.map(o => [o.id, constraints.filter(fits => !fits(o)).length]))
  const fitting = pool.filter(o => misses.get(o.id) === 0)
  if (fitting.length >= minCandidates) return fitting

  // Nearest misses first; ties broken by preferring the answer's own category, so the decoys look like
  // plausible answers rather than obvious filler, then by dataset order to keep the list stable.
  const decoys = pool
    .filter(o => misses.get(o.id)! > 0)
    .map((o, index) => ({ o, index }))
    .sort(
      (a, b) =>
        misses.get(a.o.id)! - misses.get(b.o.id)! ||
        Number(b.o.category === answer.category) - Number(a.o.category === answer.category) ||
        a.index - b.index
    )
    .slice(0, minCandidates - fitting.length)
    .map(d => d.o.id)

  const keep = new Set([...fitting.map(o => o.id), ...decoys])
  return pool.filter(o => keep.has(o.id))
}
