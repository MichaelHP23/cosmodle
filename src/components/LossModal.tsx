import type { CelestialObject } from "../types/celestial"
import type { ComparisonStatus } from "../types/game"
import type { Statistics } from "../lib/statistics"
import { ObjectCard } from "./ObjectCard"
import { Share } from "./Share"

function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-extrabold text-[#1a1a1a]">{value}</div>
      <div className="text-xs uppercase tracking-wide text-[#4d4d4d]">{label}</div>
    </div>
  )
}

export function LossModal({
  answer,
  guessCount,
  dayNumber,
  guessStatusRows,
  statistics,
  onClose,
}: {
  answer: CelestialObject
  guessCount: number
  dayNumber: number
  guessStatusRows: { statuses: ComparisonStatus[]; isWinningGuess: boolean }[]
  statistics: Statistics | null
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-sm rounded-xl border-2 border-[#4d4d4d] bg-[#f7f7f7] p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1 text-center">
            <div className="text-lg font-bold text-[#1a1a1a]">😢 OUT OF GUESSES</div>
            <div className="text-sm text-[#4d4d4d]">The answer was</div>
          </div>
          <button
            className="text-[#8a8a8a] hover:text-[#4d4d4d]"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex items-center justify-center gap-6 rounded-lg border border-[#e0e0e0] bg-white py-3">
          <StatBlock value={guessCount} label="Attempts" />
          {statistics && (
            <>
              <StatBlock value={statistics.currentStreak} label="Streak" />
              <StatBlock value={statistics.longestStreak} label="Max Streak" />
            </>
          )}
        </div>

        <ObjectCard object={answer} />
        <div className="mt-4 flex justify-center">
          <Share dayNumber={dayNumber} guessStatusRows={guessStatusRows} />
        </div>
      </div>
    </div>
  )
}
