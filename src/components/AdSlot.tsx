// The height is reserved before anything loads, because an ad that pushes the guess table down as
// the player is reading it is worse than no ad at all. When consent is absent or the slot is
// disabled this still renders the reserved box, so the layout is identical either way.
export function AdSlot({ id, height = 90 }: { id: string; height?: number }) {
  return (
    <div
      id={id}
      style={{ minHeight: height }}
      className="mx-auto flex w-full max-w-[728px] items-center justify-center"
      aria-hidden="true"
    />
  )
}
