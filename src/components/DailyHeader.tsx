import type { GameMode } from "../types/game"

const TITLE = "COSMODLE"

export function DailyHeader({
  mode,
  onModeChange,
  dayNumber,
  onHelpClick,
}: {
  mode: GameMode
  onModeChange: (m: GameMode) => void
  dayNumber: number
  onHelpClick: () => void
}) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="title-text text-3xl font-extrabold sm:text-4xl">
          {TITLE.split("").map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </h1>
        {mode !== "practice" && <div className="text-sm text-[#4d4d4d]">Cosmodle #{dayNumber}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
        <button
          className={`rounded-lg border-2 px-3 py-1 text-sm font-semibold transition-colors ${
            mode === "archive"
              ? "border-[#00998a] bg-[#00b99b] text-white"
              : "border-[#4d4d4d] bg-white text-[#4d4d4d] hover:bg-[#f0f0f0]"
          }`}
          onClick={() => onModeChange("archive")}
        >
          Archive
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#4d4d4d] bg-white font-bold text-[#4d4d4d] hover:bg-[#f0f0f0]"
          onClick={onHelpClick}
          aria-label="How to play"
        >
          ?
        </button>
      </div>
    </header>
  )
}
