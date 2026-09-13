import { useEffect, useState } from "react"
import { getGlobalStats, type GlobalStats } from "../lib/api"
import { StatBlock } from "./StatBlock"
import { GuessDistribution } from "./GuessDistribution"

export function GlobalStatsModal({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    getGlobalStats().then(result => {
      if (result) setStats(result)
      else setLoadFailed(true)
    })
  }, [])

  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto bg-black/50 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="mx-auto my-8 w-full max-w-md rounded-xl border-2 border-[var(--line-strong)] bg-[var(--surface-raised)] p-6">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-[var(--ink-strong)]">Global Stats</h2>
          <button className="text-[var(--muted-2)] hover:text-[var(--ink-2)]" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {loadFailed && <p className="text-sm text-[var(--ink-2)]">Couldn't load stats right now. Try again later.</p>}

        {stats && (
          <>
            <div className="mb-3 flex items-center justify-center gap-6 rounded-lg border border-[var(--hair-2)] bg-[var(--bg)] py-3">
              <StatBlock value={stats.totalPlayers} label="Players" />
              <StatBlock value={stats.playedToday} label="Played Today" />
              <StatBlock value={stats.winRate} label="Win %" />
            </div>

            <GuessDistribution distribution={stats.guessDistribution} subtitle="All-time wins" />
          </>
        )}
      </div>
    </div>
  )
}
