// Shared parsing for MediaWiki infobox wikitext, used by every verify-*.mjs script that cross-checks
// the dataset against a Wikipedia article. Handles the handful of infobox quirks that recur across
// unrelated article types: {{convert}}/{{cvt}}/{{val}} templates, wikilinked units, indented pipes,
// and citations that got truncated mid-template by a single-line field capture.

export const LY_PER_UNIT = { ly: 1, kly: 1e3, mly: 1e6, gly: 1e9, pc: 3.26156, kpc: 3261.56, mpc: 3.26156e6 }
export const MAGNITUDE_WORD = { thousand: 1e3, million: 1e6, billion: 1e9 }
export const MSUN_KG = 1.989e30

// A short, generic key like "z" collides with unrelated templates elsewhere on the page (a
// {{WikiSky|z=7}} external-link template's zoom level, say), so extraction is scoped to the first
// {{Infobox ...}} block rather than the whole article. Brace depth is tracked explicitly because
// the infobox nests other templates ({{cite}}, {{val}}, ...) before it closes.
function infoboxSlice(wikitext) {
  const start = wikitext.search(/\{\{\s*Infobox\b/i)
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < wikitext.length; ) {
    if (wikitext.startsWith("{{", i)) { depth++; i += 2 }
    else if (wikitext.startsWith("}}", i)) { depth--; i += 2; if (depth === 0) return wikitext.slice(start, i) }
    else i++
  }
  return wikitext.slice(start)
}

// Infobox lines are usually "\n| key = value", but some articles indent the pipe with a leading
// space ("\n | key = value"), and a compact infobox can pack several "|key=value" pairs onto one
// line with no newline between them (seen on GW170817's event_type/name/redshift/host run). The
// packed form is only safe to recover for a field whose value is a plain number with no pipes or
// brackets of its own, so it's a fallback rather than the primary pattern.
export function extractField(wikitext, key) {
  const scope = infoboxSlice(wikitext) ?? wikitext
  const anchored = scope.match(new RegExp("\\n[ \\t]*\\|\\s*" + key + "\\s*=([^\\n]*)"))
  if (anchored) return anchored[1].trim()
  const packed = scope.match(new RegExp("\\|\\s*" + key + "\\s*=\\s*(-?[\\d.]+)"))
  return packed ? packed[1] : null
}

export function firstNonEmpty(wikitext, keys) {
  for (const key of keys) {
    const v = extractField(wikitext, key)
    if (v != null && v !== "") return v
  }
  return null
}

// extractField only captures up to the first newline (or the next "|" in the packed case), so a
// citation whose <ref>...</ref> spans multiple lines gets cut mid-citation, leaving a dangling
// "<ref ...>{{cite journal" with no closing tag. That leftover template syntax must be dropped
// along with the rest of the citation, or the "{{" it contains falsely reads as an unparsed
// convert/val template further down.
export function stripMarkup(text) {
  return text
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*$/i, "")
    .replace(/\{\{circa\}\}/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
}

// [[target|display]] and [[target]] wikilinks are how a bare "value Unit" field spells its unit
// (e.g. "11.4 [[light-year|Mly]]"), so the unit word only becomes visible once links are flattened.
export function flattenWikilinks(text) {
  return text.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2").replace(/\[\[([^\]]*)\]\]/g, "$1")
}

// {{val|...}} numbers fold their power of ten into a separate e= parameter rather than the main
// number (e.g. "{{val|1.15|e=12}}" means 1.15e12), and a distance/size field may name its unit via
// ul= (e.g. "{{val|3.3|0.9|ul=kly}}") instead of leaving it implicitly in light-years. Pass
// {toLy: true} to apply that unit conversion; otherwise the raw number (with its exponent) is
// returned as-is, which is what a mass or count field wants.
export function parseValTemplate(text, { toLy = false } = {}) {
  const m = text.match(/\{\{val\|([^}]*)\}\}/i)
  if (!m) return null
  let mainNumber = null
  let exponent = 0
  let unit = null
  for (const part of m[1].split("|").map(s => s.trim())) {
    const named = part.match(/^([a-z]+)\s*=\s*(.*)$/i)
    if (named) {
      if (named[1].toLowerCase() === "e") exponent = Number(named[2])
      else if (/^ul?$/i.test(named[1])) unit = named[2].trim()
      continue
    }
    const cleaned = part.replace(/,/g, "")
    if (mainNumber === null && /^-?\d+(\.\d+)?$/.test(cleaned)) mainNumber = Number(cleaned)
  }
  if (mainNumber === null) return null
  if (!toLy) return mainNumber * Math.pow(10, exponent)
  const factor = unit ? LY_PER_UNIT[unit.toLowerCase()] : 1
  return factor == null ? null : mainNumber * Math.pow(10, exponent) * factor
}

