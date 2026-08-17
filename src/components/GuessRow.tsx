import type { CelestialObject } from "../types/celestial"
import { getProfileForCategory } from "../lib/objectProfiles"
import { compareProperty } from "../lib/comparison"
import { ComparisonCell } from "./ComparisonCell"

export function GuessRow({ guess, answer }: { guess: CelestialObject; answer: CelestialObject }) {
  const profile = getProfileForCategory(guess.category)
  return (
    <div className="mb-4 rounded-lg bg-slate-800 p-3">
      <div className="mb-2 font-semibold text-slate-100">{guess.name}</div>
      {profile.map(entry => {
        const guessValue = (guess as any)[entry.property]
        const answerValue = (answer as any)[entry.property]
        const result = compareProperty(guessValue, answerValue, entry.kind)
        return <ComparisonCell key={entry.property} entry={entry} result={result} guessValue={guessValue} />
      })}
    </div>
  )
}
