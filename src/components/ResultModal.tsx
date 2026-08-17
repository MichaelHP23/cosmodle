import type { CelestialObject } from "../types/celestial"
import type { ComparisonStatus } from "../types/game"
import { getScoreLabel } from "../lib/scoring"
import { ObjectCard } from "./ObjectCard"
import { Share } from "./Share"

export function ResultModal({
  answer,
  guessCount,
  dayNumber,
  guessStatusRows,
  onClose,
}: {
  answer: CelestialObject
  guessCount: number
  dayNumber: number
  guessStatusRows: { statuses: ComparisonStatus[]; isWinningGuess: boolean }[]
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-sm rounded-lg bg-slate-900 p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1 text-center">
            <div className="text-lg font-bold text-slate-100">🎉 YOU FOUND IT!</div>
            <div className="text-2xl font-extrabold text-indigo-400">{answer.name.toUpperCase()}</div>
            <div className="text-sm text-slate-400">{guessCount} guesses — {getScoreLabel(guessCount)}</div>
          </div>
          <button
            className="text-slate-500 hover:text-slate-300"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <ObjectCard object={answer} />
        <div className="mt-4 flex justify-center">
          <Share dayNumber={dayNumber} guessStatusRows={guessStatusRows} />
        </div>
      </div>
    </div>
  )
}
