import { useState } from "react"
import type { CelestialObject } from "../types/celestial"

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

  const results = query.trim().length === 0
    ? []
    : dataset
        .filter(o => o.name.toLowerCase().includes(query.trim().toLowerCase()))
        .filter(o => !guessedIds.includes(o.id))
        .slice(0, 8)

  function select(id: string) {
    onGuess(id)
    setQuery("")
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-lg border-2 border-[#4d4d4d] bg-white px-4 py-2 text-[#1a1a1a] placeholder-[#8a8a8a] focus:border-[#00b99b] focus:outline-none"
        placeholder="🔎 Search celestial objects..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border-2 border-[#4d4d4d] bg-white shadow-lg">
          {results.map(o => (
            <li
              key={o.id}
              className="cursor-pointer px-4 py-2 hover:bg-[#e6f8f5]"
              onClick={() => select(o.id)}
            >
              <div className="text-[#1a1a1a]">{o.name}</div>
              <div className="text-xs text-[#00998a]">{o.category.replace("_", " ")}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
