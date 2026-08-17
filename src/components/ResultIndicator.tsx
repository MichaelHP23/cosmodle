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
    <div
      title={title}
      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold ${classes}`}
    >
      {content}
    </div>
  )
}
