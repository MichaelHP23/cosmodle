import { useEffect, useState } from "react"
import type { CelestialObject } from "../types/celestial"
import type { ProfileEntry } from "../types/game"
import { formatPropertyValue } from "../lib/formatting"

export function HintPanel({
  profile,
  answer,
  hintsUsed,
  maxHints,
  onUseHint,
  correctProperties,
  showStreakWarning = true,
}: {
  profile: ProfileEntry[]
  answer: CelestialObject
  hintsUsed: number
  maxHints: number
  onUseHint: () => void
  correctProperties: Set<string>
  showStreakWarning?: boolean
}) {
  const hintable = profile.filter(e => e.property !== "category")
  // Properties the player hasn't nailed via a guess yet are more useful to reveal,
  // so they go first; properties already confirmed correct go last.
  const priorityOrder = [
    ...hintable.filter(e => !correctProperties.has(e.property)),
    ...hintable.filter(e => correctProperties.has(e.property)),
  ]

  // Reveal order is locked in incrementally as hints are used, so a chip already
  // shown never disappears or reorders just because a later guess changed priority.
  const [revealedOrder, setRevealedOrder] = useState<string[]>([])

  useEffect(() => {
    if (hintsUsed === 0) {
      if (revealedOrder.length !== 0) setRevealedOrder([])
      return
    }
    if (hintsUsed > revealedOrder.length) {
      const next = [...revealedOrder]
      for (const entry of priorityOrder) {
        if (next.length >= hintsUsed) break
        if (!next.includes(entry.property)) next.push(entry.property)
      }
      if (next.length !== revealedOrder.length) setRevealedOrder(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintsUsed, answer.id])

  const revealed = revealedOrder
    .map(property => hintable.find(e => e.property === property))
    .filter((e): e is ProfileEntry => e !== undefined)
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
          Use all {maxHints} hints and still win, and your streak resets.
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
