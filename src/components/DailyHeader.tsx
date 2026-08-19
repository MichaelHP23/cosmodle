import { useState } from "react"
import type { GameMode } from "../types/game"

const TITLE_CHARS = ["C", "O", "S", "M", "🌐", "D", "L", "E"] // globe replaces 2nd O
const EASTER_EGG_CLICKS = 5

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
  const [globeClicks, setGlobeClicks] = useState(0)
  const [showEasterEgg, setShowEasterEgg] = useState(false)

  function handleGlobeClick() {
    const next = globeClicks + 1
    if (next >= EASTER_EGG_CLICKS) {
      setGlobeClicks(0)
      setShowEasterEgg(true)
      setTimeout(() => setShowEasterEgg(false), 5000)
    } else {
      setGlobeClicks(next)
    }
  }

  return (
    <header className="relative mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="title-text text-3xl font-extrabold sm:text-4xl">
          {TITLE_CHARS.map((ch, i) =>
            ch === "🌐" ? (
              <span key={i} className="title-globe cursor-pointer" onClick={handleGlobeClick}>
                {ch}
              </span>
            ) : (
              <span key={i}>{ch}</span>
            )
          )}
        </h1>
        {mode !== "practice" && <div className="text-sm text-[#4d4d4d]">Cosmodle #{dayNumber}</div>}
        {showEasterEgg && (
          <div className="absolute left-0 top-full z-20 mt-1 w-max max-w-xs rounded-lg border-2 border-[#f0a500] bg-[#fff8e7] px-3 py-2 text-xs font-semibold text-[#8a6400] shadow-lg">
            🥛 Fun fact: averaged across the whole sky, the universe is this exact color — cosmic latte, #FFF8E7.
          </div>
        )}
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
