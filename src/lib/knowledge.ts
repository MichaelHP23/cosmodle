import type { CelestialObject } from "../types/celestial"
import type { ComparisonStatus, ProfileEntry } from "../types/game"
import { compareProperty } from "./comparison"
import { getComparableValue } from "./objectProfiles"
import { formatPropertyValue, joinRange, propertyBracket } from "./formatting"

// How firmly a property has been pinned down. "locked" is a value the guesses have actually matched,
// "narrowed" is a bound or an exclusion, "unknown" is a property no guess has said anything about.
export type KnowledgeState = "locked" | "narrowed" | "unknown"

export type PropertyKnowledge = {
  property: string
  label: string
  state: KnowledgeState
  display: string
}

const UNKNOWN_DISPLAY = "—"
// Enough exclusions to be useful without the row growing past the width of a phone.
const MAX_EXCLUSIONS_SHOWN = 2

type Observation = { value: unknown; status: ComparisonStatus }

// A numeric guess that came back "higher" proves the answer sits above it, and "lower" proves it sits
// below, so the tightest pair of those is everything the player has been told. "correct" is a match
// only to within the comparator's tolerance, which is why it reads as "about" rather than as the
// answer's own value, and "close" carries no direction so it can only ever be a neighbourhood.
function describeNumeric(
  property: string,
  observations: Observation[],
  hintBracket: [number, number] | null
): { state: KnowledgeState; display: string } {
  const match = observations.find(o => o.status === "correct")
  if (match) return { state: "locked", display: `about ${formatPropertyValue(property, match.value)}` }

  const above = observations.filter(o => o.status === "higher").map(o => o.value as number)
  const below = observations.filter(o => o.status === "lower").map(o => o.value as number)
  // A hint's bracket is a bound like any other, so it is folded in with the guesses rather than being
  // shown separately. Whichever source is tighter at each end wins, which is what the player actually
  // knows once they hold both facts at once.
  if (hintBracket) {
    above.push(hintBracket[0])
    below.push(hintBracket[1])
  }
  const low = above.length > 0 ? Math.max(...above) : undefined
  const high = below.length > 0 ? Math.min(...below) : undefined

  if (low !== undefined && high !== undefined && low < high) {
    return { state: "narrowed", display: joinRange(property, low, high) }
  }
  if (low !== undefined) return { state: "narrowed", display: `over ${formatPropertyValue(property, low)}` }
  if (high !== undefined) return { state: "narrowed", display: `under ${formatPropertyValue(property, high)}` }

  const near = observations.find(o => o.status === "close")
  if (near) return { state: "narrowed", display: `near ${formatPropertyValue(property, near.value)}` }

  return { state: "unknown", display: UNKNOWN_DISPLAY }
}

// A categorical property either matches outright or rules one value out. Ruling values out is worth
// showing: knowing the answer does not orbit Saturn is a genuine step, and it is the only thing a
// wrong categorical guess ever tells you.
function describeExact(property: string, observations: Observation[]): { state: KnowledgeState; display: string } {
  const match = observations.find(o => o.status === "correct")
  if (match) return { state: "locked", display: formatPropertyValue(property, match.value) }

  const ruledOut: string[] = []
  for (const o of observations) {
    if (o.status !== "incorrect") continue
    const text = formatPropertyValue(property, o.value)
    if (!ruledOut.includes(text)) ruledOut.push(text)
  }
  if (ruledOut.length === 0) return { state: "unknown", display: UNKNOWN_DISPLAY }

  const shown = ruledOut.slice(0, MAX_EXCLUSIONS_SHOWN).join(" or ")
  const rest = ruledOut.length - MAX_EXCLUSIONS_SHOWN
  return { state: "narrowed", display: rest > 0 ? `not ${shown} +${rest} more` : `not ${shown}` }
}

