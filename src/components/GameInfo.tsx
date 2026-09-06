export function GameInfo() {
  return (
    <div className="mx-auto mt-8 w-full max-w-[728px] rounded-lg border border-[#e0e0e0] bg-[#fff8e7] p-4 text-sm text-[#4d4d4d]">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#4d4d4d]">About this game</h2>
      <p>
        Cosmodle picks one celestial object out of the whole sky each day and asks you to name it in seven
        guesses or fewer. Every guess you make gets checked property by property — distance, diameter, mass,
        temperature, orbital period, number of moons, whatever applies to that kind of object — against the
        real answer, so you learn whether you're above or below it and close in from there. No sign-up, and
        a fresh round is always waiting in Practice mode if you want another one right now.
      </p>
      <p className="mt-2">
        The figures behind every guess come from published astronomical catalogues — NASA and JPL for
        planetary and orbital data, SIMBAD for stellar measurements, Wikipedia for the rest — rounded for
        readability but not invented. The <a className="underline hover:text-[#00998a]" href="/about">About
        page</a> has the full breakdown of where each number comes from and how the daily object is chosen.
      </p>
    </div>
  )
}
