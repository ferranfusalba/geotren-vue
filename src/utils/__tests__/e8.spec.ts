import { describe, it, expect } from 'vitest'

import { e8DayType, isHoliday, isSchoolDay } from '@/data/calendar'
import { E8_STOPS, e8Timetable } from '@/data/e8Timetable'
import {
  calendarDisagreesWithFgc,
  e8Schedule,
  e8ScheduleLabel,
  e8ScheduleNotice,
  e8TripsFor
} from '@/utils/e8'

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
    // Checked against the council's published dates for both years.
    expect(isHoliday(date(2026, 4, 3))).toBe(true) // Divendres Sant
    expect(isHoliday(date(2026, 4, 6))).toBe(true) // Dilluns de Pasqua Florida
    expect(isHoliday(date(2026, 4, 4))).toBe(false)
    expect(isHoliday(date(2027, 3, 26))).toBe(true)
    expect(isHoliday(date(2027, 3, 29))).toBe(true)
  })

  it('follows Pasqua Granada as it moves', () => {
    // A Barcelona local holiday, fifty days after Easter, so it shifts by weeks
    // between years: a fixed list would be wrong every second year.
    expect(isHoliday(date(2026, 5, 25))).toBe(true)
    expect(isHoliday(date(2027, 5, 17))).toBe(true)
    expect(isHoliday(date(2026, 5, 17))).toBe(false)
    expect(isHoliday(date(2027, 5, 25))).toBe(false)
  })

  it('keeps the local holidays the council lists', () => {
    expect(isHoliday(date(2026, 9, 24))).toBe(true) // La Mercè
    expect(isHoliday(date(2026, 6, 24))).toBe(true) // Sant Joan
  })
})

describe('isSchoolDay', () => {
  it('follows the published 2026-27 term dates', () => {
    expect(isSchoolDay(date(2026, 9, 8))).toBe(true) // first day
    expect(isSchoolDay(date(2026, 9, 7))).toBe(false) // the day before
    expect(isSchoolDay(date(2027, 6, 21))).toBe(true) // last day
    expect(isSchoolDay(date(2027, 6, 22))).toBe(false)
  })

  it('closes for the Christmas and Easter breaks', () => {
    expect(isSchoolDay(date(2026, 12, 22))).toBe(false)
    expect(isSchoolDay(date(2027, 1, 7))).toBe(false)
    expect(isSchoolDay(date(2027, 1, 8))).toBe(true)
    // Setmana Santa falls inside the second term rather than between terms.
    expect(isSchoolDay(date(2027, 3, 22))).toBe(false)
    expect(isSchoolDay(date(2027, 3, 30))).toBe(true)
  })

  it('closes on the days of free disposal', () => {
    // Term time, not a public holiday, but no school — so the school-only buses
    // do not run either.
    expect(isSchoolDay(date(2026, 10, 30))).toBe(false)
    expect(e8DayType(date(2026, 10, 30))).toBe('weekday')
  })

  it('is never a weekend or a public holiday', () => {
    expect(isSchoolDay(date(2026, 9, 19))).toBe(false) // Saturday
    expect(isSchoolDay(date(2026, 9, 24))).toBe(false) // La Mercè, a Thursday
  })
})

