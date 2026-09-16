#!/usr/bin/env node
/**
 * Extracts the AMB e8 bus timetable (Corbera de Llobregat <-> Barcelona) from the
 * official PDF into src/data/e8Timetable.ts.
 *
 * Run manually when AMB publishes a new poster; it is not part of the build:
 *
 *   node scripts/extract-e8-timetable.mjs docs/timetables/Horari_e8_2019_.pdf
 *
 * Requires `mutool` (brew install mupdf-tools).
 *
 * Two passes are needed, because the poster encodes two different things two
 * different ways:
 *
 *  - The times are in the text layer, but mutool merges several cells into one
 *    <line>, so they have to be rebuilt from individual <char> elements.
 *  - The per-expedition flags are small numbered circles drawn as vector art.
 *    They leave nothing at all in the text layer, so the page is also rendered
 *    and the badges are read as colour blobs beside each row.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const PAGE = 2
const PAGE_WIDTH = 1190.55

/** Stop order of the Barcelona -> Corbera direction; the other is its reverse. */
const STOPS = ['FM', 'MARIA_CRISTINA', 'MOLINS', 'QC', 'PALMA', 'CORBERA_BAIXA', 'CORBERA_ALTA']

/** The one stop every expedition calls at, used to order rows and carry midnight. */
const REFERENCE_STOP = 'QC'

const COLUMN_TOLERANCE = 12
const ROW_TOLERANCE = 4

/**
 * The poster's five footnote badges. Colours sampled from the legend at the foot
 * of the page. Note that (141,199,63) means two different things depending on
 * which table it appears in, which is why the mapping is per-table.
 */
const BADGE_COLOURS = {
  '0,171,139': 'notInAugust', //      (1) Durant el mes d'agost no circula
  '43,182,115': 'everySaturday', //   (3) Circula tots els dissabtes de l'any
  '6,104,57': 'endsAtMolins', //      (4) Aquesta expedicio acaba/comenca a Molins de Rei
  // (2) Circula els dies lectius segons el calendari escolar de Barcelona, or
  // (5) Circula per Sant Feliu, Sant Just i Esplugues — see `sharedBadge` below.
  '141,199,63': 'shared'
}

/**
 * Each table's x/y window on the page, the strip its badges sit in, and what the
 * shared green badge means there. Derived from the poster's own headers.
 */
const TABLES = [
  { dayType: 'weekday', direction: 'toBarcelona', x: [40, 300], y: [70, 1105], badgeX: [36, 50], sharedBadge: 'schoolDaysOnly' },
  { dayType: 'weekday', direction: 'fromBarcelona', x: [320, 560], y: [70, 1105], badgeX: [320, 336], sharedBadge: 'schoolDaysOnly' },
  { dayType: 'saturday', direction: 'toBarcelona', x: [614, 870], y: [70, 560], badgeX: [614, 632], sharedBadge: 'schoolDaysOnly' },
  { dayType: 'saturday', direction: 'fromBarcelona', x: [614, 870], y: [595, 1105], badgeX: [614, 632], sharedBadge: 'schoolDaysOnly' },
  { dayType: 'sundayHoliday', direction: 'toBarcelona', x: [915, 1165], y: [70, 365], badgeX: [918, 935], sharedBadge: 'viaSantFeliu' },
  { dayType: 'sundayHoliday', direction: 'fromBarcelona', x: [915, 1165], y: [415, 755], badgeX: [918, 935], sharedBadge: 'viaSantFeliu' },
  { dayType: 'christmas', direction: 'toBarcelona', x: [915, 1165], y: [785, 970], badgeX: [918, 935], sharedBadge: 'viaSantFeliu' },
  { dayType: 'christmas', direction: 'fromBarcelona', x: [915, 1165], y: [995, 1105], badgeX: [918, 935], sharedBadge: 'viaSantFeliu' }
]

/**
 * Expedition counts per table; a mismatch means the poster's layout has moved.
 * Counted by row, not by first-column time: a few expeditions start partway down
 * the line and leave their first columns empty.
 */
const EXPECTED = {
  'weekday/toBarcelona': 73,
  'weekday/fromBarcelona': 68,
  'saturday/toBarcelona': 28,
  'saturday/fromBarcelona': 28,
  'sundayHoliday/toBarcelona': 17,
  'sundayHoliday/fromBarcelona': 17,
  'christmas/toBarcelona': 8,
  'christmas/fromBarcelona': 6
}

