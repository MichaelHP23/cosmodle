import { useState } from "react"
import type { GameMode } from "../types/game"

const TITLE_CHARS = ["C", "O", "S", "M", "D", "L", "E"] // 2nd O replaced by galaxy icon, inserted after M
const GALAXY_ICON_INDEX = 4
const EASTER_EGG_CLICKS = 5

function GalaxyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="0.95em" height="0.95em" aria-hidden="true">
      <defs>
        <radialGradient id="cosmodleBadgeBg" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#3d2a72" />
          <stop offset="100%" stopColor="#160a2e" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#cosmodleBadgeBg)" stroke="#f0a500" strokeWidth="0.8" />
      <circle cx="6.5" cy="6" r="0.5" fill="#fff" />
      <circle cx="18" cy="7.5" r="0.4" fill="#fff" />
      <circle cx="17.5" cy="18" r="0.5" fill="#fff" />
      <circle cx="5.5" cy="16.5" r="0.35" fill="#fff" />
      <path d="M4.2 3.4l0.5 1.4 1.4 0.5-1.4 0.5-0.5 1.4-0.5-1.4L2.3 5.3l1.4-0.5z" fill="#fff" />
      <g transform="translate(13.5 13.5) rotate(-25)">
        <ellipse cx="0" cy="0" rx="6.6" ry="1.9" fill="none" stroke="#f0a500" strokeWidth="0.9" />
        <circle cx="0" cy="0" r="3.6" fill="#37c9c1" />
        <circle cx="-1.1" cy="-1.2" r="1.1" fill="#fff" opacity="0.2" />
      </g>
    </svg>
  )
}

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

  function handleGalaxyClick() {
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
          {TITLE_CHARS.slice(0, GALAXY_ICON_INDEX).map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
          <span className="title-icon cursor-pointer" onClick={handleGalaxyClick}>
            <GalaxyIcon />
          </span>
          {TITLE_CHARS.slice(GALAXY_ICON_INDEX).map((ch, i) => (
            <span key={GALAXY_ICON_INDEX + i}>{ch}</span>
          ))}
        </h1>
        {mode !== "practice" && <div className="text-sm text-[#4d4d4d]">Cosmodle #{dayNumber}</div>}
        {showEasterEgg && (
          <div className="absolute left-0 top-full z-20 mt-1 w-max max-w-xs rounded-lg border-2 border-[#f0a500] bg-[#fff8e7] px-3 py-2 text-xs font-semibold text-[#8a6400] shadow-lg">
            Fun fact: averaged across the whole sky, the universe is this exact color — cosmic latte, #FFF8E7.
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
