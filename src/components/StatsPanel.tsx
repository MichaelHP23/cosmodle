import { getWinPercentage, type Statistics } from "../lib/statisticsCore"
import { StatBlock } from "./StatBlock"
import { GuessDistribution } from "./GuessDistribution"

export function StatsPanel({ statistics, highlightGuessCount }: { statistics: Statistics; highlightGuessCount?: number }) {
  return (
    <div className="mb-4">
      <div className="mb-3 flex items-center justify-center gap-6 rounded-lg border border-[var(--hair-2)] bg-[var(--bg)] py-3">
        <StatBlock value={statistics.gamesPlayed} label="Played" />
        <StatBlock value={getWinPercentage(statistics)} label="Win %" />
        <StatBlock value={statistics.currentStreak} label="Streak" />
        <StatBlock value={statistics.longestStreak} label="Max Streak" />
      </div>

      <GuessDistribution distribution={statistics.guessDistribution} highlightGuessCount={highlightGuessCount} />
    </div>
  )
}
