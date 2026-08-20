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
      <div className="mx-auto my-8 w-full max-w-md rounded-xl border-2 border-[#4d4d4d] bg-[#f7f7f7] p-6">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Global Stats</h2>
          <button className="text-[#8a8a8a] hover:text-[#4d4d4d]" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {loadFailed && <p className="text-sm text-[#4d4d4d]">Couldn't load stats right now. Try again later.</p>}

        {stats && (
          <>
            <div className="mb-3 flex items-center justify-center gap-6 rounded-lg border border-[#e0e0e0] bg-[#fff8e7] py-3">
              <StatBlock value={stats.totalPlayers} label="Players" />
              <StatBlock value={stats.playedToday} label="Played Today" />
              <StatBlock value={stats.winRate} label="Win %" />
            </div>

            <GuessDistribution distribution={stats.guessDistribution} />
          </>
        )}
      </div>
    </div>
  )
}
