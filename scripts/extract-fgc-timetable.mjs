#!/usr/bin/env node
/**
 * Extracts the FGC Llobregat-Anoia printed timetable (Pl. Espanya <-> Martorell)
 * from the official PDF into src/data/fgcTimetable.ts.
 *
 * Run manually when FGC publishes a new poster; it is not part of the build:
 *
 *   node scripts/extract-fgc-timetable.mjs docs/timetables/s8_martorell_la.pdf
 *
 * Requires `mutool` (brew install mupdf-tools).
 *
 * Why mutool and not pdftotext: the poster draws its whole content twice, offset
 * by exactly dy = 30.83pt, and pdftotext emits both copies. mutool's stext output
 * has a single copy, and it also carries per-char colour and per-font names, which
 * is what lets us read the line (S4/S8/R5/...) off the Scr03 symbol glyphs.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'

// Station order of the outbound (Pl. Espanya -> Martorell) table. The inbound
// table prints the same 22 columns in reverse; we re-index it onto this order so
// every emitted trip is indexed identically.
const STATIONS = [
  'PE', 'MG', 'IC', 'EU', 'GO', 'SP', 'LH', 'AL', 'CO', 'BO', 'ML',
  'CG', 'CL', 'VH', 'CR', 'QC', 'PA', 'SA', 'PL', 'MV', 'MC', 'ME'
]

// Column centres, in PDF points. Both tables share this grid.
const COLUMN_X = STATIONS.map((_, i) => 58 + i * 25.78)
const COLUMN_TOLERANCE = 10
// Rows sit ~6.28pt apart; cells of one row vary by <2pt because glyph tops differ.
const ROW_TOLERANCE = 2
const MARKER_TOLERANCE = 3

// The Scr03 symbol font renders a line roundel per row. Glyph -> line, confirmed
// against the glyph colours, src/assets/lines/*.svg, and the live API's own
// route_short_name for the matching departures.
const LINE_BY_GLYPH = { s: 'S8', a: 'R5', d: 'R6', j: 'S4', b: 'R50', e: 'R60' }

/**
 * The S3 and S9 roundels are drawn as vector artwork rather than as Scr03 glyphs,
 * so they leave nothing in the text layer at all. Their trips are unmistakable by
 * where they end, which is also how FGC defines the two lines: S3 terminates at
 * Can Ros and S9 at Quatre Camins, and no lettered line stops short there.
 * Verified against the rendered poster and the API's own route_short_name.
 */
const LINE_BY_TERMINUS = { CR: 'S3', QC: 'S9' }

const DIRECTION_HEADER = /^(Barcelona-Pl\. Espanya|Martorell) D /
const BAND_CAPTIONS = [
  { dayTypes: ['augustWeekday'], re: /^Feiners del mes d.{1,8}agost de/ },
  { dayTypes: ['saturdayHoliday'], re: /^Dissabtes i festius de/ },
  { dayTypes: ['saturdayHoliday', 'augustWeekday'], re: /^Dissabtes, festius i feiners del mes d.{1,8}agost de/ }
]

const fail = (message) => {
  console.error(`\n  extraction failed: ${message}\n`)
  process.exit(1)
}

/** mutool's stext XML escapes text; we only need these back. */
const unescapeXml = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

/** Reads one page of the PDF as { lines, markers }. */
const readPage = (pdfPath, page) => {
  const xml = execFileSync('mutool', ['draw', '-F', 'stext', '-o', '-', pdfPath, String(page)], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore']
  })

  const lines = []
  const markers = []
  let font = null

  for (const raw of xml.split('\n')) {
    const fontMatch = raw.match(/<font name="([^"]+)"/)
    if (fontMatch) font = fontMatch[1]

    const lineMatch = raw.match(
      /<line bbox="([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)"[^>]*text="(.*)"\s*\/?>/
    )
    if (lineMatch) {
      lines.push({
        x0: Number(lineMatch[1]),
        y: Number(lineMatch[2]),
        x1: Number(lineMatch[3]),
        text: unescapeXml(lineMatch[5])
      })
    }

    if (font === 'Scr03') {
      const charMatch = raw.match(/<char quad="[\d.-]+ ([\d.-]+)[^>]*c="([^"]*)"/)
      if (charMatch) markers.push({ y: Number(charMatch[1]), glyph: charMatch[2] })
    }
  }

  return { lines, markers }
}

