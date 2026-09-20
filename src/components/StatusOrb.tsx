import type { ComparisonStatus } from "../types/game"

// Solid tiles rather than the outlined discs that came before: each result is a chip of one colour
// with its glyph cut out of it, which survives being 26px wide on a phone in a way a ringed planet
// did not. The glyph carries the meaning — a sparkle for a match, a half-lit moon for a near miss,
// stacked chevrons for a direction — and the colour only confirms what the shape already said.
const LABELS: Record<ComparisonStatus, string> = {
  correct: "Match",
  close: "Close",
  higher: "Answer is higher",
  lower: "Answer is lower",
  incorrect: "Not it",
  not_applicable: "Not applicable",
}

const TILE = { x: 2.5, y: 2.5, width: 35, height: 35, rx: 10.5 }

// Two chevrons, the leading one at full strength and the one behind it dimmed, so the direction
// reads before the colour does.
const CHEVRONS: Record<"higher" | "lower", [string, string]> = {
  higher: ["M13.2 20.4 L20 13.6 L26.8 20.4", "M13.2 27.4 L20 20.6 L26.8 27.4"],
  lower: ["M13.2 19.6 L20 26.4 L26.8 19.6", "M13.2 12.6 L20 19.4 L26.8 12.6"],
}

export function StatusOrb({
  status,
  size = 30,
  title,
  delay = 0,
}: {
  status: ComparisonStatus
  size?: number
  title?: string
  // Seconds to hold this tile back by, so a row of them turns over in sequence.
  delay?: number
}) {
  const label = title ?? LABELS[status]

  return (
    <svg
      className="orb-flip"
      style={{ animationDelay: `${delay}s` }}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>

      {status === "correct" && (
        <>
          <rect {...TILE} fill="var(--orb-correct)" />
          <path
            className="orb-twinkle"
            style={{ animationDelay: `${delay + 0.34}s` }}
            d="M20 9 C21.3 15.9 24.1 18.7 31 20 C24.1 21.3 21.3 24.1 20 31 C18.7 24.1 15.9 21.3 9 20 C15.9 18.7 18.7 15.9 20 9 Z"
            fill="var(--orb-glyph)"
          />
        </>
      )}

      {status === "close" && (
        <>
          <rect {...TILE} fill="var(--orb-close)" />
          <circle cx="20" cy="20" r="8.4" fill="none" stroke="var(--orb-glyph)" strokeWidth="1.8" />
          <path d="M20 11.6 A8.4 8.4 0 0 1 20 28.4 Z" fill="var(--orb-glyph)" />
        </>
      )}

      {(status === "higher" || status === "lower") && (
        <>
          <rect {...TILE} fill="var(--orb-direction)" />
          <path
            d={CHEVRONS[status][0]}
            fill="none"
            stroke="var(--orb-glyph)"
            strokeWidth="3.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={CHEVRONS[status][1]}
            fill="none"
            stroke="var(--orb-glyph)"
            strokeWidth="3.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.55"
          />
        </>
      )}

      {/* The one state that stays quiet: a wash rather than a full-strength fill, because most of a
          board is misses and six loud tiles in a row would drown the hits. */}
      {status === "incorrect" && (
        <>
          <rect {...TILE} fill="var(--orb-wrong-wash)" />
          <rect x="12.6" y="18.4" width="14.8" height="3.2" rx="1.6" fill="var(--orb-wrong-ink)" />
        </>
      )}

      {status === "not_applicable" && (
        <rect
          x="3.4"
          y="3.4"
          width="33.2"
          height="33.2"
          rx="10"
          fill="none"
          stroke="var(--orb-na)"
          strokeWidth="1.9"
          strokeDasharray="3 3.8"
        />
      )}
    </svg>
  )
}
