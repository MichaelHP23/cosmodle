import { ResultIndicator } from "./ResultIndicator"

const LEGEND: { status: Parameters<typeof ResultIndicator>[0]["status"]; label: string }[] = [
  { status: "correct", label: "Exact match" },
  { status: "close", label: "Close, within tolerance" },
  { status: "higher", label: "Answer is higher" },
  { status: "lower", label: "Answer is lower" },
  { status: "incorrect", label: "No match" },
  { status: "not_applicable", label: "Property doesn't apply to one of the objects" },
]

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto bg-black/50 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="mx-auto my-8 w-full max-w-md rounded-xl border-2 border-[#4d4d4d] bg-[#f7f7f7] p-6">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-[#1a1a1a]">How to Play</h2>
          <button
            className="text-[#8a8a8a] hover:text-[#4d4d4d]"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-[#4d4d4d]">
          Guess the mystery celestial object in 7 tries or fewer. Every guess compares that object's
          properties against the mystery object.
        </p>

        <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-[#4d4d4d]">
          <li>Search for and select any celestial object.</li>
          <li>Each property gets a colored square showing how close your guess was.</li>
          <li>Use those clues to narrow down the answer within 7 guesses.</li>
          <li>A new mystery object is chosen every day — everyone gets the same one.</li>
          <li>Play unlimited rounds anytime in Practice mode.</li>
        </ol>

        <div className="rounded-lg border border-[#e0e0e0] bg-white p-3">
          <div className="mb-2 text-sm font-bold uppercase tracking-wide text-[#4d4d4d]">Legend</div>
          <div className="space-y-2">
            {LEGEND.map(({ status, label }) => (
              <div key={status} className="flex items-center gap-3 text-sm text-[#1a1a1a]">
                <ResultIndicator status={status} title={label} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          className="mt-4 w-full rounded-lg border-2 border-[#00998a] bg-[#00b99b] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#00a68a]"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
