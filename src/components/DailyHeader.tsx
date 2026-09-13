import { useState } from "react"
import type { GameMode } from "../types/game"
import type { Theme } from "../lib/useTheme"

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
  theme,
  onToggleTheme,
}: {
  mode: GameMode
  onModeChange: (m: GameMode) => void
  dayNumber: number
  onHelpClick: () => void
  theme: Theme
  onToggleTheme: () => void
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
          className="cursor-pointer select-none text-xl font-bold tracking-tight text-[var(--ink)]"
          onClick={handleWordClick}
        >
          cosmodle
        </span>
        <div className="flex items-center gap-2.5">
          <button
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-[var(--hair)] text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
          <button
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-[var(--hair)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={onHelpClick}
            aria-label="How to play"
          >
            ?
          </button>
        </div>
      </div>

      <nav className="mt-3.5 flex items-center gap-[18px]">
        {MODES.map(({ mode: m, label }) => (
          <button
            key={m}
            className={`pb-1 text-[13.5px] transition-colors ${
              mode === m
                ? "border-b-2 border-[var(--amber)] font-semibold text-[var(--ink)]"
                : "border-b-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
            onClick={() => onModeChange(m)}
          >
            {label}
          </button>
        ))}
        {mode !== "practice" && <span className="ml-auto text-[12.5px] text-[var(--faint)]">#{dayNumber}</span>}
      </nav>

      {showEasterEgg && (
        <div className="absolute left-0 top-full z-20 mt-1 w-max max-w-xs rounded-lg border border-[var(--amber-bright)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--amber-text)] shadow-lg">
          Fun fact: averaged across the whole sky, the universe is this exact color — cosmic latte, #FFF8E7.
        </div>
      )}
    </header>
  )
}
