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
    <div className="inline-block max-w-full overflow-x-auto rounded-xl border-2 border-[#4d4d4d] bg-[#fff8e7]/70">
      <table className="border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-[#4d4d4d]">
            <th className="sticky left-0 z-10 w-[110px] min-w-[110px] border-r border-[#e0e0e0] bg-[#fff8e7] px-3 py-2 text-left font-semibold text-[#4d4d4d] sm:w-[140px] sm:min-w-[140px]">
              Guess
            </th>
            {profile.map(entry => (
              <th
                key={entry.property}
                className="w-[64px] min-w-[64px] cursor-default px-1 py-2 text-center text-xs font-semibold text-[#4d4d4d] transition-colors hover:font-extrabold hover:text-[#1a1a1a] sm:w-20 sm:min-w-[80px] sm:text-sm"
              >
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
                className="sticky left-0 z-10 w-[110px] break-words border-r border-[#e0e0e0] bg-[#fff8e7] px-3 py-2 text-left text-sm font-bold leading-tight text-[#1a1a1a] underline decoration-dotted decoration-2 underline-offset-2 sm:w-[140px]"
              >
                {guess.name}
              </th>
              {profile.map(entry => {
                const guessValue = (guess as any)[entry.property]
                const answerValue = (answer as any)[entry.property]
                const result = compareProperty(guessValue, answerValue, entry.kind)
                return (
                  <td key={entry.property} className="px-1 py-2 sm:px-2">
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
