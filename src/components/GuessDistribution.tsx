export function GuessDistribution({
  distribution,
  highlightGuessCount,
}: {
  distribution: number[]
  highlightGuessCount?: number
}) {
  const maxCount = Math.max(1, ...distribution)

  return (
    <div className="rounded-lg border border-[#e0e0e0] bg-[#fff8e7] p-3">
      <div className="mb-2 text-center text-sm font-bold uppercase tracking-wide text-[#4d4d4d]">
        Guess Distribution
      </div>
      <div className="space-y-1">
        {distribution.map((count, i) => {
          const guessNumber = i + 1
          const isHighlighted = highlightGuessCount === guessNumber
          const widthPercent = Math.max((count / maxCount) * 100, count > 0 ? 8 : 0)
          return (
            <div key={guessNumber} className="flex items-center gap-2 text-sm">
              <span className="w-3 font-bold text-[#4d4d4d]">{guessNumber}</span>
              <div className="flex-1">
                <div
                  className={`flex h-6 min-w-[24px] items-center justify-end rounded px-2 text-xs font-bold text-white ${isHighlighted ? "bg-[#00b99b]" : "bg-[#9a9a9a]"}`}
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
