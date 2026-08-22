import { ResultIndicator } from "./ResultIndicator"
import { MAX_GUESSES, MAX_HINTS } from "../lib/gameConstants"

const LEGEND: { status: Parameters<typeof ResultIndicator>[0]["status"]; label: string; detail: string }[] = [
  { status: "correct", label: "Correct", detail: "Exact match, or within 2% for numbers / 3°C for temperature." },
  { status: "close", label: "Close", detail: "Within 15% for numbers, or within 25°C for temperature." },
  { status: "higher", label: "Higher", detail: "The answer's value is higher than your guess." },
  { status: "lower", label: "Lower", detail: "The answer's value is lower than your guess." },
  { status: "incorrect", label: "Incorrect", detail: "Not a match, and not within any tolerance." },
  { status: "not_applicable", label: "N/A", detail: "This property doesn't apply to one of the two objects (e.g. comparing rings on a star)." },
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

        <p className="mb-3 text-sm text-[#4d4d4d]">
          There's a mystery celestial object: a planet, moon, star, galaxy, whatever the universe throws
          at you. Find it in {MAX_GUESSES} guesses or fewer.
        </p>

        <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm text-[#4d4d4d]">
          <li>Search for and select any celestial object as your guess.</li>
          <li>Your guess is compared to the mystery object property-by-property: distance, size, temperature, moons, whatever applies to its category, and each one gets a colored square.</li>
          <li>Read the squares (legend below) to narrow down what the answer could be, then guess again.</li>
          <li>Guess the exact object, or run out of guesses and see the answer revealed.</li>
        </ol>

        <div className="mb-4 rounded-lg border border-[#e0e0e0] bg-[#fff8e7] p-3">
          <div className="mb-2 text-sm font-bold uppercase tracking-wide text-[#4d4d4d]">Legend</div>
          <div className="space-y-2.5">
            {LEGEND.map(({ status, label, detail }) => (
              <div key={status} className="flex items-start gap-3 text-sm text-[#1a1a1a]">
                <ResultIndicator status={status} title={label} />
                <div>
                  <div className="font-semibold">{label}</div>
                  <div className="text-xs text-[#4d4d4d]">{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-[#e0e0e0] bg-[#fff8e7] p-3 text-sm text-[#4d4d4d]">
          <div className="mb-2 text-sm font-bold uppercase tracking-wide text-[#4d4d4d]">Hints</div>
          <p>
            Your first hint is free and shows up before you guess anything. After that the Hint button
            reveals another of the mystery object's properties, starting with whichever one narrows the
            field most and skipping anything your guesses have already pinned down. Numbers come back as
            a range rather than the exact value, so a hint points you at the right scale without handing
            you the answer. You get {MAX_HINTS} on top of the free one, plus another free reveal every
            four wrong guesses, and none of them cost you anything: a win is a win and extends your
            streak however many hints it took.
          </p>
        </div>

        <div className="mb-4 rounded-lg border border-[#e0e0e0] bg-[#fff8e7] p-3 text-sm text-[#4d4d4d]">
          <div className="mb-2 text-sm font-bold uppercase tracking-wide text-[#4d4d4d]">Dates</div>
          <p>
            Telescopic objects show the year they were discovered. Stars and constellations you can see with
            the naked eye were never discovered, so they show the earliest catalogue that records them
            instead: AD 150 for anything in Ptolemy's Almagest, otherwise the year their constellation was
            introduced. A few objects, like the Sun and the naked-eye planets, have no first record at all
            and simply read Prehistoric.
          </p>
        </div>

        <div className="rounded-lg border border-[#e0e0e0] bg-[#fff8e7] p-3 text-sm text-[#4d4d4d]">
          <div className="mb-2 text-sm font-bold uppercase tracking-wide text-[#4d4d4d]">Modes</div>
          <ul className="space-y-1.5">
            <li><span className="font-semibold text-[#1a1a1a]">Daily:</span> one puzzle a day, same for everyone. Wins/losses count toward your Played, Win %, and Streak stats.</li>
            <li><span className="font-semibold text-[#1a1a1a]">Practice:</span> unlimited random rounds, anytime. Doesn't affect your stats.</li>
            <li><span className="font-semibold text-[#1a1a1a]">Archive:</span> replay any past daily puzzle you missed.</li>
          </ul>
        </div>

        <div className="mt-4 rounded-lg border border-[#e0e0e0] bg-[#fff8e7] p-3 text-sm text-[#4d4d4d]">
          <div className="mb-2 text-sm font-bold uppercase tracking-wide text-[#4d4d4d]">Giving up</div>
          <p>
            I Give Up ends the day and shows you the answer. On the daily puzzle it resets your streak to
            zero, but that is the whole cost: it is not recorded as a loss, so your Played count and Win %
            stay where they were.
          </p>
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
