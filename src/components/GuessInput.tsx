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
        className="w-full rounded-md border border-slate-600 bg-slate-900 px-4 py-2 text-slate-100 placeholder-slate-500"
        placeholder="🔎 Search celestial objects..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-slate-700 bg-slate-800">
          {results.map(o => (
            <li
              key={o.id}
              className="cursor-pointer px-4 py-2 hover:bg-slate-700"
              onClick={() => select(o.id)}
            >
              <div className="text-slate-100">{o.name}</div>
              <div className="text-xs text-slate-400">{o.category.replace("_", " ")}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
