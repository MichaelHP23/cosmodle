import { useId } from "react"
import type { ComparisonStatus } from "../types/game"

// Circles rather than the usual grid of coloured squares: the game is about celestial bodies, so a
// match is a lit disc, a near miss is a half-lit one, and a numeric miss is a ringed planet whose
// chevron points the way the answer lies.
const LABELS: Record<ComparisonStatus, string> = {
  correct: "Match",
  close: "Close",
  higher: "Answer is higher",
  lower: "Answer is lower",
  incorrect: "Not it",
  not_applicable: "Not applicable",
}

export function StatusOrb({ status, size = 30, title }: { status: ComparisonStatus; size?: number; title?: string }) {
  // Gradients and clips are referenced by id, and several orbs share a screen, so the ids have to be
  // unique per instance or the first one on the page wins for all of them.
  const id = useId().replace(/:/g, "")
  const label = title ?? LABELS[status]

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={label}>
      <title>{label}</title>
      {status === "correct" && <circle cx="20" cy="20" r="13" fill="#e8a33d" />}

      {status === "close" && (
        <>
          <circle cx="20" cy="20" r="13" fill="#fffdf7" stroke="#2f9e8f" strokeWidth="1.5" />
          <path d="M20 7 A13 13 0 0 0 20 33 Z" fill="#2f9e8f" />
        </>
      )}

      {(status === "higher" || status === "lower") && (
        <>
          <defs>
            <clipPath id={`front-${id}`}>
              <rect x="0" y="20" width="40" height="20" />
            </clipPath>
          </defs>
          <ellipse
            cx="20"
            cy="20"
            rx="17"
            ry="4.6"
            fill="none"
            stroke="#7c74c9"
            strokeWidth="1.4"
            transform={`rotate(${status === "higher" ? -18 : 18} 20 20)`}
          />
          <circle cx="20" cy="20" r="11.6" fill="#7c74c9" />
          {/* The near side of the ring, drawn over the planet so it reads as a ring rather than a halo. */}
          <g clipPath={`url(#front-${id})`}>
            <ellipse
              cx="20"
              cy="20"
              rx="17"
              ry="4.6"
              fill="none"
              stroke="#7c74c9"
              strokeWidth="1.4"
              transform={`rotate(${status === "higher" ? -18 : 18} 20 20)`}
            />
          </g>
          <path
            d={status === "higher" ? "M16 21.2 L20 17.2 L24 21.2" : "M16 18.8 L20 22.8 L24 18.8"}
            fill="none"
            stroke="#fffdf7"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      {status === "incorrect" && (
        <>
          <circle cx="20" cy="20" r="13" fill="#fffdf7" stroke="#c17287" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="3" fill="#c17287" />
        </>
      )}

      {status === "not_applicable" && (
        <circle cx="20" cy="20" r="13" fill="none" stroke="#d8cdb6" strokeWidth="1.4" strokeDasharray="2.5 3" />
      )}
    </svg>
  )
}
