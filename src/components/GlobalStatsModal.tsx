import { useEffect, useState } from "react"
import { getGlobalStats, type GlobalStats } from "../lib/api"

function GlobalStatBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-extrabold text-[#1a1a1a]">{value}</div>
      <div className="text-xs uppercase tracking-wide text-[#4d4d4d]">{label}</div>
    </div>
  )
}

export function GlobalStatsModal({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    getGlobalStats().then(result => {
      if (result) setStats(result)
      else setLoadFailed(true)
    })
  }, [])

  const maxCount = Math.max(1, ...(stats?.guessDistribution ?? [1]))

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
            <div className="mb-3 flex items-center justify-center gap-6 rounded-lg border border-[#e0e0e0] bg-white py-3">
              <GlobalStatBlock value={stats.totalPlayers} label="Players" />
              <GlobalStatBlock value={stats.playedToday} label="Played Today" />
              <GlobalStatBlock value={stats.winRate} label="Win %" />
            </div>

            <div className="rounded-lg border border-[#e0e0e0] bg-white p-3">
              <div className="mb-2 text-center text-sm font-bold uppercase tracking-wide text-[#4d4d4d]">
                Guess Distribution
              </div>
              <div className="space-y-1">
                {stats.guessDistribution.map((count, i) => {
                  const guessNumber = i + 1
                  const widthPercent = Math.max((count / maxCount) * 100, count > 0 ? 8 : 0)
                  return (
                    <div key={guessNumber} className="flex items-center gap-2 text-sm">
                      <span className="w-3 font-bold text-[#4d4d4d]">{guessNumber}</span>
                      <div className="flex-1">
                        <div
                          className="flex h-6 min-w-[24px] items-center justify-end rounded bg-[#9a9a9a] px-2 text-xs font-bold text-white"
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
          </>
        )}
      </div>
    </div>
  )
}