/**
 * Groups the H.MM / '|' cells of a page into rows on the 22-column grid.
 * Returns rows ordered top to bottom, each { y, cells, line }.
 */
const readRows = ({ lines, markers }) => {
  const rows = []

  for (const { x0, x1, y, text } of lines) {
    if (!/^(\d{1,2}\.\d{2}|\|)$/.test(text)) continue

    const centre = (x0 + x1) / 2
    let column = 0
    for (let i = 1; i < COLUMN_X.length; i += 1) {
      if (Math.abs(COLUMN_X[i] - centre) < Math.abs(COLUMN_X[column] - centre)) column = i
    }
    if (Math.abs(COLUMN_X[column] - centre) > COLUMN_TOLERANCE) {
      fail(`cell "${text}" at x=${centre.toFixed(1)} does not sit on the 22-column grid`)
    }

    let row = rows.find((candidate) => Math.abs(candidate.y - y) < ROW_TOLERANCE)
    if (!row) {
      row = { y, cells: new Array(STATIONS.length).fill(null) }
      rows.push(row)
    }
    row.cells[column] = text
  }

  rows.sort((a, b) => a.y - b.y)

  for (const row of rows) {
    const marker = markers.find((m) => Math.abs(m.y - row.y) < MARKER_TOLERANCE)
    row.line = marker ? LINE_BY_GLYPH[marker.glyph] ?? null : null
  }

  return rows
}

/**
 * Turns a row of printed "H.MM" cells into service-day minutes, keeping times
 * past midnight as 24:xx / 25:xx the way the FGC API reports them.
 * '|' (passes without stopping) and untravelled stations both become null.
 *
 * Both tables print their columns in the direction the train runs, so the carry
 * walk follows column order; only the result is re-indexed onto STATIONS, which
 * is the outbound order.
 */
const toServiceMinutes = (cells, { reversed, label, row }) => {
  const values = new Array(STATIONS.length).fill(null)
  let previous = -1

  cells.forEach((cell, index) => {
    if (!cell || cell === '|') return

    const [hours, minutes] = cell.split('.').map(Number)
    let value = hours * 60 + minutes
    // A train leaving at 23.55 and arriving at 0.13 is still the same service day,
    // but no single stop should ever need more than one day's worth of carry.
    let carries = 0
    while (value < previous) {
      value += 24 * 60
      carries += 1
    }
    if (carries > 1) fail(`${label}: row ${row} needs ${carries} days of carry at ${cell}`)

    values[index] = value
    previous = value
  })

  const times = values.filter((value) => value !== null)
  if (times.length === 0) fail(`${label}: row ${row} has no times`)

  // Pl. Espanya to Martorell Enllaç is ~47 minutes end to end; anything close to
  // two hours means a cell landed in the wrong column or the carry misfired.
  const journey = times[times.length - 1] - times[0]
  if (journey > 120) fail(`${label}: row ${row} spans ${journey} minutes end to end`)

  return reversed ? values.reverse() : values
}

const formatTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}.${String(minutes % 60).padStart(2, '0')}`

/**
 * A trip's own departure and arrival times. Inbound trips are stored in outbound
 * station order, so these are min/max rather than first/last in the array.
 */
const tripRange = (stops) => {
  const times = stops.filter((value) => value !== null)
  return { first: Math.min(...times), last: Math.max(...times) }
}

/**
 * Reading down any one column of a timetable, times only ever increase — that is
 * what makes a grid readable. Pl. Espanya is the one station every row of both
 * tables calls at, so it is the column we key the midnight rollover on.
 *
 * Each train's own origin will not do: the tables also carry short workings that
 * start partway down the line, so origin times are not in order down the page.
 */
const REFERENCE_STATION = 'PE'

const buildTrips = (rows, { reversed, label }) => {
  const reference = STATIONS.indexOf(REFERENCE_STATION)
  let dayOffset = 0
  let previous = -1

  return rows.map((row, index) => {
    const stops = toServiceMinutes(row.cells, { reversed, label, row: index + 1 })

    const marker = stops[reference]
    if (marker === null) {
      fail(`${label}: row ${index + 1} does not call at ${REFERENCE_STATION}`)
    }
    if (marker + dayOffset < previous) dayOffset += 24 * 60
    previous = marker + dayOffset

    const shifted = stops.map((value) => (value === null ? null : value + dayOffset))
    return { stops: shifted, line: row.line ?? lineFromTerminus(shifted, label, index + 1) }
  })
}

/** Recovers the line of a trip whose roundel is vector artwork, from where it ends. */
const lineFromTerminus = (stops, label, row) => {
  const called = stops.map((value, index) => (value === null ? null : index)).filter((i) => i !== null)
  const ends = [STATIONS[called[0]], STATIONS[called[called.length - 1]]]
  const line = ends.map((station) => LINE_BY_TERMINUS[station]).find(Boolean)

  if (!line) {
    fail(
      `${label}: row ${row} has no line roundel in the text layer and runs ` +
        `${ends[0]}..${ends[1]}, which is not a known vector-artwork line. ` +
        `Check the poster — a new line may need adding to LINE_BY_TERMINUS.`
    )
  }
  return line
}

/** Splits a page's rows into its two direction tables. */
const splitDirections = (rows, lines, page) => {
  const headers = lines
    .filter((line) => DIRECTION_HEADER.test(line.text))
    .sort((a, b) => a.y - b.y)

  if (headers.length !== 2) {
    fail(`page ${page}: expected 2 direction headers, found ${headers.length}`)
  }
  if (!headers[1].text.startsWith('Martorell D ')) {
    fail(`page ${page}: second direction header is not "Martorell D ..."`)
  }

  const splitY = headers[1].y
  return {
    outbound: rows.filter((row) => row.y < splitY),
    inbound: rows.filter((row) => row.y > splitY),
    splitY
  }
}

/**
 * Page 2 stacks three day-bands inside each direction table, each introduced by
 * a caption that states its own time range. We use those ranges as a self-check.
 */
const splitBands = (rows, lines, { from, to, label }) => {
  const captions = []
  for (const line of lines) {
    if (line.y <= from || line.y >= to) continue
    const band = BAND_CAPTIONS.find((candidate) => candidate.re.test(line.text))
    if (band) captions.push({ y: line.y, text: line.text, dayTypes: band.dayTypes })
  }
  captions.sort((a, b) => a.y - b.y)

  if (captions.length !== 3) {
    fail(`${label}: expected 3 day-band captions, found ${captions.length}`)
  }

  return captions.map((caption, index) => {
    const end = index + 1 < captions.length ? captions[index + 1].y : to
    const band = rows.filter((row) => row.y > caption.y && row.y < end)
    if (band.length === 0) fail(`${label}: day-band "${caption.text.slice(0, 40)}" is empty`)
    return { ...caption, rows: band }
  })
}

/**
 * The caption states the band's own range ("de 5.13 h a 10.06 h"). Comparing it
 * against what we extracted is what makes a future poster safe to re-run.
 */
const assertBandRange = (caption, trips, label) => {
  const stated = caption.text.match(/de (\d{1,2}\.\d{2}) h a (\d{1,2}\.\d{2}) h/)
  if (!stated) fail(`${label}: could not read the time range out of "${caption.text.slice(0, 60)}"`)

  const first = formatTime(tripRange(trips[0].stops).first % (24 * 60))
  const last = formatTime(tripRange(trips[trips.length - 1].stops).first % (24 * 60))
  const expectedFirst = stated[1].padStart(5, '0')
  const expectedLast = stated[2].padStart(5, '0')

  if (first.padStart(5, '0') !== expectedFirst || last.padStart(5, '0') !== expectedLast) {
    fail(
      `${label}: band says ${stated[1]}-${stated[2]} but extracted ${first}-${last}. ` +
        `The poster layout has probably changed.`
    )
  }
}

const main = () => {
  const pdfPath = resolve(process.argv[2] ?? 'docs/timetables/s8_martorell_la.pdf')
  const outPath = resolve('src/data/fgcTimetable.ts')

  const timetable = {
    weekday: { outbound: [], inbound: [] },
    saturdayHoliday: { outbound: [], inbound: [] },
    augustWeekday: { outbound: [], inbound: [] }
  }

  // Page 1 is the plain weekday timetable; page 2 is banded by day type.
  const page1 = readPage(pdfPath, 1)
  const rows1 = readRows(page1)
  const split1 = splitDirections(rows1, page1.lines, 1)

  for (const direction of ['outbound', 'inbound']) {
    const trips = buildTrips(split1[direction], {
      reversed: direction === 'inbound',
      label: `page 1 ${direction}`
    })
    timetable.weekday[direction] = trips
    console.log(`page 1 ${direction.padEnd(8)} weekday         ${String(trips.length).padStart(4)} trips`)
  }

  const page2 = readPage(pdfPath, 2)
  const rows2 = readRows(page2)
  const split2 = splitDirections(rows2, page2.lines, 2)

  for (const direction of ['outbound', 'inbound']) {
    const from = direction === 'outbound' ? 0 : split2.splitY
    const to = direction === 'outbound' ? split2.splitY : Infinity
    const bands = splitBands(split2[direction], page2.lines, {
      from,
      to,
      label: `page 2 ${direction}`
    })

    for (const band of bands) {
      const label = `page 2 ${direction} [${band.dayTypes.join('+')}]`
      const trips = buildTrips(band.rows, { reversed: direction === 'inbound', label })
      assertBandRange(band, trips, label)

      // A band captioned for both day types is emitted into both, so each
      // (dayType, direction) array stands on its own.
      for (const dayType of band.dayTypes) timetable[dayType][direction].push(...trips)
      console.log(
        `page 2 ${direction.padEnd(8)} ${band.dayTypes.join('+').padEnd(15)} ` +
          `${String(trips.length).padStart(4)} trips`
      )
    }
  }

  for (const dayType of Object.keys(timetable)) {
    for (const direction of ['outbound', 'inbound']) {
      timetable[dayType][direction].sort(
        (a, b) => tripRange(a.stops).first - tripRange(b.stops).first
      )
    }
  }

  writeFileSync(outPath, render(timetable, pdfPath))
  console.log(`\nwrote ${relative(process.cwd(), outPath)}`)
}

const renderTrip = (trip) =>
  `  { line: ${trip.line ? `'${trip.line}'` : 'null'}, stops: [${trip.stops
    .map((value) => (value === null ? 'n' : value))
    .join(', ')}] }`

const render = (timetable, pdfPath) => {
  const sections = []
  for (const dayType of ['weekday', 'saturdayHoliday', 'augustWeekday']) {
    const directions = ['outbound', 'inbound']
      .map(
        (direction) =>
          `    ${direction}: [\n${timetable[dayType][direction]
            .map((trip) => `  ${renderTrip(trip)}`)
            .join(',\n')}\n    ]`
      )
      .join(',\n')
    sections.push(`  ${dayType}: {\n${directions}\n  }`)
  }

  return `// Generated by scripts/extract-fgc-timetable.mjs from
