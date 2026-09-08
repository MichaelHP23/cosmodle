import type { CelestialObject } from "../types/celestial"
import type { DescriptionClause } from "../lib/knowledge"
import { ObjectPortrait } from "./ObjectPortrait"

// The one dark block on the page, and the only element that says what the player is chasing. While the
// game is running it holds the sentence their own guesses have written; once it is over it holds the
// object itself, so there is no separate results panel to bolt on.
export function ObjectHero({
  clauses,
  guessCount,
  maxGuesses,
  revealed,
  status,
}: {
  clauses: DescriptionClause[]
  guessCount: number
  maxGuesses: number
  revealed: CelestialObject | null
  status: string
}) {
  return (
    <div className="starfield-dark mb-4 rounded-2xl bg-[#241f38] p-4">
      <div className="flex items-center gap-4">
        {revealed ? (
          // Objects without a photo fall back to a generated portrait built for the light page, and a
          // dark one — a black hole, or an image that failed to load — all but disappears here. The
          // ring and the disc behind it keep the shape readable whatever ends up on top.
          <div className="shrink-0 rounded-full bg-white/10 ring-1 ring-white/20">
            <ObjectPortrait object={revealed} size={74} />
          </div>
        ) : (
          <div
            className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-full border border-dashed border-[#e8a33d]/50 bg-[#191430] text-2xl font-bold text-[#e8a33d]"
            aria-hidden="true"
          >
            ?
          </div>
        )}

        <div className="min-w-0">
          {revealed ? (
            <div className="mb-1 text-xl font-bold leading-tight text-white">{revealed.name}</div>
          ) : (
            <div className="mb-1.5 text-[8.5px] font-bold uppercase tracking-[0.15em] text-[#9990b8]">
              Today's object
            </div>
          )}
          <p className="text-[13.5px] leading-relaxed text-[#cec8e2]">
            {clauses.map((clause, i) => (
              <span key={i}>
                {i > 0 && ", "}
                {/* Amber marks what the player has pinned down. Once the answer is out every clause is
                    pinned, and highlighting all of them would just be a wall of amber. */}
                <span className={!revealed && clause.state === "locked" ? "font-semibold text-[#e8a33d]" : ""}>
                  {clause.text}
                </span>
              </span>
            ))}
            .
          </p>
          {revealed?.description && (
            <p className="mt-1.5 text-xs leading-relaxed text-[#9990b8]">{revealed.description}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/10 pt-3">
        {/* A dot per guess meant fifteen of them, which read as clutter rather than as progress. A bar
            says the same thing at a glance and does not change shape if MAX_GUESSES ever does. */}
        <span className="h-1 w-24 shrink-0 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
          <span
            className="block h-full rounded-full bg-[#e8a33d] transition-all"
            style={{ width: `${Math.min(100, (guessCount / maxGuesses) * 100)}%` }}
          />
        </span>
        <span className="text-[11px] text-[#9990b8]">{status}</span>
      </div>
    </div>
  )
}
