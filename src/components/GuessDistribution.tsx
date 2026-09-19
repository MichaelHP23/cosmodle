import { MAX_GUESSES } from "../lib/gameConstants"

export function GuessDistribution({
  distribution,
  highlightGuessCount,
  subtitle,
}: {
  distribution: number[]
  highlightGuessCount?: number
  subtitle?: string
}) {
  const maxCount = Math.max(1, ...distribution)
  // Two-digit labels need more room than the single digits the 7-bucket chart shows.
  const labelWidthClass = distribution.length >= 10 ? "w-8" : "w-5"
  // A chart with fewer bars than the guess limit puts everything above its last bar into that bar, so
  // the label gets a "+". A chart that runs all the way to the limit has no higher score to absorb.
  const lastBucketOverflows = distribution.length < MAX_GUESSES
  const clampedHighlight =
    highlightGuessCount !== undefined ? Math.min(highlightGuessCount, distribution.length) : undefined

  return (
    <div className="rounded-lg border border-[var(--hair-2)] bg-[var(--bg)] p-3">
      <div className="mb-2 text-center text-sm font-bold uppercase tracking-wide text-[var(--ink-2)]">
        Guess Distribution
      </div>
      {subtitle && <div className="mb-2 -mt-1 text-center text-xs text-[var(--muted-2)]">{subtitle}</div>}
      <div className="space-y-1">
        {distribution.map((count, i) => {
          const guessNumber = i + 1
          const isLastBucket = i === distribution.length - 1
          const label = isLastBucket && lastBucketOverflows ? `${guessNumber}+` : String(guessNumber)
          const isHighlighted = clampedHighlight === guessNumber
          const widthPercent = Math.max((count / maxCount) * 100, count > 0 ? 8 : 0)
          return (
            <div key={guessNumber} className="flex items-center gap-2 text-sm">
              <span className={`${labelWidthClass} font-bold text-[var(--ink-2)]`}>{label}</span>
              <div className="flex-1">
                <div
                  className={`flex h-6 min-w-[24px] items-center justify-end rounded px-2 text-xs font-bold text-white ${isHighlighted ? "bg-[var(--teal-bright)]" : "bg-[var(--muted-2)]"}`}
                  style={{ width: `${widthPercent}%` }}
                >
                  {count}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
