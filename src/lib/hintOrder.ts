import { getComparableValue } from "./objectProfiles"
import { formatPropertyValue } from "./formatting"
import type { CelestialObject } from "../types/celestial"
import type { ProfileEntry } from "../types/game"

// How much revealing a property would narrow the field: the share of the dataset still showing the
// same value afterwards. A diameter almost nothing else shares scores near 0 and is worth revealing;
// a hemisphere half the sky shares scores near 0.5 and is nearly useless.
export function narrowingScore(
  property: string,
  answer: CelestialObject,
  dataset: CelestialObject[]
): number {
  const target = formatPropertyValue(property, getComparableValue(answer, property, dataset))
  // A property the answer cannot even report tells the player nothing, so rank it last.
  if (target === "—") return 1
  let matches = 0
  for (const object of dataset) {
    if (formatPropertyValue(property, getComparableValue(object, property, dataset)) === target) matches++
  }
  return matches / dataset.length
}

// Hints reveal the most informative property first. Properties the player has already pinned down
// with a guess go last however narrowing they are, since re-telling them something they know is the
// one genuinely wasted hint.
export function orderHints(
  hintable: ProfileEntry[],
  answer: CelestialObject,
  dataset: CelestialObject[],
  correctProperties: Set<string>
): ProfileEntry[] {
  const scores = new Map(hintable.map(e => [e.property, narrowingScore(e.property, answer, dataset)]))
  const mostNarrowingFirst = (a: ProfileEntry, b: ProfileEntry) =>
    (scores.get(a.property) ?? 1) - (scores.get(b.property) ?? 1)
  return [
    ...hintable.filter(e => !correctProperties.has(e.property)).sort(mostNarrowingFirst),
    ...hintable.filter(e => correctProperties.has(e.property)).sort(mostNarrowingFirst),
  ]
}
