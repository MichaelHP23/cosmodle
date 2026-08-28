import fs from "node:fs"

export function renderReport(list) {
  if (list.length === 0) return "no changes proposed"
  const lines = list.map(
    c => `${c.id}.${c.field}: ${c.from} -> ${c.to}  (${c.reason}; source: ${c.source})`
  )
  return lines.join("\n") + `\n\n${list.length} change(s) proposed`
}

// The staleness guard matters because a report may be reviewed hours after it was generated, and
// applying a change whose starting value has since moved would silently clobber the newer value.
export function applyChanges(datasetPath, list) {
  const data = JSON.parse(fs.readFileSync(datasetPath, "utf8"))
  for (const c of list) {
    const obj = data.find(o => o.id === c.id)
    if (!obj) throw new Error("applyChanges: no object with id " + c.id)
    if (obj[c.field] !== c.from) {
      throw new Error(
        `applyChanges: ${c.id}.${c.field} is ${obj[c.field]}, expected ${c.from}; regenerate the report`
      )
    }
  }
  for (const c of list) data.find(o => o.id === c.id)[c.field] = c.to
  fs.writeFileSync(datasetPath, JSON.stringify(data, null, 2) + "\n")
  return list.length
}