const FLAGS = ['notInAugust', 'schoolDaysOnly', 'everySaturday', 'endsAtMolins', 'viaSantFeliu']

const fail = (message) => {
  console.error(`\n  extraction failed: ${message}\n`)
  process.exit(1)
}

/** Rebuilds time cells from individual characters, with their positions. */
const readTimes = (pdfPath) => {
  const xml = execFileSync('mutool', ['draw', '-F', 'stext', '-o', '-', pdfPath, String(PAGE)], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore']
  })

  const byRow = new Map()
  for (const raw of xml.split('\n')) {
    const m = raw.match(/<char quad="[\d.\- ]+" x="([\d.-]+)" y="([\d.-]+)".*?c="(.*)"\/>/)
    if (!m) continue
    const key = Math.round(Number(m[2]) * 10) / 10
    if (!byRow.has(key)) byRow.set(key, [])
    byRow.get(key).push({ x: Number(m[1]), ch: m[3] })
  }

  const cells = []
  for (const [y, chars] of byRow) {
    chars.sort((a, b) => a.x - b.x)
    let token = null
    let lastX = null
    const flush = () => {
      if (token && /^\d{1,2}\.\d{2}$/.test(token.text)) cells.push({ x: token.x, y, text: token.text })
      token = null
    }
    for (const { x, ch } of chars) {
      if (ch === ' ') {
        flush()
      } else if (token && x - lastX < 6) {
        token.text += ch
      } else {
        flush()
        token = { x, text: ch }
      }
      lastX = x
    }
    flush()
  }
  return cells
}

/**
 * Reads the badges as colour blobs beside the rows. A fixed offset from each row
 * would not do: the badge sits a little below its own times, close enough to be
 * credited to the row above.
 */
const readBadges = (pdfPath, scale) => {
  const png = execFileSync('mutool', ['draw', '-F', 'png', '-r', '150', '-o', '-', pdfPath, String(PAGE)], {
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore']
  })
  return { png, scale }
}

const main = async () => {
  const pdfPath = resolve(process.argv[2] ?? 'docs/timetables/Horari_e8_2019_.pdf')
  const outPath = resolve('src/data/e8Timetable.ts')

  const cells = readTimes(pdfPath)
  const pixels = await decodePng(readBadges(pdfPath).png)
  const scale = pixels.width / PAGE_WIDTH

  const timetable = {}
  for (const table of TABLES) {
    const key = `${table.dayType}/${table.direction}`
    const inTable = cells.filter(
      (c) => c.x > table.x[0] && c.x < table.x[1] && c.y > table.y[0] && c.y < table.y[1]
    )
    if (inTable.length === 0) fail(`${key}: no time cells found`)

    const columns = clusterColumns(inTable, key)
    const rows = buildRows(inTable, columns, key)
    const badges = findBadges(pixels, scale, table, rows)
    attachBadges(rows, badges, table, key)

    if (rows.length !== EXPECTED[key]) {
      fail(`${key}: expected ${EXPECTED[key]} expeditions, extracted ${rows.length}`)
    }

    timetable[table.dayType] ??= {}
    timetable[table.dayType][table.direction] = toTrips(rows, table, key)
    console.log(
      `${key.padEnd(30)} ${String(rows.length).padStart(3)} expeditions  ` +
        FLAGS.map((f) => `${f}:${timetable[table.dayType][table.direction].filter((t) => t[f]).length}`).join('  ')
    )
  }

  writeFileSync(outPath, render(timetable, pdfPath))
  console.log(`\nwrote ${relative(process.cwd(), outPath)}`)
}

/** Groups the table's time cells into its seven stop columns. */
const clusterColumns = (cells, key) => {
  const xs = [...cells].map((c) => c.x).sort((a, b) => a - b)
  const centres = []
  let group = [xs[0]]
  for (const x of xs.slice(1)) {
    if (x - group[group.length - 1] > COLUMN_TOLERANCE) {
      centres.push(group.reduce((a, b) => a + b, 0) / group.length)
      group = []
    }
    group.push(x)
  }
  centres.push(group.reduce((a, b) => a + b, 0) / group.length)

  if (centres.length !== STOPS.length) {
    fail(`${key}: found ${centres.length} columns, expected ${STOPS.length}`)
  }
  return centres
}

