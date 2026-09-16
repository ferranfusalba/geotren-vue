import { describe, it, expect } from 'vitest'

import { e8DayType, isHoliday, isSchoolDay } from '@/data/calendar'
import { e8Timetable } from '@/data/e8Timetable'
import { calendarDisagreesWithFgc, e8TripsFor } from '@/utils/e8'

// Months are zero-based: 8 is September.
const date = (y: number, m: number, d: number) => new Date(y, m - 1, d)

describe('e8DayType', () => {
  it('picks the timetable the poster prints for each kind of day', () => {
    expect(e8DayType(date(2026, 9, 16))).toBe('weekday') // a Wednesday
    expect(e8DayType(date(2026, 9, 19))).toBe('saturday')
    expect(e8DayType(date(2026, 9, 20))).toBe('sundayHoliday')
    expect(e8DayType(date(2026, 12, 25))).toBe('christmas')
    expect(e8DayType(date(2027, 1, 1))).toBe('christmas')
  })

  it('treats a public holiday as a Sunday even midweek', () => {
    // La Diada, a Friday in 2026.
    expect(e8DayType(date(2026, 9, 11))).toBe('sundayHoliday')
  })

  it('derives the Easter holidays rather than relying on a list', () => {
    // Easter Sunday 2026 is 5 April, so Good Friday is the 3rd and Easter
    // Monday the 6th. Computing them is what keeps this from going stale.
    expect(isHoliday(date(2026, 4, 3))).toBe(true)
    expect(isHoliday(date(2026, 4, 6))).toBe(true)
    expect(isHoliday(date(2026, 4, 4))).toBe(false)
    // 2027 moves: Easter is 28 March.
    expect(isHoliday(date(2027, 3, 26))).toBe(true)
    expect(isHoliday(date(2027, 3, 29))).toBe(true)
  })
})

describe('e8TripsFor', () => {
  const weekday = e8Timetable.weekday.fromBarcelona

  it('runs the full weekday service during term time', () => {
    expect(e8TripsFor('fromBarcelona', date(2026, 9, 16))).toHaveLength(weekday.length)
  })

  it('drops the school-only runs outside term time', () => {
    const schoolOnly = weekday.filter((t) => t.schoolDaysOnly).length
    expect(schoolOnly).toBeGreaterThan(0)
    expect(isSchoolDay(date(2026, 12, 28))).toBe(false)

    // 28 December is a Monday, but between terms.
    const trips = e8Timetable.weekday.fromBarcelona.filter((t) => !t.schoolDaysOnly)
    expect(trips).toHaveLength(weekday.length - schoolOnly)
  })

  it('drops the August runs in August', () => {
    const notInAugust = weekday.filter((t) => t.notInAugust).length
    expect(notInAugust).toBeGreaterThan(0)

    // 12 August 2026 is a Wednesday, outside term.
    const running = e8TripsFor('fromBarcelona', date(2026, 8, 12))
    expect(running.every((t) => !t.notInAugust && !t.schoolDaysOnly)).toBe(true)
    expect(running.length).toBeLessThan(weekday.length)
  })

  it('uses the Sunday timetable on a holiday', () => {
    expect(e8TripsFor('fromBarcelona', date(2026, 9, 11))).toHaveLength(
      e8Timetable.sundayHoliday.fromBarcelona.length
    )
  })
})

describe('calendarDisagreesWithFgc', () => {
  it('says nothing when the two agree', () => {
    expect(calendarDisagreesWithFgc('weekday', date(2026, 9, 16))).toBe(false)
    expect(calendarDisagreesWithFgc('saturdayHoliday', date(2026, 9, 11))).toBe(false)
  })

  it('flags a holiday the calendar missed', () => {
    // FGC is running its holiday service on a day the calendar calls ordinary:
    // the hand-written list has gone stale.
    expect(calendarDisagreesWithFgc('saturdayHoliday', date(2026, 9, 16))).toBe(true)
  })

  it('flags a holiday the calendar invented', () => {
    expect(calendarDisagreesWithFgc('weekday', date(2026, 9, 11))).toBe(true)
  })

  it('stays quiet at the weekend, where the two cannot be compared', () => {
    // FGC runs one timetable for Saturdays and holidays alike, so a weekend tells
    // us nothing about whether the holiday list is right.
    expect(calendarDisagreesWithFgc('saturdayHoliday', date(2026, 9, 19))).toBe(false)
    expect(calendarDisagreesWithFgc('saturdayHoliday', date(2026, 9, 20))).toBe(false)
  })
})
