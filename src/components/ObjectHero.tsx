import type { CelestialObject } from "../types/celestial"
import type { DescriptionClause } from "../lib/knowledge"
import { ObjectPortrait } from "./ObjectPortrait"

// A band rather than a panel. It used to spell out the object's distance, size and mass, which the
// knowledge panel then listed again immediately below — so it now carries only what the panel does
// not: what kind of thing is being hunted, and how far through the guesses you are. On reveal it
// grows into the answer itself, which is the one moment the space is worth spending.
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
  // The opening clause is the category — "A comet" — which is the whole of the identity worth showing
  // while the game is running. The rest of the sentence lives in the panel as rows.
  const lead = clauses[0]?.text ?? "Today's object"

  return (
    <div className="starfield-dark mb-5 rounded-2xl bg-[#241f38] px-4 pb-3.5 pt-3.5">
      <div className="flex items-center gap-3.5">
        {revealed ? (
          // Objects without a photo fall back to a generated portrait built for the light page, and a
          // dark one — a black hole, or an image that failed to load — all but disappears here. The
          // ring and the disc behind it keep the shape readable whatever ends up on top.
          <div className="shrink-0 rounded-full bg-white/10 ring-1 ring-white/20">
            <ObjectPortrait object={revealed} size={revealed ? 62 : 42} />
          </div>
        ) : (
          <div
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-dashed border-[#d99a2b]/45 bg-[#191430] text-[17px] font-bold text-[#d99a2b]"
            aria-hidden="true"
          >
            ?
          </div>
        )}

        <div className="min-w-0">
          <div className="text-[17px] font-semibold leading-tight text-white">
            {revealed ? revealed.name : lead}
          </div>
          <div className="mt-0.5 text-xs text-[#918ab0]">{status}</div>
        </div>
      </div>

      {revealed?.description && (
        <p className="mt-3 text-[13px] leading-relaxed text-[#cec8e2]">{revealed.description}</p>
      )}

      <div className="mt-3.5 h-[3px] overflow-hidden rounded-full bg-white/[0.13]" aria-hidden="true">
        <div
          className="h-full rounded-full bg-[#d99a2b] transition-all"
          style={{ width: `${Math.min(100, (guessCount / maxGuesses) * 100)}%` }}
        />
      </div>
    </div>
  )
}
