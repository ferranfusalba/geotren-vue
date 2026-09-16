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
 * The printed timetable covers the whole Pl. Espanya <-> Martorell segment, while
 * each API query asks for a filtered slice of it. Narrowing the trips to the same
 * population is what makes a diff meaningful: comparing against the raw table
 * would report trains the API was never asked for as "missing".
 *
 * A station counts as called at only if the poster prints a real time there — a
 * '|' means the train passes through without stopping.
 */
export const tripsFor = (dayType: DayType, direction: Direction, calling: string[]) => {
  const indexes = calling.map(stationIndex)
  if (indexes.some((index) => index === -1)) {
    throw new Error(`Unknown station in ${calling.join(', ')}`)
  }

  return fgcTimetable[dayType][direction].filter((trip) =>
    indexes.every((index) => trip.stops[index] !== null)
  )
}

/** A trip's own departure minute at one station. Callers filter with tripsFor first. */
export const departureAt = (trip: TimetableTrip, station: string) => trip.stops[stationIndex(station)]

/**
 * Picks the timetable that matches the day the API is actually reporting.
 *
 * Scoring the three patterns against live data beats a hardcoded Catalan holiday
 * list: it needs no yearly upkeep and it copes with the odd service day FGC runs
 * that no calendar would predict. The calendar rules only break ties.
 */
export const detectDayType = (
  apiTimes: number[],
  station: string,
  direction: Direction,
  today = new Date()
): DayType => {
  const calendarGuess = guessDayTypeFromCalendar(today)
  if (apiTimes.length === 0) return calendarGuess

  let best: { dayType: DayType; score: number } | null = null

  for (const dayType of DAY_TYPES) {
    const printed = fgcTimetable[dayType][direction]
      .map((trip) => departureAt(trip, station))
      .filter((minute): minute is number => minute !== null)

    const matched = apiTimes.filter((time) =>
      printed.some((minute) => Math.abs(minute - time) <= MATCH_TOLERANCE)
    ).length

    // Normalising by both sides stops a pattern from winning just by being bigger.
    const score = matched / Math.max(apiTimes.length, printed.length, 1)
    const wins =
      !best || score > best.score || (score === best.score && dayType === calendarGuess)
    if (wins) best = { dayType, score }
  }

  return best!.dayType
}

const guessDayTypeFromCalendar = (today: Date): DayType => {
  const day = today.getDay()
  if (day === 0 || day === 6) return 'saturdayHoliday'
  return today.getMonth() === 7 ? 'augustWeekday' : 'weekday'
}
