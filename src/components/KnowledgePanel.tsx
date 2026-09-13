import { useEffect, useRef, useState } from "react"
import type { PropertyKnowledge } from "../lib/knowledge"

// How long the arriving row stays lit. Long enough to catch the eye if you were looking at the button
// you just pressed rather than at the row six lines below it.
const FLASH_MS = 1600

// No card, no border, no coloured pip per row. Every row used to carry a dot saying whether the value
// was pinned or merely bounded, which the wording already says — "Comet" against "under 11 km" — so
// the dots were thirty-odd marks of pure decoration competing with the numbers they sat next to.
export function KnowledgePanel({ knowledge }: { knowledge: PropertyKnowledge[] }) {
  const [flashing, setFlashing] = useState<string[]>([])
  // Rows already hinted when this mounted are not new: reloading mid-game should not relight every
  // hint the player spent earlier.
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    const hinted = knowledge.filter(row => row.fromHint).map(row => row.property)
    if (seen.current === null) {
      seen.current = new Set(hinted)
      return
    }
    const landed = hinted.filter(property => !seen.current!.has(property))
    for (const property of hinted) seen.current.add(property)
    if (landed.length === 0) return

    setFlashing(landed)
    const timer = setTimeout(() => setFlashing([]), FLASH_MS)
    return () => clearTimeout(timer)
  }, [knowledge])

  return (
    <div>
      {knowledge.map(row => (
        <div
          key={row.property}
          className={`flex items-baseline justify-between gap-4 border-b border-[var(--hair)] px-2 py-3 last:border-b-0 ${
            row.fromHint ? "rounded-md bg-[var(--amber-bright)]/[0.09]" : ""
          } ${flashing.includes(row.property) ? "hint-landed" : ""}`}
        >
          <span className="flex items-baseline gap-1.5 text-sm text-[var(--muted)]">
            {row.label}
            {/* A word as well as a colour: which rows were bought rather than deduced should not be a
                thing only a player who can separate amber from cream is able to read. */}
            {row.fromHint && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--amber-deep)]">hint</span>
            )}
          </span>
          <span
            className={`text-right text-sm ${
              row.state === "unknown" ? "text-[var(--faint)]" : "font-semibold text-[var(--ink)]"
            }`}
          >
            {row.display}
          </span>
        </div>
      ))}
    </div>
  )
}
