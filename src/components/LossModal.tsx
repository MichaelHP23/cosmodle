import type { CelestialObject } from "../types/celestial"
import type { ComparisonStatus } from "../types/game"
import type { Statistics } from "../lib/statisticsCore"
import { ObjectCard } from "./ObjectCard"
import { Share } from "./Share"
import { StatsPanel } from "./StatsPanel"

export function LossModal({
  answer,
  gaveUp,
  dayNumber,
  guessStatusRows,
  statistics,
  onClose,
}: {
  answer: CelestialObject
  gaveUp: boolean
  guessCount: number
  dayNumber: number
  guessStatusRows: { statuses: ComparisonStatus[]; isWinningGuess: boolean }[]
  statistics: Statistics | null
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-30 overflow-y-auto bg-black/50 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="mx-auto my-8 w-full max-w-md rounded-xl border-2 border-[var(--line-strong)] bg-[var(--surface-raised)] p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1 text-center">
            <div className="text-lg font-bold text-[var(--ink-strong)]">{gaveUp ? "GAVE UP" : "OUT OF GUESSES"}</div>
            <div className="text-sm text-[var(--ink-2)]">The answer was</div>
          </div>
          <button
            className="text-[var(--muted-2)] hover:text-[var(--ink-2)]"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {statistics && <StatsPanel statistics={statistics} />}

        <ObjectCard object={answer} />
        <div className="mt-4 flex justify-center">
          <Share dayNumber={dayNumber} guessStatusRows={guessStatusRows} gaveUp={gaveUp} />
        </div>
      </div>
    </div>
  )
}
