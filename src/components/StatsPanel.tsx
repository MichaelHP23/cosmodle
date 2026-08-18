import type { Statistics } from "../lib/statistics"
import { getWinPercentage } from "../lib/statistics"

function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-extrabold text-[#1a1a1a]">{value}</div>
      <div className="text-xs uppercase tracking-wide text-[#4d4d4d]">{label}</div>
    </div>
  )
}

export function StatsPanel({ statistics, highlightGuessCount }: { statistics: Statistics; highlightGuessCount?: number }) {
  const maxCount = Math.max(1, ...statistics.guessDistribution)

  return (
    <div className="mb-4">
      <div className="mb-3 flex items-center justify-center gap-6 rounded-lg border border-[#e0e0e0] bg-white py-3">
        <StatBlock value={statistics.gamesPlayed} label="Played" />
        <StatBlock value={getWinPercentage(statistics)} label="Win %" />
        <StatBlock value={statistics.currentStreak} label="Streak" />
        <StatBlock value={statistics.longestStreak} label="Max Streak" />
      </div>

      <div className="rounded-lg border border-[#e0e0e0] bg-white p-3">
        <div className="mb-2 text-center text-sm font-bold uppercase tracking-wide text-[#4d4d4d]">
          Guess Distribution
        </div>
        <div className="space-y-1">
          {statistics.guessDistribution.map((count, i) => {
            const guessNumber = i + 1
            const isHighlighted = highlightGuessCount === guessNumber
            const widthPercent = Math.max((count / maxCount) * 100, count > 0 ? 8 : 0)
            return (
              <div key={guessNumber} className="flex items-center gap-2 text-sm">
                <span className="w-3 font-bold text-[#4d4d4d]">{guessNumber}</span>
                <div className="flex-1">
                  <div
                    className={`flex h-6 min-w-[24px] items-center justify-end rounded px-2 text-xs font-bold text-white ${isHighlighted ? "bg-[#00b99b]" : "bg-[#9a9a9a]"}`}
                    style={{ width: `${widthPercent}%` }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
