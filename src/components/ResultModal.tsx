import type { CelestialObject } from "../types/celestial"
import type { ComparisonStatus } from "../types/game"
import type { Statistics } from "../lib/statistics"
import { getScoreLabel } from "../lib/scoring"
import { ObjectCard } from "./ObjectCard"
import { Share } from "./Share"
import { StatsPanel } from "./StatsPanel"

export function ResultModal({
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
      className="fixed inset-0 z-30 overflow-y-auto bg-black/50 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="mx-auto my-8 w-full max-w-md rounded-xl border-2 border-[#4d4d4d] bg-[#f7f7f7] p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1 text-center">
            <div className="text-lg font-bold text-[#1a1a1a]">🎉 YOU FOUND IT!</div>
            <div className="text-2xl font-extrabold text-[#00998a]">{answer.name.toUpperCase()}</div>
            <div className="text-sm text-[#4d4d4d]">{getScoreLabel(guessCount)}</div>
          </div>
          <button
            className="text-[#8a8a8a] hover:text-[#4d4d4d]"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {statistics && <StatsPanel statistics={statistics} highlightGuessCount={guessCount} />}

        <ObjectCard object={answer} />
        <div className="mt-4 flex justify-center">
          <Share dayNumber={dayNumber} guessStatusRows={guessStatusRows} />
        </div>
      </div>
    </div>
  )
}
