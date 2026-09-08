import type { CelestialObject } from "../types/celestial"
import type { ProfileEntry } from "../types/game"
import { formatPropertyRange } from "../lib/formatting"

// Purely the control and its chips: which properties have been revealed is decided above, because the
// knowledge panel is built from the same answer.
export function HintPanel({
  answer,
  revealedEntries,
  hintsLeft,
  allRevealed,
  onUseHint,
}: {
  answer: CelestialObject
  revealedEntries: ProfileEntry[]
  hintsLeft: number
  allRevealed: boolean
  onUseHint: () => void
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button
        className="rounded-lg bg-[#e8a33d]/12 px-2.5 py-1.5 text-xs font-semibold text-[#c9852a] transition-colors hover:bg-[#e8a33d]/20 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onUseHint}
        disabled={hintsLeft <= 0}
      >
        {allRevealed ? "All hints revealed" : `Reveal a hint · ${hintsLeft} left`}
      </button>
      {revealedEntries.map((entry, index) => (
        <span key={entry.property} className="text-xs text-[#8a8399]">
          {index === 0 && "Free hint: "}
          {entry.label}:{" "}
          <b className="font-semibold text-[#2c2742]">
            {formatPropertyRange(entry.property, (answer as any)[entry.property])}
          </b>
        </span>
      ))}
    </div>
  )
}
