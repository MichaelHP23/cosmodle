import { MAX_GUESSES } from "../lib/gameConstants"

// Collapsed rather than deleted. The text is genuine, non-spoiler content about the game and it earns
// its place on the page for search and for advertising review, but a bordered wall of body copy
// directly under the board was the loudest thing after the board itself. A <details> keeps every word
// in the markup — crawlers read expandable content normally — while letting the board end quietly.
export function GameInfo() {
  return (
    <details className="group mx-auto mt-8 w-full max-w-[728px] border-t border-[#ece2cd] pt-4">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] text-[#8b8598] hover:text-[#2f2b40] [&::-webkit-details-marker]:hidden">
        <svg
          className="transition-transform group-open:rotate-90"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
        About this game
      </summary>

      <div className="mt-3 text-sm leading-relaxed text-[#6b6579]">
        <p>
          {/* Read from the constant rather than spelled out, so the copy cannot drift away from the rule
              the game actually enforces the way "seven" did. */}
          Cosmodle picks one celestial object out of the whole sky each day and asks you to name it in{" "}
          {MAX_GUESSES} guesses or fewer. Every guess you make gets checked property by property — distance, diameter, mass,
          temperature, orbital period, number of moons, whatever applies to that kind of object — against the
          real answer, so you learn whether you're above or below it and close in from there. No sign-up, and
          a fresh round is always waiting in Practice mode if you want another one right now.
        </p>
        <p className="mt-2">
          The figures behind every guess come from published astronomical catalogues — NASA and JPL for
          planetary and orbital data, SIMBAD for stellar measurements, Wikipedia for the rest — rounded for
          readability but not invented. The <a className="underline hover:text-[#2f2b40]" href="/about">About
          page</a> has the full breakdown of where each number comes from and how the daily object is chosen.
        </p>
      </div>
    </details>
  )
}
