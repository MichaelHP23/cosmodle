import { useState } from "react"
import type { CelestialObject } from "../types/celestial"
import { getObjectColor } from "../lib/objectVisuals"

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Fixed rather than random, so a cluster looks the same every time it is drawn: [cx, cy, radius] on a
// 100x100 viewBox, denser in the middle and thinning towards the edge.
const CLUSTER_STARS: [number, number, number][] = [
  [50, 48, 2.6], [42, 40, 2.1], [58, 43, 1.9], [46, 57, 2.3], [56, 58, 1.7],
  [37, 52, 1.6], [63, 52, 1.8], [50, 34, 1.5], [51, 66, 1.6], [33, 35, 1.3],
  [67, 36, 1.2], [30, 63, 1.4], [70, 62, 1.3], [44, 25, 1.1], [60, 24, 1.0],
  [24, 47, 1.1], [77, 48, 1.0], [38, 74, 1.2], [63, 73, 1.1], [50, 15, 0.9],
  [18, 30, 0.8], [82, 33, 0.9], [16, 68, 0.8], [85, 66, 0.8], [50, 84, 0.9],
]

function GeneratedPortrait({ object, size }: { object: CelestialObject; size: number }) {
  const color = getObjectColor(object)

  if (object.category === "black_hole") {
    return (
      <div
        className="portrait-pop mx-auto rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 50% 50%, #000 0%, #000 55%, ${color} 62%, #ff9d4d 68%, #000 72%)`,
          boxShadow: `0 0 ${size / 3}px ${hexToRgba("#ff9d4d", 0.5)}`,
        }}
      />
    )
  }

  // A cluster is a group of stars, not a body, so the sphere every other category falls back to was
  // drawing it as a planet. Scatter points across the disc instead, tighter towards the middle the way
  // a real cluster concentrates.
  if (object.category === "star_cluster") {
    return (
      <svg
        className="portrait-pop mx-auto"
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={object.name}
      >
        {CLUSTER_STARS.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity={0.55 + (r / 2.6) * 0.45} />
        ))}
      </svg>
    )
  }

  if (object.category === "nebula" || object.category === "galaxy" || object.category === "constellation") {
    return (
      <div
        className="portrait-pop mx-auto rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 35%, ${hexToRgba(color, 0.95)}, ${hexToRgba(color, 0.35)} 55%, transparent 75%)`,
          filter: "blur(2px)",
          boxShadow: `0 0 ${size / 2.5}px ${hexToRgba(color, 0.6)}`,
        }}
      />
    )
  }

  if (object.category === "star" || object.category === "quasar") {
    return (
      <div
        className="portrait-pop mx-auto rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 38% 35%, #fff 0%, ${color} 40%, ${color} 100%)`,
          boxShadow: `0 0 ${size / 2}px ${hexToRgba(color, 0.7)}`,
        }}
      />
    )
  }

  return (
    <div
      className="portrait-pop mx-auto rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 30%, ${hexToRgba("#ffffff", 0.5)}, ${color} 45%, ${hexToRgba("#000000", 0.35)} 100%)`,
        boxShadow: `inset -${size / 8}px -${size / 8}px ${size / 4}px rgba(0,0,0,0.35)`,
      }}
    />
  )
}

export function ObjectPortrait({ object, size = 96 }: { object: CelestialObject; size?: number }) {
  // Remembering which URL failed rather than that one did: a single failure used to latch the
  // component into its generated portrait, so every later object it rendered lost its photograph too.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const imageFailed = failedUrl !== null && failedUrl === object.imageUrl

  if (object.imageUrl && !imageFailed) {
    return (
      <img
        src={object.imageUrl}
        alt={object.name}
        width={size}
        height={size}
        className="portrait-pop mx-auto rounded-full object-cover shadow-md"
        style={{ width: size, height: size }}
        onError={() => setFailedUrl(object.imageUrl ?? null)}
      />
    )
  }

  return <GeneratedPortrait object={object} size={size} />
}
