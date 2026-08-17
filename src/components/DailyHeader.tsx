import type { GameMode } from "../types/game"

export function DailyHeader({
  mode,
  onModeChange,
  dayNumber,
}: {
  mode: GameMode
  onModeChange: (m: GameMode) => void
  dayNumber: number
}) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">🌌 CELESTIAL</h1>
        {mode === "daily" && <div className="text-sm text-slate-400">Celestial #{dayNumber}</div>}
      </div>
      <div className="flex gap-2">
        <button
          className={`rounded px-3 py-1 text-sm ${mode === "daily" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"}`}
          onClick={() => onModeChange("daily")}
        >
          Daily
        </button>
        <button
          className={`rounded px-3 py-1 text-sm ${mode === "practice" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"}`}
          onClick={() => onModeChange("practice")}
        >
          Practice
        </button>
      </div>
    </header>
  )
}
