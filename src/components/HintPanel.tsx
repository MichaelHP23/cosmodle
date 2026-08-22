import { useEffect, useMemo, useState } from "react"
import type { CelestialObject } from "../types/celestial"
import type { ProfileEntry } from "../types/game"
import { formatPropertyRange } from "../lib/formatting"
import { orderHints } from "../lib/hintOrder"

// A stuck player keeps learning something even after their hint budget is gone: every fourth wrong
// guess reveals another hint for free.
const GUESSES_PER_AUTO_HINT = 4

export function HintPanel({
  profile,
  answer,
  hintsUsed,
  maxHints,
  onUseHint,
  correctProperties,
  dataset,
  wrongGuessCount,
}: {
  profile: ProfileEntry[]
  answer: CelestialObject
  hintsUsed: number
  maxHints: number
  onUseHint: () => void
  correctProperties: Set<string>
  dataset: CelestialObject[]
  wrongGuessCount: number
}) {
  // Category is the single biggest field-narrowing property, so hints may reveal it even though the
  // guess table leaves it out of its own columns.
  const hintable = profile
  // Reveal whichever property cuts the field down most, so a hint is worth spending; properties the
  // player has already confirmed by guessing go last. Scoring walks the dataset, hence the memo.
  // correctProperties is a fresh Set each render, so key the memo on its contents instead.
  const correctKey = [...correctProperties].sort().join(",")
  const priorityOrder = useMemo(
    () => orderHints(hintable, answer, dataset, correctProperties),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answer.id, dataset, profile, correctKey]
  )

  // The first hint is free and every fourth wrong guess adds another. Neither touches hintsUsed, since
  // the persisted daily state and the backend both read that number as hints the player paid for.
  // Capping at the number of hintable properties keeps free and paid reveals together inside the list.
  const freeReveals = 1 + Math.floor(wrongGuessCount / GUESSES_PER_AUTO_HINT)
  const revealTarget = Math.min(hintable.length, freeReveals + hintsUsed)

  // Reveal order is locked in incrementally as hints are revealed, so a chip already shown never
  // disappears or reorders just because a later guess changed priority. It is tagged with the answer it
  // was built for, so a new day, a new practice object or an archive day starts clean.
  const [revealed, setRevealed] = useState<{ answerId: string; properties: string[] }>({
    answerId: answer.id,
    properties: [],
  })

  useEffect(() => {
    setRevealed(current => {
      const base = current.answerId === answer.id ? current.properties : []
      const next = [...base]
      for (const entry of priorityOrder) {
        if (next.length >= revealTarget) break
        if (!next.includes(entry.property)) next.push(entry.property)
      }
      if (current.answerId === answer.id && next.length === current.properties.length) return current
      return { answerId: answer.id, properties: next }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealTarget, answer.id])

  // Until the effect above has caught up with a new answer the stored properties belong to the previous
  // one, so show nothing rather than a chip from the last game.
  const revealedEntries = (revealed.answerId === answer.id ? revealed.properties : [])
    .map(property => hintable.find(e => e.property === property))
    .filter((e): e is ProfileEntry => e !== undefined)
  const allRevealed = revealTarget >= hintable.length
  // What the player can still buy: their remaining budget, capped by the properties left to reveal
  // once the free ones are accounted for.
  const hintsLeft = Math.max(0, Math.min(maxHints - hintsUsed, hintable.length - revealTarget))

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <button
        className="rounded-lg border-2 border-[#f0a500] bg-white px-3 py-1 text-sm font-semibold text-[#b8860b] transition-colors hover:bg-[#fff6e0] disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onUseHint}
        disabled={hintsLeft <= 0}
      >
        {allRevealed ? "All hints revealed" : `Hint (${hintsLeft} left)`}
      </button>
      {revealedEntries.map((entry, index) => (
        <span
          key={entry.property}
          className="flex items-center gap-1 rounded-full border border-[#f0a500] bg-[#fff6e0] px-2 py-0.5 text-xs font-semibold text-[#8a6400]"
        >
          {index === 0 && (
            <span className="rounded-full bg-[#f0a500] px-1.5 py-px text-[10px] uppercase tracking-wide text-white">
              Free hint
            </span>
          )}
          {entry.label}: {formatPropertyRange(entry.property, (answer as any)[entry.property])}
        </span>
      ))}
    </div>
  )
}
