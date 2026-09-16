import { e8DayType, isSchoolDay } from '@/data/calendar'
import { e8Timetable, type E8Direction, type E8Trip } from '@/data/e8Timetable'
import type { DayType } from '@/data/fgcTimetable'

/**
 * The e8 expeditions actually running on a given date.
 *
 * The day type picks one of the four printed timetables; the per-expedition flags
 * then thin it out, because August and the school calendar apply to individual
 * runs rather than to the whole day.
 */
export const e8TripsFor = (direction: E8Direction, date = new Date()): E8Trip[] => {
  const dayType = e8DayType(date)
  const august = date.getMonth() === 7
  const schoolDay = isSchoolDay(date)

  return e8Timetable[dayType][direction].filter((trip) => {
    if (august && trip.notInAugust) return false
    if (trip.schoolDaysOnly && !schoolDay) return false
    return true
  })
}

/**
 * Whether the hand-written calendar agrees with the service FGC is actually
 * running today.
 *
 * FGC's day type is derived from live data, so it is the one source that can
 * notice a holiday nobody wrote down. It does not distinguish Saturday from a
 * public holiday — both run its Saturday/holiday timetable — so only the
 * holiday-vs-weekday disagreement is worth reporting.
 */
export const calendarDisagreesWithFgc = (fgcDayType: DayType, date = new Date()) => {
  const weekend = date.getDay() === 0 || date.getDay() === 6
  if (weekend) return false

  const calendarSaysHoliday = e8DayType(date) !== 'weekday'
  const fgcSaysHoliday = fgcDayType === 'saturdayHoliday'
  return calendarSaysHoliday !== fgcSaysHoliday
}
