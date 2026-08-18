import { useRef, useState } from "react"
import type { ComparisonStatus } from "../types/game"

const INDICATOR: Record<ComparisonStatus, { classes: string; content: string; label: string }> = {
  correct: { classes: "bg-[#00b99b] text-white", content: "", label: "Correct" },
  close: { classes: "bg-[#f0c419] text-[#4d4d4d]", content: "≈", label: "Close" },
  incorrect: { classes: "bg-[#e05c5c] text-white", content: "", label: "Incorrect" },
  higher: { classes: "bg-[#4d90c4] text-white", content: "▲", label: "Higher" },
  lower: { classes: "bg-[#4d90c4] text-white", content: "▼", label: "Lower" },
  not_applicable: { classes: "bg-transparent text-[#b5b5b5]", content: "—", label: "N/A" },
}

type TooltipPos = { top: number; left: number; below: boolean }

export function ResultIndicator({ status, title }: { status: ComparisonStatus; title: string }) {
  const { classes, content } = INDICATOR[status]
  const anchorRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipPos | null>(null)

  function showTooltip() {
    const rect = anchorRef.current?.getBoundingClientRect()
    if (!rect) return
    const below = rect.top < 50
    setTooltip({
      top: below ? rect.bottom + 8 : rect.top - 8,
      left: Math.min(Math.max(rect.left + rect.width / 2, 70), window.innerWidth - 70),
      below,
    })
  }

  return (
    <div
      className="relative mx-auto flex h-7 w-7 items-center justify-center"
      onMouseEnter={showTooltip}
      onMouseLeave={() => setTooltip(null)}
    >
      <div
        ref={anchorRef}
        aria-label={title}
        className={`flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold transition-transform duration-100 ${tooltip ? "scale-125 shadow-md" : ""} ${classes}`}
      >
        {content}
      </div>
      {tooltip && (
        <div
          className={`pointer-events-none fixed z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1a1a1a] px-2 py-1 text-xs font-bold text-white shadow-lg ${tooltip.below ? "" : "-translate-y-full"}`}
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          {title}
        </div>
      )}
    </div>
  )
}
