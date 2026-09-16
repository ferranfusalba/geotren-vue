import type { MergedScheduleRow } from '@/types/schedule'
import {
  departureAt,
  fgcDayTypeFromCalendar,
  toTimeString,
  tripsFor,
  type TripPopulation
} from '@/utils/timetable'

/** Midnight on the day after the one given. */
export const tomorrow = (from = new Date()) =>
  new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1)

/**
 * The departures a date runs, straight off the printed timetable.
 *
 * The feed only answers for today, so this is the only way to show any other
 * day. Which pattern applies comes from the calendar rather than from scoring
 * live data, since there is no live data to score.
 *
 * Rows are marked 'posted': nothing here is missing from anything, so the view
 * must not paint them the way it paints a train the feed dropped.
 */
export const postedRows = (date: Date, population: TripPopulation): MergedScheduleRow[] =>
  tripsFor(fgcDayTypeFromCalendar(date), population, date)
    .map((trip) => ({
      departure_time: toTimeString(departureAt(trip, population.station)!),
      route_short_name: trip.line ?? '',
      source: 'posted' as const,
      trip
    }))
    .sort((a, b) => a.departure_time.localeCompare(b.departure_time))
