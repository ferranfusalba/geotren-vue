import { e8DayType, isHoliday, isSchoolDay } from '@/data/calendar'
import { E8_STOPS, e8Timetable, type E8Direction, type E8Trip } from '@/data/e8Timetable'
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

  const trips = e8Timetable[dayType][direction].filter((trip) => {
    if (august && trip.notInAugust) return false
    if (trip.schoolDaysOnly && !schoolDay) return false
    return true
  })

  // The Saturday sheet is headed "Dissabtes no festius", so a Saturday that is
  // also a holiday runs the Sunday timetable instead — bar the night runs marked
  // as going every Saturday of the year, which is the whole point of that mark.
  if (dayType === 'sundayHoliday' && date.getDay() === 6) {
    trips.push(...e8Timetable.saturday[direction].filter((trip) => trip.everySaturday))
  }

  const qc = E8_STOPS.indexOf('QC')
  return trips.sort((a, b) => (a.stops[qc] ?? 0) - (b.stops[qc] ?? 0))
}

/** The ordinary school weekday — the default, not worth announcing. */
export const DEFAULT_SCHEDULE = 'Feiner lectiu'

/**
 * The colour the poster prints each of its sections in. Sundays, holidays and
 * the Christmas days all share one on the sheet itself, so they do here too.
 */
export type E8ScheduleTone = 'weekday' | 'saturday' | 'holiday'

export interface E8Schedule {
  label: string
  tone: E8ScheduleTone
}

export const e8Schedule = (date = new Date()): E8Schedule => {
  const dayType = e8DayType(date)
  const tone: E8ScheduleTone =
    dayType === 'weekday' ? 'weekday' : dayType === 'saturday' ? 'saturday' : 'holiday'

  return { label: e8ScheduleLabel(date), tone }
}

/**
 * The same, but only when it is worth showing: silent on an ordinary school
 * weekday, so the line earns its place on the screen when it appears.
 */
export const e8ScheduleNotice = (date = new Date()): E8Schedule | null => {
  const schedule = e8Schedule(date)
  return schedule.label === DEFAULT_SCHEDULE ? null : schedule
}

/**
 * Which service is running, named the way the poster names it.
 *
 * One label per distinct set of buses, no more and no less. It is finer than the
 * four printed sheets where the sheet alone does not say what runs — August and
 * the school calendar thin out individual expeditions — and coarser where two
 * kinds of day run exactly the same service, as a Sunday and a holiday do.
 *
 * scripts/audit-e8-labels.ts checks that one-to-one mapping holds across a year.
 */
export const e8ScheduleLabel = (date = new Date()) => {
  switch (e8DayType(date)) {
    case 'christmas':
      return "Nadal / Sant Esteve / Cap d'any"
    case 'sundayHoliday':
      // A festive Saturday is its own service: the Sunday sheet plus the night
      // runs marked as going every Saturday of the year. Two days a year.
      if (date.getDay() === 6 && isHoliday(date)) return 'Dissabte festiu'
      return 'Diumenges i festius'
    case 'saturday':
      return 'Dissabte no festiu'
    default:
      if (date.getMonth() === 7) return 'Feiner agost'
      return isSchoolDay(date) ? 'Feiner lectiu' : 'Feiner no lectiu'
  }
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
