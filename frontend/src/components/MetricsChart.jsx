import { useEffect, useState } from 'react'

/**
 * Finds the first markdown pipe-table in `markdown` and returns
 * { headers, rows } where rows is an array of string arrays, or null if no
 * table is found. Deliberately simple (no full CommonMark table parsing) —
 * good enough for the well-formed tables our own report_writer produces.
 */
function extractFirstTable(markdown) {
  if (!markdown) return null
  const lines = markdown.split('\n')
  for (let i = 0; i < lines.length - 1; i++) {
    const isRow = /^\s*\|.*\|\s*$/.test(lines[i])
    const isSeparator = /^\s*\|?[\s:-]+\|[\s:|-]+\s*$/.test(lines[i + 1] || '')
    if (isRow && isSeparator) {
      const parseRow = (line) =>
        line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
      const headers = parseRow(lines[i])
      const rows = []
      for (let j = i + 2; j < lines.length; j++) {
        if (!/^\s*\|.*\|\s*$/.test(lines[j])) break
        rows.push(parseRow(lines[j]))
      }
      return { headers, rows }
    }
  }
  return null
}

/** First column index (after the label column) whose values are all
 * parseable as numbers across every row — that's our chart column. */
function findNumericColumn(headers, rows) {
  for (let col = 1; col < headers.length; col++) {
    const values = rows.map((r) => parseFloat((r[col] || '').replace(/[^\d.\-]/g, '')))
    if (values.length > 0 && values.every((v) => !Number.isNaN(v))) {
      return { col, values }
    }
  }
  return null
}

export default function MetricsChart({ reportMarkdown }) {
  const table = extractFirstTable(reportMarkdown)
  const numeric = table ? findNumericColumn(table.headers, table.rows) : null
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (numeric) {
      const id = requestAnimationFrame(() => setAnimated(true))
      return () => cancelAnimationFrame(id)
    }
  }, [numeric])

  if (!table || table.rows.length === 0 || !numeric) return null

  const max = Math.max(...numeric.values, 0.0001)

  return (
    <div className="chart-block">
      <div className="chart-label">{table.headers[numeric.col]} by {table.headers[0].toLowerCase()}</div>
      {table.rows.map((row, i) => (
        <div className="bar-row" key={i}>
          <span className="name" title={row[0]}>{row[0]}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: animated ? `${(numeric.values[i] / max) * 100}%` : '0%' }} />
          </div>
          <span className="bar-val">{row[numeric.col]}</span>
        </div>
      ))}
    </div>
  )
}