import { useState } from "react"
import type { GameMode } from "../types/game"

const EASTER_EGG_CLICKS = 5
const MODES: { mode: GameMode; label: string }[] = [
  { mode: "daily", label: "Daily" },
  { mode: "practice", label: "Practice" },
  { mode: "archive", label: "Archive" },
]

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
  const [wordClicks, setWordClicks] = useState(0)
  const [showEasterEgg, setShowEasterEgg] = useState(false)

  function handleWordClick() {
    const next = wordClicks + 1
    if (next >= EASTER_EGG_CLICKS) {
      setWordClicks(0)
      setShowEasterEgg(true)
      setTimeout(() => setShowEasterEgg(false), 5000)
    } else {
      setWordClicks(next)
    }
  }

  return (
    <header className="relative mb-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-baseline">
          <span
            className="cursor-pointer select-none text-[19px] font-bold tracking-tight text-[#2c2742]"
            onClick={handleWordClick}
          >
            cosmodle
          </span>
          {mode !== "practice" && <span className="ml-2 text-xs text-[#8a8399]">#{dayNumber}</span>}
        </div>

        <nav className="flex items-center gap-4">
          {MODES.map(({ mode: m, label }) => (
            <button
              key={m}
              className={`pb-0.5 text-[12.5px] font-semibold transition-colors ${
                mode === m
                  ? "border-b-2 border-[#e8a33d] text-[#2c2742]"
                  : "border-b-2 border-transparent text-[#8a8399] hover:text-[#2c2742]"
              }`}
              onClick={() => onModeChange(m)}
            >
              {label}
            </button>
          ))}
          <button
            className="text-[12.5px] font-semibold text-[#8a8399] hover:text-[#2c2742]"
            onClick={onHelpClick}
          >
            How to play
          </button>
        </nav>
      </div>

      {showEasterEgg && (
        <div className="absolute left-0 top-full z-20 mt-1 w-max max-w-xs rounded-lg border border-[#e8a33d] bg-[#fffdf7] px-3 py-2 text-xs font-semibold text-[#8a6400] shadow-lg">
          Fun fact: averaged across the whole sky, the universe is this exact color — cosmic latte, #FFF8E7.
        </div>
      )}
    </header>
  )
}
