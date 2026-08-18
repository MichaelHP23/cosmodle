import { useState } from "react"
import type { CelestialObject } from "../types/celestial"
import { getObjectColor } from "../lib/objectVisuals"

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

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
  const [imageFailed, setImageFailed] = useState(false)

  if (object.imageUrl && !imageFailed) {
    return (
      <img
        src={object.imageUrl}
        alt={object.name}
        width={size}
        height={size}
        className="portrait-pop mx-auto rounded-full object-cover shadow-md"
        style={{ width: size, height: size }}
        onError={() => setImageFailed(true)}
      />
    )
  }

  return <GeneratedPortrait object={object} size={size} />
}