// ${relative(process.cwd(), pdfPath)} — do not edit by hand.
//
// Re-run the script when FGC publishes a new poster; it self-checks against the
// time ranges printed on the poster and refuses to emit anything if they drift.

/** Outbound is Pl. Espanya -> Martorell; inbound is the way back. */
export type Direction = 'outbound' | 'inbound'

export type DayType = 'weekday' | 'saturdayHoliday' | 'augustWeekday'

export type TimetableLine = 'S3' | 'S4' | 'S8' | 'S9' | 'R5' | 'R6' | 'R50' | 'R60'

/** Both directions are indexed in this order, outbound-first. */
export const TIMETABLE_STATIONS = [
${STATIONS.map((code) => `  '${code}'`).join(',\n')}
] as const

export interface TimetableTrip {
  /**
   * Service-day minutes past midnight per station, in TIMETABLE_STATIONS order.
   * null means the train does not call there — either the poster printed '|'
   * (passes through) or the station is outside the trip's range. Times after
   * midnight stay above 1440, matching the API's 24:xx / 25:xx convention.
   */
  stops: (number | null)[]
  /**
   * S3 and S9 are drawn as vector artwork on the poster rather than as text, so
   * they are recovered from where the trip ends (Can Ros / Quatre Camins).
   */
  line: TimetableLine | null
}

const n = null

export const fgcTimetable: Record<DayType, Record<Direction, TimetableTrip[]>> = {
${sections.join(',\n')}
}
`
}

main()
