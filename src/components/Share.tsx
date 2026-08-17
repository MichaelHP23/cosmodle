import type { ComparisonStatus } from "../types/game"

function bucketGuessEmoji(statuses: ComparisonStatus[], isWinningGuess: boolean): string {
  if (isWinningGuess) return "🟩"
  const relevant = statuses.filter(s => s !== "not_applicable")
  if (relevant.length === 0) return "🟥"
  const goodCount = relevant.filter(s => s === "correct" || s === "close").length
  const fraction = goodCount / relevant.length
  if (fraction >= 0.7) return "🟨"
  if (fraction >= 0.4) return "🟧"
  return "🟥"
}

export function Share({
  dayNumber,
  guessStatusRows,
}: {
  dayNumber: number
  guessStatusRows: { statuses: ComparisonStatus[]; isWinningGuess: boolean }[]
}) {
  function buildShareText(): string {
    const emojiLine = guessStatusRows.map(row => bucketGuessEmoji(row.statuses, row.isWinningGuess)).join(" ")
    return `🌌 Celestial #${dayNumber}\n\n${emojiLine}\n${guessStatusRows.length} guesses\n\nPlay Celestial`
  }

  async function handleShare() {
    const text = buildShareText()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      if (navigator.share) await navigator.share({ text })
    }
  }

  return (
    <button
      className="rounded-lg border-2 border-[#00998a] bg-[#00b99b] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#00a68a]"
      onClick={handleShare}
    >
      Share Result
    </button>
  )
}