const buildRows = (cells, columns, key) => {
  const rows = []
  for (const cell of cells) {
    let column = 0
    for (let i = 1; i < columns.length; i += 1) {
      if (Math.abs(columns[i] - cell.x) < Math.abs(columns[column] - cell.x)) column = i
    }
    if (Math.abs(columns[column] - cell.x) > COLUMN_TOLERANCE) {
      fail(`${key}: cell "${cell.text}" at x=${cell.x.toFixed(1)} sits off the column grid`)
    }

    let row = rows.find((r) => Math.abs(r.y - cell.y) < ROW_TOLERANCE)
    if (!row) {
      row = { y: cell.y, cells: new Array(STOPS.length).fill(null), flags: new Set() }
      rows.push(row)
    }
    row.cells[column] = cell.text
  }
  rows.sort((a, b) => a.y - b.y)
  return rows
}

const findBadges = (pixels, scale, table, rows) => {
  const [x0, x1] = table.badgeX.map((v) => Math.round(v * scale))
  // Scanned across the rows themselves, not the declared window: these blocks
  // have a solid colour header whose fill is the same green as the badges.
  const yStart = Math.round((rows[0].y - 4) * scale)
  const yEnd = Math.round((rows[rows.length - 1].y + 8) * scale)

  const runs = []
  let current = null
  for (let y = yStart; y < yEnd; y += 1) {
    const counts = new Map()
    for (let x = x0; x < x1; x += 1) {
      const name = BADGE_COLOURS[pixels.at(x, y)]
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    if (best && current && current.name === best[0] && y - current.y1 <= 2) {
      current.y1 = y
    } else if (best) {
      if (current) runs.push(current)
      current = { name: best[0], y0: y, y1: y }
    }
  }
  if (current) runs.push(current)

  // A real badge is a filled circle a few pixels tall; stray antialiasing is not.
  return runs
    .filter((r) => r.y1 - r.y0 > 4)
    .map((r) => ({ name: r.name, y: (r.y0 + r.y1) / 2 / scale }))
}

const attachBadges = (rows, badges, table, key) => {
  for (const badge of badges) {
    const row = rows.find((r) => Math.abs(r.y - badge.y) < 6)
    if (!row) {
      fail(`${key}: a ${badge.name} badge at y=${badge.y.toFixed(1)} matches no expedition`)
    }
    row.flags.add(badge.name === 'shared' ? table.sharedBadge : badge.name)
  }
}

/**
 * Reading down a column of a timetable, times only ever increase. Quatre Camins
 * is the stop every expedition calls at, so it is the column the day rollover is
 * keyed on.
 *
 * Without this, a row printed entirely after midnight — the Saturday night runs
 * at 0.15 and 2.15 — is internally monotonic, so nothing inside it looks like a
 * rollover and it lands at 38 minutes past midnight instead of 24.38, sorting to
 * the top of the table and pairing with the wrong trains.
 */
const toTrips = (rows, table, key) => {
  const reference = STOPS.indexOf(REFERENCE_STOP)
  let dayOffset = 0
  let previous = -1

  return rows.map((row, index) => {
    const trip = toTrip(row, table, key)
    const marker = trip.stops[reference]

    if (marker + dayOffset < previous) dayOffset += 24 * 60
    previous = marker + dayOffset

    if (dayOffset) {
      trip.stops = trip.stops.map((value) => (value === null ? null : value + dayOffset))
    }
    if (index > 0 && trip.stops[reference] > 48 * 60) {
      fail(`${key}: row ${index + 1} lands beyond a second midnight`)
    }
    return trip
  })
}

/**
 * Turns one printed row into a trip. The poster prints its columns in the order
 * the bus runs, so the midnight carry follows column order and only the result is
 * re-indexed onto STOPS, which is the Barcelona -> Corbera order.
 */
const toTrip = (row, table, key) => {
  const reversed = table.direction === 'toBarcelona'
  const values = new Array(STOPS.length).fill(null)
  let previous = -1

  row.cells.forEach((cell, index) => {
    if (!cell) return
    const [hours, minutes] = cell.split('.').map(Number)
    let value = hours * 60 + minutes
    let carries = 0
    while (value < previous) {
      value += 24 * 60
      carries += 1
    }
    if (carries > 1) fail(`${key}: a row needs ${carries} days of carry at ${cell}`)
    values[index] = value
    previous = value
  })

  const times = values.filter((v) => v !== null)
  // Corbera to Francesc Macia is about an hour end to end.
  if (times[times.length - 1] - times[0] > 120) {
    fail(`${key}: an expedition spans ${times[times.length - 1] - times[0]} minutes`)
  }

  const stops = reversed ? values.reverse() : values
  if (stops[STOPS.indexOf(REFERENCE_STOP)] === null) {
    fail(`${key}: an expedition does not call at ${REFERENCE_STOP}`)
  }

  const trip = { stops }
  for (const flag of FLAGS) trip[flag] = row.flags.has(flag)
  return trip
}

/** Minimal PNG decoder: enough for the flat RGB(A) images mutool produces. */
const decodePng = async (buffer) => {
  const { createInflate } = await import('node:zlib')
  const chunks = []
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let offset = 8

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') {
      chunks.push(data)
    }
    offset += length + 12
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    fail(`unsupported PNG (bit depth ${bitDepth}, colour type ${colorType})`)
  }

  const raw = await new Promise((res, rej) => {
    const out = []
    const inflate = createInflate()
    inflate.on('data', (c) => out.push(c))
    inflate.on('end', () => res(Buffer.concat(out)))
    inflate.on('error', rej)
    inflate.end(Buffer.concat(chunks))
  })

  const channels = colorType === 6 ? 4 : 3
  const stride = width * channels
  const pixels = Buffer.alloc(height * stride)

  // Undo the per-scanline filters (PNG spec section 9).
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    for (let i = 0; i < stride; i += 1) {
      const a = i >= channels ? pixels[y * stride + i - channels] : 0
      const b = y > 0 ? pixels[(y - 1) * stride + i] : 0
      const c = i >= channels && y > 0 ? pixels[(y - 1) * stride + i - channels] : 0
      let value = line[i]
      if (filter === 1) value += a
      else if (filter === 2) value += b
      else if (filter === 3) value += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      pixels[y * stride + i] = value & 0xff
    }
  }

  return {
    width,
    height,
    at(x, y) {
      const i = y * stride + x * channels
      return `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`
    }
  }
}

