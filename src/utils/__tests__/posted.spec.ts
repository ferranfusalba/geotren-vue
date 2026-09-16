import { describe, it, expect } from 'vitest'
import { postedRows, tomorrow } from '@/utils/posted'
import { POPULATIONS, tripsFor } from '@/utils/timetable'

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
