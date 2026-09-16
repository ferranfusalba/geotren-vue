#!/usr/bin/env node
/**
 * Diffs the extracted timetable against what the FGC API reports right now, so a
 * poster revision or a change in the open data shows up as a number rather than
 * as a surprise in the app.
 *
 *   node --experimental-strip-types scripts/check-against-api.mjs
 *
 * Worth re-running on a Saturday and on an August weekday, which are the days
 * page 2 of the poster governs and that a normal weekday run never exercises.
 */
import { fgcTimetable, TIMETABLE_STATIONS } from '../src/data/fgcTimetable.ts'

const BASE =
  'https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records'
const TOLERANCE = 1

/** Mirrors fetchAllPages in src/stores/schedule.ts. */
const fetchAll = async (query) => {
  const rows = []
  let total = Infinity
  for (let page = 0; rows.length < total && page < 5; page += 1) {
    const url = `${BASE}?${query}&order_by=departure_time&limit=100&offset=${page * 100}`
    const data = await (await fetch(url)).json()
    if (data.error_code) throw new Error(`${data.error_code}: ${data.message}`)
    total = data.total_count
    rows.push(...data.results)
  }
  return rows
}

const minutesOf = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
const index = (station) => TIMETABLE_STATIONS.indexOf(station)

const tripsFor = (dayType, direction, calling) =>
  fgcTimetable[dayType][direction].filter((trip) =>
    calling.every((station) => trip.stops[index(station)] !== null)
  )

const format = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

const CHECKS = [
  {
    name: 'MC -> Pl. Espanya',
    direction: 'inbound',
    station: 'MC',
    calling: ['MC', 'PE'],
    query:
      'refine=parent_station%3AMC&refine=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya'
  },
  {
    name: 'Pl. Espanya -> MC',
    direction: 'outbound',
    station: 'PE',
    calling: ['PE', 'MC'],
    query:
      'refine=parent_station%3APE&exclude=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya' +
      '&exclude=route_short_name%3AL8&exclude=route_short_name%3AS3&exclude=route_short_name%3AS9'
  },
  {
    name: 'QC outbound',
    direction: 'outbound',
    station: 'QC',
    calling: ['QC'],
    query: 'refine=parent_station%3AQC&exclude=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya'
  }
]

const run = async () => {
  console.log(`${new Date().toDateString()}\n`)
  let worst = 0

  for (const check of CHECKS) {
    const rows = await fetchAll(check.query)
    const apiTimes = rows.map((row) => minutesOf(row.departure_time)).sort((a, b) => a - b)

    // Same scoring the app uses to pick today's timetable.
    let best = { dayType: null, score: -1 }
    for (const dayType of Object.keys(fgcTimetable)) {
      const printed = tripsFor(dayType, check.direction, check.calling).map(
        (trip) => trip.stops[index(check.station)]
      )
      const matched = apiTimes.filter((time) =>
        printed.some((minute) => Math.abs(minute - time) <= TOLERANCE)
      ).length
      const score = matched / Math.max(apiTimes.length, printed.length, 1)
      if (score > best.score) best = { dayType, score }
    }

    const printed = tripsFor(best.dayType, check.direction, check.calling)
      .map((trip) => trip.stops[index(check.station)])
      .sort((a, b) => a - b)

    const missing = printed.filter(
      (minute) => !apiTimes.some((time) => Math.abs(minute - time) <= TOLERANCE)
    )
    const extra = apiTimes.filter(
      (time) => !printed.some((minute) => Math.abs(minute - time) <= TOLERANCE)
    )

    worst = Math.max(worst, missing.length + extra.length)
    console.log(
      `${check.name.padEnd(20)} poster ${String(printed.length).padStart(4)}  ` +
        `api ${String(apiTimes.length).padStart(4)}  ` +
        `[${best.dayType}, ${(best.score * 100).toFixed(1)}% match]`
    )
    if (missing.length) console.log(`  only on the poster: ${missing.map(format).join(', ')}`)
    if (extra.length) console.log(`  only in the API:    ${extra.map(format).join(', ')}`)
  }

  console.log(worst === 0 ? '\nno differences' : `\n${worst} difference(s) on the worst table`)
}

run().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
