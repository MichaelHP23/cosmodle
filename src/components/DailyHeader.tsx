import type { GameMode } from "../types/game"

const TITLE = "CELESTIAL"

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
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="title-text text-3xl font-extrabold sm:text-4xl">
          {TITLE.split("").map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </h1>
        {mode === "daily" && <div className="text-sm text-[#4d4d4d]">Celestial #{dayNumber}</div>}
      </div>
      <div className="flex gap-2">
        <button
          className={`rounded-lg border-2 px-3 py-1 text-sm font-semibold transition-colors ${
            mode === "daily"
              ? "border-[#00998a] bg-[#00b99b] text-white"
              : "border-[#4d4d4d] bg-white text-[#4d4d4d] hover:bg-[#f0f0f0]"
          }`}
          onClick={() => onModeChange("daily")}
        >
          Daily
        </button>
        <button
          className={`rounded-lg border-2 px-3 py-1 text-sm font-semibold transition-colors ${
            mode === "practice"
              ? "border-[#00998a] bg-[#00b99b] text-white"
              : "border-[#4d4d4d] bg-white text-[#4d4d4d] hover:bg-[#f0f0f0]"
          }`}
          onClick={() => onModeChange("practice")}
        >
          Practice
        </button>
      </div>
    </header>
  )
}
