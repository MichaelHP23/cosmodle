import type { CelestialObject } from "../types/celestial"
import type { ProfileEntry } from "../types/game"
import { formatPropertyValue } from "../lib/formatting"

export function HintPanel({
  profile,
  answer,
  hintsUsed,
  maxHints,
  onUseHint,
  showStreakWarning = true,
}: {
  profile: ProfileEntry[]
  answer: CelestialObject
  hintsUsed: number
  maxHints: number
  onUseHint: () => void
  showStreakWarning?: boolean
}) {
  const hintable = profile.filter(e => e.property !== "category")
  const revealed = hintable.slice(0, hintsUsed)
  const hintsLeft = maxHints - hintsUsed

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <button
        className="rounded-lg border-2 border-[#f0a500] bg-white px-3 py-1 text-sm font-semibold text-[#b8860b] transition-colors hover:bg-[#fff6e0] disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onUseHint}
        disabled={hintsLeft <= 0 || revealed.length >= hintable.length}
      >
        Hint ({hintsLeft} left)
      </button>
      {hintsUsed > 0 && showStreakWarning && (
        <span className="text-xs text-[#b8860b]">
          Use all {maxHints} and win — your streak resets.
        </span>
      )}
      {revealed.map(entry => (
        <span
          key={entry.property}
          className="rounded-full border border-[#f0a500] bg-[#fff6e0] px-2 py-0.5 text-xs font-semibold text-[#8a6400]"
        >
          {entry.label}: {formatPropertyValue(entry.property, (answer as any)[entry.property])}
        </span>
      ))}
    </div>
  )
}
