#!/usr/bin/env node
/**
 * Diffs the extracted timetable against what the FGC API reports right now, so a
 * poster revision or a change in the open data shows up as a number rather than
 * as a surprise in the app.
 *
 *   npx vite-node scripts/check-against-api.ts
 *
 * Run through vite-node so it resolves the app's '@' alias and shares the very
 * same population definitions the store uses.
 *
 * Worth re-running on a Saturday and on an August weekday, which are the days
 * page 2 of the poster governs and that a normal weekday run never exercises.
 */
import { departureAt, detectDayType, POPULATIONS, tripsFor } from '@/utils/timetable'

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

const format = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

// Populations come from src/utils/timetable.ts so this script and the app can
// never disagree about which trains a query is supposed to return.
const CHECKS = [
  {
    name: 'MC -> Pl. Espanya',
    population: POPULATIONS.MC,
    query:
      'refine=parent_station%3AMC&refine=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya'
  },
  {
    name: 'Pl. Espanya -> MC',
    population: POPULATIONS.PE,
    query:
      'refine=parent_station%3APE&exclude=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya' +
      '&exclude=route_short_name%3AL8&exclude=route_short_name%3AS3&exclude=route_short_name%3AS9'
  },
  {
    name: 'QC -> MC',
    population: POPULATIONS.QC_TO_MC,
    query: 'refine=parent_station%3AQC&exclude=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya',
    // The view drops these too: they terminate at Quatre Camins and never reach MC.
    dropHeadsign: 'Quatre Camins'
  }
]

const run = async () => {
  console.log(`${new Date().toDateString()}\n`)
  let worst = 0

  for (const check of CHECKS) {
    const all = await fetchAll(check.query)
    const rows = check.dropHeadsign
      ? all.filter((row) => row.trip_headsign !== check.dropHeadsign)
      : all
    const apiTimes = rows.map((row) => minutesOf(row.departure_time)).sort((a, b) => a - b)

    // Exactly what the app does to pick today's timetable.
    const dayType = detectDayType(apiTimes, check.population)

    const printed = tripsFor(dayType, check.population)
      .map((trip) => departureAt(trip, check.population.station))
      .sort((a, b) => a - b)

    const missing = printed.filter(
      (minute) => !apiTimes.some((time) => Math.abs(minute - time) <= TOLERANCE)
    )
    const extra = apiTimes.filter(
      (time) => !printed.some((minute) => Math.abs(minute - time) <= TOLERANCE)
    )

    worst = Math.max(worst, missing.length + extra.length)
    console.log(
      `${check.name.padEnd(30)} poster ${String(printed.length).padStart(4)}  ` +
        `api ${String(apiTimes.length).padStart(4)}  [${dayType}]`
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
