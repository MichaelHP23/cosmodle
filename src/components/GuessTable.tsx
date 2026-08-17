import type { CelestialObject } from "../types/celestial"
import type { ProfileEntry } from "../types/game"
import { compareProperty } from "../lib/comparison"
import { formatPropertyValue } from "../lib/formatting"
import { ResultIndicator } from "./ResultIndicator"

export function GuessTable({
  profile,
  guesses,
  answer,
}: {
  profile: ProfileEntry[]
  guesses: CelestialObject[]
  answer: CelestialObject
}) {
  if (guesses.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-xl border-2 border-[#4d4d4d] bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-[#4d4d4d]">
            <th className="sticky left-0 z-10 min-w-[110px] border-r border-[#e0e0e0] bg-[#f7f7f7] px-3 py-2 text-left font-semibold text-[#4d4d4d]">
              Guess
            </th>
            {profile.map(entry => (
              <th key={entry.property} className="min-w-[70px] px-2 py-2 text-center font-semibold text-[#4d4d4d]">
                {entry.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...guesses].reverse().map(guess => (
            <tr key={guess.id} className="border-b border-[#eee] last:border-b-0">
              <th
                scope="row"
                title={guess.name}
                className="sticky left-0 z-10 border-r border-[#e0e0e0] bg-white px-3 py-2 text-left font-bold text-[#1a1a1a] underline decoration-dotted decoration-2 underline-offset-2"
              >
                {guess.name}
              </th>
              {profile.map(entry => {
                const guessValue = (guess as any)[entry.property]
                const answerValue = (answer as any)[entry.property]
                const result = compareProperty(guessValue, answerValue, entry.kind)
                return (
                  <td key={entry.property} className="px-2 py-2">
                    <ResultIndicator
                      status={result.status}
                      title={`${entry.label}: ${formatPropertyValue(entry.property, guessValue)}`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
