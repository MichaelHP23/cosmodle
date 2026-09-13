import { useState } from "react"
import type { CelestialObject } from "../types/celestial"
import { getSearchHint } from "../lib/objectProfiles"

export function GuessInput({
  dataset,
  guessedIds,
  onGuess,
}: {
  dataset: CelestialObject[]
  guessedIds: string[]
  onGuess: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const results = query.trim().length === 0
    ? []
    : dataset
        .filter(o => o.name.toLowerCase().includes(query.trim().toLowerCase()))
        .filter(o => !guessedIds.includes(o.id))
        .slice(0, 8)

  function select(id: string) {
    onGuess(id)
    setQuery("")
    setHighlightedIndex(0)
  }

  function handleChange(value: string) {
    setQuery(value)
    setHighlightedIndex(0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex(i => (i + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex(i => (i - 1 + results.length) % results.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      select(results[highlightedIndex].id)
    } else if (e.key === "Escape") {
      setQuery("")
    }
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-xl border border-[var(--hair)] bg-[var(--surface)] px-3.5 py-3.5 text-[15px] text-[var(--ink)] placeholder-[var(--placeholder)] focus:border-[var(--amber)] focus:outline-none"
        placeholder="Guess a celestial object"
        value={query}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[var(--hair)] bg-[var(--surface)] shadow-lg">
          {results.map((o, i) => (
            <li
              key={o.id}
              className={`cursor-pointer px-4 py-2 ${i === highlightedIndex ? "bg-[var(--surface-tint)]" : ""}`}
              onMouseEnter={() => setHighlightedIndex(i)}
              onClick={() => select(o.id)}
            >
              <div className="text-sm text-[var(--ink)]">{o.name}</div>
              <div className="text-xs text-[var(--muted)]">{getSearchHint(o)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