// {{convert|...}} and {{cvt|...}} give the article's own figure in its own unit, followed by a unit
// it's been converted to for display. The FIRST unit token is the one the number is actually in;
// everything after it (including an uncertainty like "±5.4") is just presentation. The value token
// can carry its uncertainty inline ("3.675 ± 0.049") rather than as a separate pipe-delimited part,
// so a numeric token is one whose TRIMMED text starts with a number, not one that is purely a number.
export function parseConvertToLy(text) {
  const m = text.match(/\{\{c(?:onvert|vt)\|([^}]*)\}\}/i)
  if (!m) return null
  const parts = m[1].split("|").map(s => s.trim())
  let i = 0
  while (i < parts.length && !/^-?[\d,]+(\.\d+)?/.test(parts[i])) i++
  if (i >= parts.length) return null
  const value = Number(parts[i].match(/^-?[\d,]+(\.\d+)?/)[0].replace(/,/g, ""))
  let j = i + 1
  if (parts[j] === "±" || parts[j] === "+/-") j++
  if (/^-?[\d,]+(\.\d+)?$/.test(parts[j])) j++
  const factor = LY_PER_UNIT[(parts[j] || "").toLowerCase()]
  return factor == null ? null : value * factor
}

// A handful of distance/size fields skip templates entirely and just write the figure in prose,
// with the unit spelled out as a (usually wikilinked) word: "11.4-12.4 Mly", "20.34 light years",
// "2.4 billion ly".
export function parsePlainUnitValue(text) {
  const m = text.replace(/,/g, "").match(
    /(-?\d+(?:\.\d+)?)(?:[\s–-]*\d+(?:\.\d+)?)?(?:\s*±\s*\d+(?:\.\d+)?)?\s*(thousand|million|billion)?\s*(ly|light[\s-]?years?|kly|mly|gly|pc|kpc|mpc)\b/i
  )
  if (!m) return null
  const unit = /^light/i.test(m[3]) ? "ly" : m[3].toLowerCase()
  const factor = LY_PER_UNIT[unit]
  if (factor == null) return null
  const magnitude = m[2] ? MAGNITUDE_WORD[m[2].toLowerCase()] : 1
  return Number(m[1]) * magnitude * factor
}

// Distance/size fields are a mix of {{convert}}/{{cvt}}, {{val|...|ul=unit}}, and plain prose with a
// unit word; a bare number with no unit at all is the rare last resort. A template that fails to
// parse must not fall through to reading its raw, unit-less number as if already in light-years.
export function parseLyField(text) {
  if (text == null) return null
  // A field like "Core: 0.2" or "10 light-years (core radius)" describes a named substructure (the
  // dense center of a cluster or nebula, say), not the object as a whole, and using it would
  // silently understate the real figure.
  if (/^\s*[a-z][a-z ]*:/i.test(text) || /\bcore\b/i.test(text)) return null
  const clean = flattenWikilinks(stripMarkup(text))
  const converted = parseConvertToLy(clean)
  if (converted != null) return converted
  const val = parseValTemplate(clean, { toLy: true })
  if (val != null) return val
  const plain = parsePlainUnitValue(clean)
  if (plain != null) return plain
  if (/\{\{/.test(clean)) return null
  const m = clean.replace(/,/g, "").match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

// A plain number field (mass in solar masses, apparent magnitude, redshift), which may still be
// wrapped in a {{val}} template even though it carries no unit to convert.
export function parseBareNumber(text) {
  if (text == null) return null
  const clean = flattenWikilinks(stripMarkup(text)).replace(/,/g, "").replace(/−/g, "-")
  if (/\{\{/.test(clean)) return parseValTemplate(clean)
  const m = clean.match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}
