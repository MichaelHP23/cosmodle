import { dateForDayNumber } from "../lib/dailyObject"

function formatArchiveDate(dayNumber: number): string {
  return dateForDayNumber(dayNumber).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function ArchiveList({
  todayDayNumber,
  onSelect,
}: {
  todayDayNumber: number
  onSelect: (dayNumber: number) => void
}) {
  const pastDayNumbers = Array.from({ length: todayDayNumber - 1 }, (_, i) => todayDayNumber - 1 - i)

  if (pastDayNumbers.length === 0) {
    return (
      <div className="rounded-xl border-2 border-[#4d4d4d] bg-white p-6 text-center text-[#4d4d4d]">
        No previous puzzles yet — check back tomorrow for Cosmodle #{todayDayNumber + 1}.
      </div>
    )
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto rounded-xl border-2 border-[#4d4d4d] bg-white">
      <ul className="divide-y divide-[#e0e0e0]">
        {pastDayNumbers.map(dayNumber => (
          <li key={dayNumber}>
            <button
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#f0f0f0]"
              onClick={() => onSelect(dayNumber)}
            >
              <span className="font-semibold text-[#1a1a1a]">Cosmodle #{dayNumber}</span>
              <span className="text-sm text-[#4d4d4d]">{formatArchiveDate(dayNumber)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
