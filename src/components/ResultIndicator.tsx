import type { ComparisonStatus } from "../types/game"

const INDICATOR: Record<ComparisonStatus, { classes: string; content: string; label: string }> = {
  correct: { classes: "bg-[#00b99b] text-white", content: "", label: "Correct" },
  close: { classes: "bg-[#f0c419] text-[#4d4d4d]", content: "≈", label: "Close" },
  incorrect: { classes: "bg-[#e05c5c] text-white", content: "", label: "Incorrect" },
  higher: { classes: "bg-[#4d90c4] text-white", content: "▲", label: "Higher" },
  lower: { classes: "bg-[#4d90c4] text-white", content: "▼", label: "Lower" },
  not_applicable: { classes: "bg-transparent text-[#b5b5b5]", content: "—", label: "N/A" },
}

export function ResultIndicator({ status, title }: { status: ComparisonStatus; title: string }) {
  const { classes, content } = INDICATOR[status]
  return (
    <div className="group relative mx-auto flex h-7 w-7 items-center justify-center">
      <div
        aria-label={title}
        className={`flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold transition-transform duration-100 group-hover:scale-125 group-hover:shadow-md ${classes}`}
      >
        {content}
      </div>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1a1a1a] px-2 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100">
        {title}
      </div>
    </div>
  )
}
