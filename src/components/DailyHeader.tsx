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
    <header className="relative mb-5">
      {/* Two quiet rows rather than one crowded one: the name owns the first line, the modes the
          second, with the day number closing it out where it balances the row. */}
      <div className="flex items-center justify-between">
        <span
          className="cursor-pointer select-none text-xl font-bold tracking-tight text-[#2f2b40]"
          onClick={handleWordClick}
        >
          cosmodle
        </span>
        <button
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-[#ece2cd] text-xs font-semibold text-[#8b8598] hover:text-[#2f2b40]"
          onClick={onHelpClick}
          aria-label="How to play"
        >
          ?
        </button>
      </div>

      <nav className="mt-3.5 flex items-center gap-[18px]">
        {MODES.map(({ mode: m, label }) => (
          <button
            key={m}
            className={`pb-1 text-[13.5px] transition-colors ${
              mode === m
                ? "border-b-2 border-[#d99a2b] font-semibold text-[#2f2b40]"
                : "border-b-2 border-transparent text-[#8b8598] hover:text-[#2f2b40]"
            }`}
            onClick={() => onModeChange(m)}
          >
            {label}
          </button>
        ))}
        {mode !== "practice" && <span className="ml-auto text-[12.5px] text-[#c4bdb0]">#{dayNumber}</span>}
      </nav>

      {showEasterEgg && (
        <div className="absolute left-0 top-full z-20 mt-1 w-max max-w-xs rounded-lg border border-[#e8a33d] bg-[#fffdf7] px-3 py-2 text-xs font-semibold text-[#8a6400] shadow-lg">
          Fun fact: averaged across the whole sky, the universe is this exact color — cosmic latte, #FFF8E7.
        </div>
      )}
    </header>
  )
}