const render = (timetable, pdfPath) => {
  const body = ['weekday', 'saturday', 'sundayHoliday', 'christmas']
    .map((dayType) => {
      const directions = ['toBarcelona', 'fromBarcelona']
        .map((direction) => {
          const trips = timetable[dayType][direction]
            .map((trip) => {
              const flags = FLAGS.filter((f) => trip[f])
              const suffix = flags.length ? `, ${flags.map((f) => `${f}: true`).join(', ')}` : ''
              return `      { stops: [${trip.stops.map((v) => (v === null ? 'n' : v)).join(', ')}]${suffix} }`
            })
            .join(',\n')
          return `    ${direction}: [\n${trips}\n    ]`
        })
        .join(',\n')
      return `  ${dayType}: {\n${directions}\n  }`
    })
    .join(',\n')

  return `// Generated by scripts/extract-e8-timetable.mjs from
// ${relative(process.cwd(), pdfPath)} — do not edit by hand.
//
// Re-run the script when AMB publishes a new poster. There is no e8 API to check
// this against, so the printed sheet is the only source; the extractor self-checks
// against the expedition counts on the poster and refuses to emit anything if the
// layout has moved.

/** fromBarcelona is Francesc Macia -> Corbera; toBarcelona is the way back. */
export type E8Direction = 'toBarcelona' | 'fromBarcelona'

export type E8DayType = 'weekday' | 'saturday' | 'sundayHoliday' | 'christmas'

/** Both directions are indexed in this order, Barcelona-first. */
export const E8_STOPS = [
${STOPS.map((s) => `  '${s}'`).join(',\n')}
] as const

export interface E8Trip {
  /**
   * Minutes past midnight per stop, in E8_STOPS order. null means the bus does
   * not call there — most expeditions skip Molins de Rei. Times after midnight
   * stay above 1440, as the Saturday night runs do.
   */
  stops: (number | null)[]
  /** (1) Does not run during August. */
  notInAugust?: boolean
  /** (2) Runs on school days only, per Barcelona's school calendar. */
  schoolDaysOnly?: boolean
  /** (3) Runs every Saturday of the year, holidays included. */
  everySaturday?: boolean
  /** (4) Starts or finishes at Molins de Rei rather than running the full line. */
  endsAtMolins?: boolean
  /** (5) Runs via Sant Feliu, Sant Just and Esplugues instead of the motorway. */
  viaSantFeliu?: boolean
}

const n = null

export const e8Timetable: Record<E8DayType, Record<E8Direction, E8Trip[]>> = {
${body}
}
`
}

main()