describe('e8ScheduleLabel', () => {
  it('splits the weekday sheet by what actually thins it out', () => {
    expect(e8ScheduleLabel(date(2026, 9, 16))).toBe('Feiner lectiu')
    expect(e8ScheduleLabel(date(2026, 10, 30))).toBe('Feiner no lectiu') // free day
    expect(e8ScheduleLabel(date(2026, 12, 28))).toBe('Feiner no lectiu') // between terms
    expect(e8ScheduleLabel(date(2026, 8, 12))).toBe('Feiner agost')
  })

  it('names a Saturday as the poster does', () => {
    expect(e8ScheduleLabel(date(2026, 9, 19))).toBe('Dissabte no festiu')
  })

  it('gives Sundays and holidays one name, because they are one service', () => {
    expect(e8ScheduleLabel(date(2026, 9, 20))).toBe('Diumenges i festius') // a Sunday
    expect(e8ScheduleLabel(date(2026, 9, 11))).toBe('Diumenges i festius') // La Diada
    expect(e8ScheduleLabel(date(2026, 11, 1))).toBe('Diumenges i festius') // both at once
  })

  it('gives a festive Saturday its own name, because it is its own service', () => {
    // The Sunday sheet plus the two night runs that go every Saturday: 19 buses
    // rather than the 17 a festive weekday gets.
    const festiveSaturday = date(2026, 8, 15) // L'Assumpcio, a Saturday
    expect(festiveSaturday.getDay()).toBe(6)
    expect(e8ScheduleLabel(festiveSaturday)).toBe('Dissabte festiu')

    expect(e8TripsFor('fromBarcelona', festiveSaturday)).toHaveLength(19)
    expect(e8TripsFor('fromBarcelona', date(2026, 9, 11))).toHaveLength(17)
  })

  it('stays quiet on an ordinary school weekday, and speaks up otherwise', () => {
    expect(e8ScheduleNotice(date(2026, 9, 16))).toBeNull()
    expect(e8ScheduleNotice(date(2026, 10, 30))?.label).toBe('Feiner no lectiu')
    expect(e8ScheduleNotice(date(2026, 9, 20))?.label).toBe('Diumenges i festius')
  })

  it('carries the colour the poster prints that section in', () => {
    // Sundays, holidays and the Christmas days share one heading colour on the
    // sheet, so they share one tone here.
    expect(e8Schedule(date(2026, 9, 16)).tone).toBe('weekday')
    expect(e8Schedule(date(2026, 8, 12)).tone).toBe('weekday') // Feiner agost
    expect(e8Schedule(date(2026, 9, 19)).tone).toBe('saturday')
    expect(e8Schedule(date(2026, 9, 20)).tone).toBe('holiday')
    expect(e8Schedule(date(2026, 9, 11)).tone).toBe('holiday') // La Diada
    expect(e8Schedule(date(2026, 8, 15)).tone).toBe('holiday') // Dissabte festiu
    expect(e8Schedule(date(2026, 12, 25)).tone).toBe('holiday')
  })

  it('gives the three Christmas days one name, because they are one service', () => {
    const christmas = "Nadal / Sant Esteve / Cap d'any"
    expect(e8ScheduleLabel(date(2026, 12, 25))).toBe(christmas)
    expect(e8ScheduleLabel(date(2026, 12, 26))).toBe(christmas)
    expect(e8ScheduleLabel(date(2027, 1, 1))).toBe(christmas)
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

  it('runs the Sunday timetable on a Saturday that is a holiday', () => {
    // The Saturday sheet reads "Dissabtes no festius", so a festive Saturday is
    // not one of them. 26 December 2026 is a Saturday and Sant Esteve.
    const festiveSaturday = date(2026, 12, 26)
    expect(festiveSaturday.getDay()).toBe(6)
    expect(e8DayType(festiveSaturday)).toBe('christmas')

    // 8 August 2026 is a Saturday; 15 August is a Saturday and L'Assumpcio.
    expect(e8DayType(date(2026, 8, 8))).toBe('saturday')
    expect(e8DayType(date(2026, 8, 15))).toBe('sundayHoliday')
  })

  it('keeps the night runs that go every Saturday of the year', () => {
    // Those two are marked as running whatever the date, so a festive Saturday
    // gets the Sunday service plus them.
    const ordinary = e8TripsFor('fromBarcelona', date(2026, 8, 8))
    const festive = e8TripsFor('fromBarcelona', date(2026, 8, 15))
    const sunday = e8Timetable.sundayHoliday.fromBarcelona

    expect(ordinary).toHaveLength(e8Timetable.saturday.fromBarcelona.length)
    expect(festive).toHaveLength(sunday.length + 2)
    expect(festive.filter((t) => t.everySaturday)).toHaveLength(2)
  })

  it('leaves them out of an ordinary Sunday', () => {
    const sunday = e8TripsFor('fromBarcelona', date(2026, 9, 20))

    expect(sunday.filter((t) => t.everySaturday)).toHaveLength(0)
    expect(sunday).toHaveLength(e8Timetable.sundayHoliday.fromBarcelona.length)
  })

  it('returns the day in order, including the runs past midnight', () => {
    const qc = E8_STOPS.indexOf('QC')
    const festive = e8TripsFor('fromBarcelona', date(2026, 8, 15))
    const times = festive.map((t) => t.stops[qc]!)

    expect(times).toEqual([...times].sort((a, b) => a - b))
    // The night runs belong at the end of the service day, not the start.
    expect(times[times.length - 1]).toBeGreaterThan(24 * 60)
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
