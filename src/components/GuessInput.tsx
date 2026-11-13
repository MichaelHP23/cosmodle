import { useEffect, useMemo, useRef, useState } from "react"
import type { CelestialObject } from "../types/celestial"
import { getSearchHint } from "../lib/objectProfiles"

export function GuessInput({
  dataset,
  fullDataset = dataset,
  guessedIds,
  onGuess,
  narrowed = false,
}: {
  dataset: CelestialObject[]
  // Every object in the game, so a name the clues have ruled out can be told apart from a typo.
  fullDataset?: CelestialObject[]
  guessedIds: string[]
  onGuess: (id: string) => void
  // Whether the dataset has already been cut down to the objects that fit the player's clues, so the
  // input can say so rather than leave them wondering where an object went.
  narrowed?: boolean
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  // Everything still in play, A to Z, so a player can browse the field rather than having to know a
  // name to type. Typing then filters this same list.
  const sorted = useMemo(
    () => dataset.filter(o => !guessedIds.includes(o.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [dataset, guessedIds]
  )
  const needle = query.trim().toLowerCase()
  const matches = (o: CelestialObject) => o.name.toLowerCase().includes(needle)
  const results = needle.length === 0 ? sorted : sorted.filter(matches)
  // Typing a real object's name and seeing nothing reads as a broken search, so say why it is missing.
  const ruledOut = needle.length > 0 && results.length === 0 && narrowed && fullDataset.some(matches)

  // Keep the highlighted row on screen while the arrow keys walk a list longer than the dropdown.
  useEffect(() => {
    const row = listRef.current?.children[highlightedIndex] as HTMLElement | undefined
    row?.scrollIntoView({ block: "nearest" })
  }, [highlightedIndex])

  function select(id: string) {
    onGuess(id)
    setQuery("")
    setHighlightedIndex(0)
    setOpen(false)
  }

  function handleChange(value: string) {
    setQuery(value)
    setHighlightedIndex(0)
    setOpen(true)
    listRef.current?.scrollTo({ top: 0 })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setQuery("")
      setOpen(false)
      return
    }
    if (!open) setOpen(true)
    if (results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex(i => (i + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex(i => (i - 1 + results.length) % results.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      select(results[Math.min(highlightedIndex, results.length - 1)].id)
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
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {open && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto overscroll-contain rounded-xl border border-[var(--hair)] bg-[var(--surface)] shadow-lg"
        >
          {results.map((o, i) => (
            <li
              key={o.id}
              className={`cursor-pointer px-4 py-2 ${i === highlightedIndex ? "bg-[var(--surface-tint)]" : ""}`}
              onMouseEnter={() => setHighlightedIndex(i)}
              // Pick on mousedown, before the input's blur closes the list out from under the click.
              onMouseDown={e => {
                e.preventDefault()
                select(o.id)
              }}
            >
              <div className="text-sm text-[var(--ink)]">{o.name}</div>
              <div className="text-xs text-[var(--muted)]">{getSearchHint(o)}</div>
            </li>
          ))}
        </ul>
      )}
      {open && ruledOut && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-[var(--hair)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--muted)] shadow-lg">
          Nothing matching “{query.trim()}” fits your clues.
        </div>
      )}
      {narrowed && (
        <p className="mt-1.5 px-0.5 text-[11.5px] text-[var(--muted)]">
          Search only shows objects that fit your clues so far.
        </p>
      )}
    </div>
  )
}
