// The night sky behind the dark theme. Light mode keeps the flat ink speckles it has always had; this
// only ever paints when the dark class is on, which the stylesheet enforces rather than React.
//
// Three things make a generated field read as a sky rather than as scattered dots: stars crowd along
// the galactic plane instead of spreading evenly, their brightnesses follow a power law so nearly all
// are faint and a handful carry, and they are not all white — spectral colour runs blue through white
// and yellow to amber. All three are cheap; evenness is what looks fake.

const WIDTH = 390
const HEIGHT = 740
const STAR_COUNT = 205
const BRIGHT_COUNT = 3
const TWINKLER_COUNT = 30

// The board's words run down the middle of the screen. A bright star landing on a letter reads as a
// rendering fault, so the column is kept to faint pinpricks and the bright ones live in the gutters.
const TEXT_LEFT = 0.07
const TEXT_RIGHT = 0.93
const inTextColumn = (x: number) => x > TEXT_LEFT && x < TEXT_RIGHT

// Spectral classes, weighted the way the eye picks them out: mostly yellow-white, a few hot blues and
// cool oranges at the edges.
const COLORS: [string, number][] = [
  ["#cfe0ff", 8],
  ["#eef2ff", 18],
  ["#fffaf0", 34],
  ["#ffe9c4", 22],
  ["#ffd2a8", 12],
  ["#ffc0a0", 6],
]
const TOTAL_WEIGHT = COLORS.reduce((sum, [, weight]) => sum + weight, 0)

// Seeded rather than Math.random: the sky is generated once at module load and is the same on every
// render and every reload. A field that reshuffled as you played would read as a glitch.
function seeded(seed: number) {
  return () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
}

function pickColor(random: () => number): string {
  let remaining = random() * TOTAL_WEIGHT
  for (const [color, weight] of COLORS) {
    remaining -= weight
    if (remaining <= 0) return color
  }
  return "#fffaf0"
}

// Stars are far likelier to survive near the galactic band, which runs diagonally across the frame.
function bandDensity(x: number, y: number): number {
  const centre = 0.42 + (x - 0.5) * 0.55
  return 0.18 + 0.82 * Math.exp(-(((y - centre) / 0.22) ** 2))
}

type Star = { x: number; y: number; r: number; fill: string; opacity: number }
type Bright = { x: number; y: number; fill: string }
type Twinkler = { left: string; top: string; size: number; fill: string; curve: string; dur: string; delay: string; glow: boolean }

function buildSky() {
  const random = seeded(20260913)
  const stars: Star[] = []
  const bright: Bright[] = []
  const twinklers: Twinkler[] = []

  for (let guard = 0; stars.length < STAR_COUNT && guard < 6000; guard++) {
    const x = random()
    const y = random()
    if (random() > bandDensity(x, y)) continue
    // Power law: nearly all faint, a few that carry.
    let magnitude = Math.pow(random(), 2.6)
    if (inTextColumn(x)) magnitude = Math.min(magnitude, 0.3)
    stars.push({
      x: Number((x * WIDTH).toFixed(1)),
      y: Number((y * HEIGHT).toFixed(1)),
      r: Number((0.35 + magnitude * 1.5).toFixed(2)),
      fill: pickColor(random),
      opacity: Number(((0.16 + magnitude * 0.66) * (inTextColumn(x) ? 0.62 : 1) * 0.72).toFixed(3)),
    })
  }

  for (let i = 0; i < BRIGHT_COUNT; i++) {
    const side = random()
    const x = side < 0.42 ? random() * TEXT_LEFT : side < 0.84 ? TEXT_RIGHT + random() * (1 - TEXT_RIGHT) : random()
    const y = side < 0.84 ? 0.05 + random() * 0.9 : 0.8 + random() * 0.17
    bright.push({ x: Number((x * WIDTH).toFixed(1)), y: Number((y * HEIGHT).toFixed(1)), fill: pickColor(random) })
  }

  const curves = ["tw-dim", "tw-mid", "tw-lit"]
  for (let guard = 0; twinklers.length < TWINKLER_COUNT && guard < 2000; guard++) {
    const x = random()
    const y = random()
    if (random() > bandDensity(x, y)) continue
    let magnitude = Math.pow(random(), 2)
    if (inTextColumn(x)) magnitude = Math.min(magnitude, 0.34)
    const fill = pickColor(random)
    twinklers.push({
      left: (x * 100).toFixed(2) + "%",
      top: (y * 100).toFixed(2) + "%",
      size: Number((0.9 + magnitude * 1.9).toFixed(2)),
      fill,
      curve: curves[Math.min(2, Math.floor(magnitude * 3.2))],
      dur: (3.4 + random() * 5).toFixed(2) + "s",
      delay: (random() * 7).toFixed(2) + "s",
      glow: magnitude > 0.72 && !inTextColumn(x),
    })
  }

  return { stars, bright, twinklers }
}

const SKY = buildSky()
const SPIKE = 5

export function StarField() {
  return (
    <div className="sky-rich" aria-hidden="true">
      <div className="sky-haze" />
      {/* The dense field is one painted SVG that never animates. A few hundred pulsing elements would
          cost real battery on a phone for something nobody would be able to point at. */}
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
        {SKY.stars.map((star, i) => (
          <circle key={i} cx={star.x} cy={star.y} r={star.r} fill={star.fill} opacity={star.opacity} />
        ))}
        {SKY.bright.map((star, i) => (
          <g key={`b${i}`} fill={star.fill}>
            <circle cx={star.x} cy={star.y} r="7" opacity="0.05" />
            <circle cx={star.x} cy={star.y} r="3.4" opacity="0.094" />
            <rect x={star.x - 0.4} y={star.y - SPIKE} width="0.8" height={SPIKE * 2} opacity="0.216" />
            <rect x={star.x - SPIKE} y={star.y - 0.4} width={SPIKE * 2} height="0.8" opacity="0.216" />
            <circle cx={star.x} cy={star.y} r="1.5" opacity="0.68" />
          </g>
        ))}
      </svg>
      {SKY.twinklers.map((star, i) => (
        <span
          key={i}
          className="sky-tw"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            background: star.fill,
            boxShadow: star.glow ? `0 0 5px ${star.fill}` : undefined,
            animationName: star.curve,
            animationDuration: star.dur,
            animationDelay: star.delay,
          }}
        />
      ))}
      <span className="sky-shooting" />
    </div>
  )
}
