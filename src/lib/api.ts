import type { Statistics } from "./statisticsCore"

export type GlobalStats = {
  totalPlayers: number
  playedToday: number
  winRate: number
  guessDistribution: number[]
}

export async function postResult(
  uuid: string,
  dayNumber: number,
  won: boolean,
  guessCount: number,
  hintsUsed: number,
  gaveUp = false
): Promise<Statistics | null> {
  const body = JSON.stringify({ uuid, dayNumber, won, guessCount, hintsUsed, gaveUp })
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("/api/result", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      })
      if (res.ok) return (await res.json()) as Statistics
    } catch {
      // network hiccup — retry below
    }
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt))
  }
  return null
}

export async function getPlayerStats(uuid: string): Promise<Statistics | null> {
  try {
    const res = await fetch(`/api/player/${uuid}`)
    if (!res.ok) return null
    return (await res.json()) as Statistics
  } catch {
    return null
  }
}

export async function getGlobalStats(): Promise<GlobalStats | null> {
  try {
    const res = await fetch("/api/stats")
    if (!res.ok) return null
    return (await res.json()) as GlobalStats
  } catch {
    return null
  }
}
