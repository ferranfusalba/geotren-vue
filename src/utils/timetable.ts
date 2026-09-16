import { isHoliday, runsFridayEve } from '@/data/calendar'
import {
  fgcTimetable,
  TIMETABLE_STATIONS,
  type DayType,
  type Direction,
  type TimetableTrip
} from '@/data/fgcTimetable'

export const DAY_TYPES: DayType[] = ['weekday', 'saturdayHoliday', 'augustWeekday']

/** Printed and reported times drift by a minute here and there. */
export const MATCH_TOLERANCE = 1

/** Position of a station code inside a trip's `stops` array, or -1. */
export const stationIndex = (station: string) =>
  TIMETABLE_STATIONS.indexOf(station as (typeof TIMETABLE_STATIONS)[number])

/** Service-day minutes past midnight for an API "HH:MM:SS", keeping 24:xx as 1440+. */
export const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

/** Service-day minutes back to the "HH:MM:SS" shape the views and countdown expect. */
export const toTimeString = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`

/**
 * The slice of the printed timetable that one view's API query asks for.
 *
 * The poster covers the whole Pl. Espanya <-> Martorell segment, while each query
 * is a filtered part of it. Narrowing to the same population is what makes a diff
 * meaningful: compared against the raw table, trains the API was never asked for
 * would show up as "missing".
 */
export interface TripPopulation {
  /** The station whose departure column the view shows. */
  station: string
  direction: Direction
  /** Stations the trip must call at, mirroring the query's parent_station / headsign. */
  calling: string[]
  /** Lines the query excludes by route_short_name. */
  excludingLines?: readonly string[]
}

/**
 * One definition per view, so the store, the tests and scripts/check-against-api
 * cannot drift apart. Each mirrors its query in src/stores/schedule.ts.
 */
export const POPULATIONS = {
  // parent_station=MC, trip_headsign=Barcelona - Plaça Espanya
  MC: { station: 'MC', direction: 'inbound', calling: ['MC', 'PE'] },
  // parent_station=PE, headsign != Pl. Espanya, minus L8/S3/S9
  PE: {
    station: 'PE',
    direction: 'outbound',
    calling: ['PE'],
    excludingLines: ['L8', 'S3', 'S9']
  },
  // parent_station=QC, headsign != Pl. Espanya. Narrowed further to trains that
  // reach Martorell Central, since this view exists to get you there: three
  // trains a day terminate at Quatre Camins and are no use.
  QC_TO_MC: { station: 'QC', direction: 'outbound', calling: ['QC', 'MC'] },
  // The same query as MC, sliced differently: the onward journey changes at
  // Quatre Camins, so the handful of trains that run past it are no use.
  MC_TO_QC: { station: 'MC', direction: 'inbound', calling: ['MC', 'QC'] }
} satisfies Record<string, TripPopulation>

/**
 * A station counts as called at only if the poster prints a real time there — a
 * '|' means the train passes through without stopping.
 *
 * `date` is the service day being asked about. The poster's Ⓤ trips only run on
 * working Fridays and on working days before a holiday, so on any other day they
 * are not part of the population at all — counting them would make the API look
 * as though it had dropped four trains. Omit it and every printed trip is
 * returned, which is what a question about the timetable itself wants.
 */
export const tripsFor = (dayType: DayType, population: TripPopulation, date?: Date) => {
  const indexes = population.calling.map(stationIndex)
  if (indexes.some((index) => index === -1)) {
    throw new Error(`Unknown station in ${population.calling.join(', ')}`)
  }

  const fridayEve = date ? runsFridayEve(date) : true

  return fgcTimetable[dayType][population.direction].filter(
    (trip) =>
      indexes.every((index) => trip.stops[index] !== null) &&
      !population.excludingLines?.includes(trip.line as string) &&
      (fridayEve || !trip.fridayEve)
  )
}

/** A trip's own departure minute at one station. Callers filter with tripsFor first. */
export const departureAt = (trip: TimetableTrip, station: string) =>
  trip.stops[stationIndex(station)]

/**
 * Picks the timetable that matches the day the API is actually reporting.
 *
 * Scoring the three patterns against live data beats a hardcoded Catalan holiday
 * list: it needs no yearly upkeep and it copes with the odd service day FGC runs
 * that no calendar would predict. The calendar rules only break ties.
 */
export const detectDayType = (
  apiTimes: number[],
  population: TripPopulation,
  today = new Date()
): DayType => {
  const calendarGuess = fgcDayTypeFromCalendar(today)
  if (apiTimes.length === 0) return calendarGuess

  let best: { dayType: DayType; score: number } | null = null

  for (const dayType of DAY_TYPES) {
    // Scored against the same slice the view compares, so lines the query
    // excludes cannot dilute the match.
    const printed = tripsFor(dayType, population, today)
      .map((trip) => departureAt(trip, population.station))
      .filter((minute): minute is number => minute !== null)

    const matched = apiTimes.filter((time) =>
      printed.some((minute) => Math.abs(minute - time) <= MATCH_TOLERANCE)
    ).length

    // Normalising by both sides stops a pattern from winning just by being bigger.
    const score = matched / Math.max(apiTimes.length, printed.length, 1)
    const wins = !best || score > best.score || (score === best.score && dayType === calendarGuess)
    if (wins) best = { dayType, score }
  }

  return best!.dayType
}

/**
 * The pattern a date would run, by the calendar alone.
 *
 * detectDayType is better whenever the API has something to say, since it reads
 * the service actually running; this is only the tie-break.
 */
const fgcDayTypeFromCalendar = (today: Date): DayType => {
  const day = today.getDay()
  if (day === 0 || day === 6 || isHoliday(today)) return 'saturdayHoliday'
  return today.getMonth() === 7 ? 'augustWeekday' : 'weekday'
}
