import { describe, it, expect } from 'vitest'

import { fgcTimetable, TIMETABLE_STATIONS, type TimetableTrip } from '@/data/fgcTimetable'
import type { Fields } from '@/types/schedule'
import { crossCheckSchedule } from '@/utils/crosscheck'
import {
  departureAt,
  detectDayType,
  POPULATIONS,
  toTimeString,
  tripsFor,
  type TripPopulation
} from '@/utils/timetable'

const MC = TIMETABLE_STATIONS.indexOf('MC')

/** An API row with only the fields the cross-check and the table actually read. */
const apiRow = (departure_time: string, route_short_name: string) =>
  ({ departure_time, route_short_name } as Fields)

/** What the API would return if it reported every printed train faithfully. */
const asApiRows = (trips: TimetableTrip[]) =>
  trips.map((trip) => apiRow(toTimeString(departureAt(trip, 'MC')!), trip.line ?? ''))

describe('tripsFor', () => {
  it('narrows the poster to the population the MC query asks for', () => {
    // The poster covers the whole Pl. Espanya <-> Martorell segment; the MC query
    // only asks for trains calling at MC on their way to Pl. Espanya.
    expect(fgcTimetable.weekday.inbound).toHaveLength(149)
    expect(tripsFor('weekday', POPULATIONS.MC)).toHaveLength(123)
  })

  it('narrows the poster to the population the PE query asks for', () => {
    // The PE query excludes L8/S3/S9, so the poster must drop them too — otherwise
    // every S3 and S9 short working would be reported as a missing train.
    expect(fgcTimetable.weekday.outbound).toHaveLength(148)
    expect(tripsFor('weekday', POPULATIONS.PE)).toHaveLength(122)
  })

  it('excludes trains that do not call at the station', () => {
    const skipping = fgcTimetable.weekday.inbound.filter((trip) => trip.stops[MC] === null)
    expect(skipping).not.toHaveLength(0)

    const narrowed = tripsFor('weekday', POPULATIONS.MC)
    for (const trip of skipping) expect(narrowed).not.toContain(trip)
  })

  it('excludes the lines the query excludes', () => {
    const excluded = tripsFor('weekday', POPULATIONS.PE).filter((trip) =>
      POPULATIONS.PE.excludingLines.includes(trip.line as string)
    )
    expect(excluded).toHaveLength(0)

    // ...and those lines really are in the unfiltered table, so this is not vacuous.
    const present = fgcTimetable.weekday.outbound.filter((trip) => trip.line === 'S3')
    expect(present.length).toBeGreaterThan(0)
  })

  it('rejects an unknown station rather than silently matching nothing', () => {
    expect(() =>
      tripsFor('weekday', { station: 'XX', direction: 'inbound', calling: ['XX'] })
    ).toThrow(/XX/)
  })
})

describe('crossCheckSchedule', () => {
  const trips = tripsFor('weekday', POPULATIONS.MC)

  it('flags nothing when the API reported every printed train', () => {
    const merged = crossCheckSchedule(asApiRows(trips), trips, 'MC')

    expect(merged).toHaveLength(trips.length)
    expect(merged.every((row) => row.source === 'api')).toBe(true)
  })

  it('recovers the trains the API dropped, and only those', () => {
    const dropped = [5, 40, 96]
    const rows = asApiRows(trips.filter((_, index) => !dropped.includes(index)))

    const merged = crossCheckSchedule(rows, trips, 'MC')
    const recovered = merged.filter((row) => row.source === 'timetable')

    expect(merged).toHaveLength(trips.length)
    expect(recovered.map((row) => row.departure_time)).toEqual(
      dropped.map((index) => toTimeString(departureAt(trips[index], 'MC')!))
    )
  })

  it('absorbs a one-minute drift instead of reporting a duplicate', () => {
    // MC->PE really does drift by a minute in places (22.06 printed, 22:07 live).
    const rows = asApiRows(trips).map((row, index) =>
      index === 60 ? apiRow(shiftByAMinute(row.departure_time), row.route_short_name) : row
    )

    const merged = crossCheckSchedule(rows, trips, 'MC')

    expect(merged).toHaveLength(trips.length)
    expect(merged.filter((row) => row.source === 'timetable')).toHaveLength(0)
  })

  it('keeps an API train the poster does not have, unflagged', () => {
    const rows = [...asApiRows(trips), apiRow('19:44:00', 'R6')]

    const merged = crossCheckSchedule(rows, trips, 'MC')
    const extra = merged.filter((row) => row.departure_time === '19:44:00')

    expect(extra).toHaveLength(1)
    expect(extra[0].source).toBe('api')
  })

  it('returns one chronological list across both sources', () => {
    const rows = asApiRows(trips.filter((_, index) => index % 3 !== 0))
    const merged = crossCheckSchedule(rows, trips, 'MC')

    const times = merged.map((row) => row.departure_time)
    expect(times).toEqual([...times].sort())
  })

  it('keeps trains past midnight after the evening ones', () => {
    // Pl. Espanya's last outbound departure is after midnight. The API reports
    // those as 24:xx rather than 00:xx, and so must we, or they sort to the top
    // of the table and the countdown reads a day out.
    const outbound = tripsFor('weekday', POPULATIONS.PE)
    const merged = crossCheckSchedule([], outbound, 'PE')

    const last = merged[merged.length - 1].departure_time
    expect(last).toBe('24:00:00')
    expect(merged.map((row) => row.departure_time)).toEqual(
      [...merged.map((row) => row.departure_time)].sort()
    )
  })
})

describe('detectDayType', () => {
  const timesAt = (dayType: Parameters<typeof tripsFor>[0], population: TripPopulation = POPULATIONS.MC) =>
    tripsFor(dayType, population).map((trip) => departureAt(trip, population.station)!)

  it('picks the pattern the reported times actually match', () => {
    const saturday = new Date(2026, 8, 19)

    expect(detectDayType(timesAt('weekday'), POPULATIONS.MC, saturday)).toBe('weekday')
    expect(detectDayType(timesAt('saturdayHoliday'), POPULATIONS.MC, saturday)).toBe(
      'saturdayHoliday'
    )
  })

  it('works the same for the PE population', () => {
    const weekday = new Date(2026, 8, 16)

    expect(detectDayType(timesAt('augustWeekday', POPULATIONS.PE), POPULATIONS.PE, weekday)).toBe(
      'augustWeekday'
    )
    expect(detectDayType(timesAt('weekday', POPULATIONS.PE), POPULATIONS.PE, weekday)).toBe(
      'weekday'
    )
  })

  it('falls back to the calendar when there is nothing to score', () => {
    expect(detectDayType([], POPULATIONS.MC, new Date(2026, 8, 16))).toBe('weekday')
    expect(detectDayType([], POPULATIONS.MC, new Date(2026, 8, 19))).toBe('saturdayHoliday')
    expect(detectDayType([], POPULATIONS.MC, new Date(2026, 7, 12))).toBe('augustWeekday')
  })
})

const shiftByAMinute = (time: string) => {
  const minutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) + 1
  return toTimeString(minutes)
}
