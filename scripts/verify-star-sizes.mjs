import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// Torres (2010) bolometric correction, a polynomial in log10(Teff).
export function bolometricCorrection(teff) {
  const x = Math.log10(teff)
  const poly = c => c.reduce((sum, k, i) => sum + k * x ** i, 0)
  if (x < 3.7) return poly([-19053.7291496456, 15514.4866764412, -4212.78819301717, 381.476328422343])
  if (x < 3.9) return poly([-37051.0203809015, 38567.2629965804, -15065.1486316025, 2617.24637119416, -170.623810323864])
  return poly([-118115.450538963, 137145.973583929, -63623.3812100225, 14741.2923562646, -1705.87278406872, 78.8731721804990])
}

// Predicted apparent V magnitude from radius, temperature and distance.
export function predictedMagnitude({ radiusSolar, teff, distanceLy }) {
  const luminositySolar = radiusSolar ** 2 * (teff / 5772) ** 4
  const bolometricAbsolute = 4.74 - 2.5 * Math.log10(luminositySolar)
  const visualAbsolute = bolometricAbsolute - bolometricCorrection(teff)
  const distanceParsecs = distanceLy / 3.2615638
  return visualAbsolute + 5 * Math.log10(distanceParsecs) - 5
}

const SOLAR_DIAMETER_KM = 1391000

// Closure cannot work for these, so flagging them every run would only train the reader to ignore
// the report. The two dust-reddened supergiants are the honest limit of the formula rather than a
// limit of the data: it converts luminosity straight to apparent magnitude with no extinction term,
// so any star seen through significant dust is predicted brighter than it really looks.
export const KNOWN = {
  sun: "the Sun's distance is not stored in light years to useful precision",
  capella: "two G giants of similar brightness, and the dataset records only the larger one's radius",
  proxima_centauri: "an M5.5 dwarf, where the Torres bolometric correction is least reliable",
  barnards_star: "an M4 dwarf, where the Torres bolometric correction is least reliable",
  mu_cephei: "a reddened supergiant, and the closure carries no interstellar extinction term",
  vy_canis_majoris: "a hypergiant inside its own dust cocoon, which dims it by several magnitudes",
}

// The report only runs when the file is executed directly, so importing it from a test stays silent.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const dataset = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/celestialObjects.json"), "utf8"))
  const rows = []
  for (const star of dataset.filter(o => o.category === "star")) {
    const { diameterKm, temperatureK, distanceFromEarthLy, apparentMagnitude } = star
    if (![diameterKm, temperatureK, distanceFromEarthLy, apparentMagnitude].every(v => typeof v === "number")) continue
    if (KNOWN[star.id]) continue
    const predicted = predictedMagnitude({
      radiusSolar: diameterKm / SOLAR_DIAMETER_KM,
      teff: temperatureK,
      distanceLy: distanceFromEarthLy,
    })
    const delta = predicted - apparentMagnitude
    if (Math.abs(delta) > 0.75) rows.push({ id: star.id, stated: apparentMagnitude, predicted: Number(predicted.toFixed(2)), delta: Number(delta.toFixed(2)) })
  }
  rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  for (const r of rows) console.log(`${r.id}: stated V=${r.stated}, radius and temperature predict V=${r.predicted} (delta ${r.delta})`)
  console.log(`\n${rows.length} star(s) outside 0.75 mag of closure`)
}