// Everything the guesses so far have established about the answer, one entry per property in the
// profile, in the profile's own order.
export function deriveKnowledge(
  profile: ProfileEntry[],
  guesses: CelestialObject[],
  answer: CelestialObject,
  dataset: CelestialObject[],
  hintedProperties: string[] = []
): PropertyKnowledge[] {
  const knowledge = profile.map(entry => {
    const answerValue = getComparableValue(answer, entry.property, dataset)
    const observations: Observation[] = guesses.map(guess => {
      const value = getComparableValue(guess, entry.property, dataset)
      return { value, status: compareProperty(value, answerValue, entry.kind).status }
    })
    const hinted = hintedProperties.includes(entry.property as string)

    // A hint on a property with no scale hands over the value itself, so there is nothing left to
    // deduce about it. On a numeric property it only brackets the value, and that bracket joins the
    // bounds the guesses have established.
    if (hinted && (entry.kind === "exact" || propertyBracket(entry.property, answerValue) === null)) {
      return {
        property: entry.property as string,
        label: entry.label,
        state: "locked" as KnowledgeState,
        display: formatPropertyValue(entry.property, answerValue),
      }
    }

    const resolved =
      entry.kind === "exact"
        ? describeExact(entry.property, observations)
        : describeNumeric(entry.property, observations, hinted ? propertyBracket(entry.property, answerValue) : null)
    return { property: entry.property as string, label: entry.label, ...resolved }
  })

  // Once the parent body is known, "Distance from Parent" can name it instead — the row says more for
  // free, and "Distance" on its own is ambiguous between parent, Sun and Earth across the profiles.
  const parent = knowledge.find(k => k.property === "parentBodyId")
  if (parent?.state === "locked") {
    const distance = knowledge.find(k => k.property === "distanceFromParentKm")
    if (distance) distance.label = `Distance from ${parent.display}`
  }

  return knowledge
}

// The finished article, for when the game is over and there is nothing left to deduce.
export function revealKnowledge(
  profile: ProfileEntry[],
  answer: CelestialObject,
  dataset: CelestialObject[]
): PropertyKnowledge[] {
  const knowledge = profile.map(entry => ({
    property: entry.property as string,
    label: entry.label,
    state: "locked" as KnowledgeState,
    display: formatPropertyValue(entry.property, getComparableValue(answer, entry.property, dataset)),
  }))

  const parent = knowledge.find(k => k.property === "parentBodyId")
  if (parent && parent.display !== UNKNOWN_DISPLAY) {
    const distance = knowledge.find(k => k.property === "distanceFromParentKm")
    if (distance) distance.label = `Distance from ${parent.display}`
  }

  return knowledge
}

export type DescriptionClause = { text: string; state: KnowledgeState }

// Reads as a sentence rather than a row label, so the header can say what the object is instead of
// listing properties. Anything without an entry here falls back to its own label, which still scans
// ("apparent magnitude near mag 8.4") without needing a phrasing for all fourteen profiles.
const CLAUSES: Record<string, (value: string, parentName?: string) => string> = {
  parentBodyId: v => `orbiting ${v}`,
  diameterKm: v => `${v} across`,
  distanceFromEarthLy: v => `${v} from Earth`,
  distanceFromSunAU: v => `${v} from the Sun`,
  distanceFromParentKm: (v, parentName) => `${v} from ${parentName ?? "its parent"}`,
  temperatureK: v => `around ${v}`,
  massKg: v => `massing ${v}`,
  orbitalPeriodDays: v => `one orbit every ${v}`,
  rotationPeriodHours: v => `a day of ${v}`,
  gravityMs2: v => `surface gravity ${v}`,
  discoveredYear: v => `first recorded ${v}`,
  moons: v => `${v} moons`,
  rings: v => (v === "Yes" ? "with rings" : "with no rings"),
  isZodiac: v => (v === "Yes" ? "in the zodiac" : "outside the zodiac"),
}

// Three is as much as fits on a phone before the header starts pushing the board off the screen.
const MAX_CLAUSES = 3

function withArticle(noun: string): string {
  return /^[aeiou]/i.test(noun) ? `An ${noun}` : `A ${noun}`
}

// The object described in the player's own words so far: category as the noun, then whatever else has
// been pinned down or bounded. Unknown properties are left out entirely rather than described as
// unknown, so the sentence grows as the game goes on.
export function describeKnowledge(knowledge: PropertyKnowledge[]): DescriptionClause[] {
  const category = knowledge.find(k => k.property === "category")
  const parent = knowledge.find(k => k.property === "parentBodyId")
  const parentName = parent?.state === "locked" ? parent.display : undefined

  const lead: DescriptionClause =
    category && category.state === "locked"
      ? { text: withArticle(category.display.toLowerCase()), state: "locked" }
      : { text: "Something out there", state: "unknown" }

  const clauses: DescriptionClause[] = []
  for (const entry of knowledge) {
    if (clauses.length >= MAX_CLAUSES) break
    if (entry.property === "category" || entry.state === "unknown") continue
    const template = CLAUSES[entry.property]
    const text = template
      ? template(entry.display, parentName)
      : `${entry.label.toLowerCase()} ${entry.display}`
    clauses.push({ text, state: entry.state })
  }

  return [lead, ...clauses]
}
