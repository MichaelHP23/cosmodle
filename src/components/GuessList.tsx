import { useState } from "react"
import type { CelestialObject } from "../types/celestial"
import type { ComparisonStatus, ProfileEntry } from "../types/game"
import { compareProperty } from "../lib/comparison"
import { getComparableValue } from "../lib/objectProfiles"
import { formatPropertyValue } from "../lib/formatting"
import { MARK_TONES } from "../lib/statusColors"
import { StatusOrb } from "./StatusOrb"

type GuessRow = {
  guess: CelestialObject
  cells: { entry: ProfileEntry; status: ComparisonStatus; value: string }[]
}

// The old board was a table one column wide per property, which on a phone meant a horizontal scroll
// and a value hidden behind a hover tooltip that a touchscreen never fires. Here each guess is a row
// that fits the screen, and opening one lays its properties out in a grid that wraps instead of
// scrolling sideways.
export function GuessList({
  profile,
  guesses,
  answer,
  dataset,
}: {
  profile: ProfileEntry[]
  guesses: CelestialObject[]
  answer: CelestialObject
  dataset: CelestialObject[]
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (guesses.length === 0) return null

  const rows: GuessRow[] = [...guesses].reverse().map(guess => ({
    guess,
    cells: profile.map(entry => {
      const value = getComparableValue(guess, entry.property, dataset)
      const answerValue = getComparableValue(answer, entry.property, dataset)
      return {
        entry,
        status: compareProperty(value, answerValue, entry.kind).status,
        value: formatPropertyValue(entry.property, value),
      }
    }),
  }))

  return (
    <div>
      {rows.map(({ guess, cells }) => {
        const open = openId === guess.id
        return (
          <div key={guess.id} className="border-b border-[#ece2cd] last:border-b-0">
            <button
              className="flex w-full items-center justify-between gap-3 px-0.5 py-3 text-left"
              onClick={() => setOpenId(open ? null : guess.id)}
              aria-expanded={open}
            >
              <span className="min-w-0 truncate text-[14.5px] font-semibold text-[#2f2b40]">
                {guess.name}
                <span className="ml-[7px] text-[12.5px] font-normal text-[#8b8598]">
                  {guess.category.replace(/_/g, " ")}
                </span>
              </span>
              <span className="flex shrink-0 gap-[5px]" aria-hidden="true">
                {cells.map(cell => (
                  <span
                    key={cell.entry.property}
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ background: MARK_TONES[cell.status] }}
                  />
                ))}
              </span>
            </button>

            {open && (
              <div className="grid grid-cols-4 gap-x-1 gap-y-3 px-1 pb-4 pt-1">
                {cells.map(cell => (
                  <div key={cell.entry.property} className="flex flex-col items-center gap-1">
                    {/* Fixed height for the label: "Average Temperature" wraps to two lines where
                        "Mass" does not, and without it the orbs in a row sit at different heights. */}
                    <span className="flex h-[22px] items-center text-center text-[9.5px] leading-tight text-[#8b8598]">
                      {cell.entry.label}
                    </span>
                    <StatusOrb status={cell.status} size={26} title={`${cell.entry.label}: ${cell.value}`} />
                    <span className="text-center text-[10px] font-semibold leading-tight text-[#2f2b40]">
                      {cell.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
