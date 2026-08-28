import { useEffect, useRef } from "react"
import { getAdClient, getAdSlot } from "../lib/ads"

const RESERVED_HEIGHT = 90

// The height is reserved before anything loads, because an ad that pushes the guess table down as
// the player is reading it is worse than no ad at all. When consent is absent or the slot is
// disabled this still renders the reserved box, so the layout is identical either way.
export function AdSlot({ id }: { id: string }) {
  const insRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)
  const client = getAdClient()
  const adSlot = getAdSlot()
  const showAd = client !== null && adSlot !== null

  useEffect(() => {
    const ins = insRef.current
    if (!ins || pushed.current) return
    // StrictMode runs mount effects twice, and AdSense reads a second push for a slot it has already
    // filled as a duplicate request: "All ins elements in the DOM with class=adsbygoogle already
    // have ads in them". The ref survives the remount, so one push is all this can ever make.
    pushed.current = true
    window.adsbygoogle = window.adsbygoogle ?? []
    window.adsbygoogle.push({})
  }, [showAd])

  return (
    <div
      id={id}
      style={{ minHeight: RESERVED_HEIGHT }}
      className="mx-auto flex w-full max-w-[728px] items-center justify-center"
      // An empty box is decoration and worth hiding, but a real ad is content a sighted player can
      // see and act on, so it stays in the accessibility tree once there is something in it.
      aria-hidden={showAd ? undefined : true}
    >
      {showAd && (
        <ins
          ref={insRef}
          // The reserved box is a flex container, so without a stated width the ins would shrink to
          // nothing and the responsive unit would have no room to size itself into.
          className="adsbygoogle w-full"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  )
}
