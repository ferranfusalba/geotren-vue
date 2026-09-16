import { describe, it, expect } from 'vitest'
import { pairE8WithTrains, pairTrainsWithE8 } from '@/utils/connection'
import { e8TripsFor } from '@/utils/e8'
import { postedRows, tomorrow } from '@/utils/posted'
import { departureAt, POPULATIONS, toClock, tripsFor } from '@/utils/timetable'

describe('tomorrow', () => {
  it('rolls over into the next day at midnight', () => {
    const friday = new Date(2026, 8, 18, 22, 30)
    expect(tomorrow(friday)).toEqual(new Date(2026, 8, 19, 0, 0, 0, 0))
  })

  it('crosses a month and a year end', () => {
    expect(tomorrow(new Date(2026, 8, 30))).toEqual(new Date(2026, 9, 1))
    expect(tomorrow(new Date(2026, 11, 31))).toEqual(new Date(2027, 0, 1))
  })
})

describe('postedRows', () => {
  const friday = new Date(2026, 8, 18)
  const saturday = new Date(2026, 8, 19)

  it('reads the pattern the calendar says that date runs', () => {
    expect(postedRows(friday, POPULATIONS.MC)).toHaveLength(
      tripsFor('weekday', POPULATIONS.MC).length
    )
    expect(postedRows(saturday, POPULATIONS.MC)).toHaveLength(
      tripsFor('saturdayHoliday', POPULATIONS.MC).length
    )
  })

  it('marks every row as posted, so nothing is painted as missing', () => {
    expect(postedRows(saturday, POPULATIONS.MC).every((row) => row.source === 'posted')).toBe(true)
  })

  it('comes out in departure order, with the small hours last', () => {
    const times = postedRows(friday, POPULATIONS.MC).map((row) => row.departure_time)
    expect([...times].sort()).toEqual(times)
    expect(times[0] < times[times.length - 1]).toBe(true)
  })

  it('carries the trip through, so a view can read its other stops', () => {
    expect(postedRows(friday, POPULATIONS.MC).every((row) => row.trip)).toBe(true)
  })
})

describe('postedRows as the connection views read it', () => {
  const saturday = new Date(2026, 8, 19)

  it('carries a QC time on every row, which is what the pairing needs', () => {
    for (const population of [POPULATIONS.QC_TO_MC, POPULATIONS.MC_TO_QC]) {
      const rows = postedRows(saturday, population)
      expect(rows.length).toBeGreaterThan(0)
      for (const row of rows) expect(departureAt(row.trip!, 'QC')).not.toBeNull()
    }
  })

  it('pairs with the buses of the same day in both directions', () => {
    const inbound = pairE8WithTrains(
      e8TripsFor('fromBarcelona', saturday),
      postedRows(saturday, POPULATIONS.QC_TO_MC)
    )
    const outbound = pairTrainsWithE8(
      postedRows(saturday, POPULATIONS.MC_TO_QC),
      e8TripsFor('toBarcelona', saturday)
    )

    // Not every train gets a bus, but a Saturday's worth of buses must land.
    expect(inbound.filter((row) => row.e8).length).toBeGreaterThan(20)
    expect(outbound.filter((row) => row.bus).length).toBeGreaterThan(20)

    // And a bus that has not left yet cannot be matched to a train already gone.
    for (const row of inbound) {
      if (row.e8) expect(row.e8.slack).toBeGreaterThanOrEqual(2)
    }
    for (const row of outbound) {
      if (row.bus) expect(row.bus.slack).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('toClock', () => {
  it('reads the small hours as a clock does, however far the timetable runs on', () => {
    expect(toClock(5 * 60 + 31)).toBe('05:31')
    expect(toClock(24 * 60 + 20)).toBe('00:20')
    expect(toClock(25 * 60 + 19)).toBe('01:19')
    // The e8's last Saturday arrival, which the old two-case rule printed as 27:08.
    expect(toClock(27 * 60 + 8)).toBe('03:08')
  })
})
