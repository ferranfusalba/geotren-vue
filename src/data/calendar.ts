/**
 * Hand-maintained calendar — unlike the other files in this folder, this one is
 * edited by hand, not generated.
 *
 * The FGC side does not need it: the API reports the service actually running, and
 * detectDayType scores it against the three printed patterns. The e8 has no API at
 * all, so which of its four timetables applies can only come from a calendar.
 *
 * Easter is computed rather than listed, so the two movable holidays never go
 * stale. What does need review each year is FIXED_HOLIDAYS (for local holidays)
 * and SCHOOL_TERMS.
 */
import type { E8DayType } from '@/data/e8Timetable'

/**
 * Catalan public holidays that fall on the same date every year, as MM-DD.
 * e8 runs its Sunday timetable on these, and FGC its Saturday/holiday one.
 */
const FIXED_HOLIDAYS = [
  '01-01', // Cap d'Any
  '01-06', // Reis
  '05-01', // Festa del Treball
  '06-24', // Sant Joan
  '08-15', // L'Assumpció
  '09-11', // Diada Nacional de Catalunya
  '09-24', // La Mercè (Barcelona)
  '10-12', // Festa Nacional d'Espanya
  '11-01', // Tots Sants
  '12-06', // Dia de la Constitució
  '12-08', // La Immaculada
  '12-25', // Nadal
  '12-26' //  Sant Esteve
]

/** The three days the e8 runs its own reduced timetable for. */
const CHRISTMAS_DATES = ['12-25', '12-26', '01-01']

/**
 * Barcelona school-calendar terms. Only the fourteen "dies lectius" expeditions
 * depend on these; everything else runs regardless.
 *
 * REVIEW EACH SUMMER when the Generalitat publishes the new calendar.
 */
export const SCHOOL_TERMS: { from: string; to: string }[] = [
  { from: '2026-09-07', to: '2026-12-21' },
  { from: '2027-01-08', to: '2027-06-18' }
]

/** The anonymous Gregorian algorithm; returns Easter Sunday for a given year. */
const easterSunday = (year: number) => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`

const shift = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)

/** Divendres Sant and Dilluns de Pasqua, derived rather than listed. */
const easterHolidays = (year: number) => {
  const easter = easterSunday(year)
  return [iso(shift(easter, -2)), iso(shift(easter, 1))]
}

export const isHoliday = (date: Date) =>
  FIXED_HOLIDAYS.includes(iso(date).slice(5)) ||
  easterHolidays(date.getFullYear()).includes(iso(date))

export const isSchoolDay = (date: Date) => {
  const day = iso(date)
  return SCHOOL_TERMS.some((term) => day >= term.from && day <= term.to)
}

/** Which of the e8's four printed timetables applies on a given date. */
export const e8DayType = (date: Date): E8DayType => {
  if (CHRISTMAS_DATES.includes(iso(date).slice(5))) return 'christmas'
  if (date.getDay() === 0 || isHoliday(date)) return 'sundayHoliday'
  if (date.getDay() === 6) return 'saturday'
  return 'weekday'
}
